import { Router, Request, Response, NextFunction } from 'express';
import { PaymentService } from './services/payment/payment.service.js';
import { PaymentModel, UserModel } from './models.js';
import { extractBearer, verifyToken } from './jwt.js';

const router = Router();

// ── Middleware: Require Active Premium Subscription ──────────────────────────
export const requirePremium = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = extractBearer(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const payload = verifyToken(token);
        if (!payload) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Admin bypass
        if (payload.role === 'admin') {
            (req as any).user = payload;
            return next();
        }

        const user = await UserModel.findById(payload.id).lean();
        if (!user || user.plan !== 'premium') {
            return res.status(403).json({
                error: 'PREMIUM_REQUIRED',
                message: 'This resource requires an active AlgoAscent Pro subscription. Please upgrade to continue.'
            });
        }

        // Check subscription expiry if applicable
        if (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < new Date()) {
            return res.status(403).json({
                error: 'SUBSCRIPTION_EXPIRED',
                message: 'Your Pro subscription has expired. Please renew to regain access.'
            });
        }

        (req as any).user = user;
        next();
    } catch (err: any) {
        return res.status(500).json({ error: 'Subscription authorization failed' });
    }
};

function getAuthUser(req: Request) {
    let user = (req as any).authUser || (req as any).user;
    if (!user) {
        const token = extractBearer(req.headers.authorization);
        if (token) {
            user = verifyToken(token);
        }
    }
    return user;
}

// ── GET /api/payments/config ─────────────────────────────────────────────────
router.get('/config', (_req: Request, res: Response) => {
    try {
        const config = PaymentService.getConfig();
        res.json(config);
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to fetch payment configuration' });
    }
});

// ── POST /api/payments/create & /create-order ─────────────────────────────────
router.post(['/create', '/create-order'], async (req: Request, res: Response) => {
    try {
        const user = getAuthUser(req);
        const { planId } = req.body as { planId: 'monthly' | 'annual' | 'lifetime' };
        if (!planId || !['monthly', 'annual', 'lifetime'].includes(planId)) {
            return res.status(400).json({ error: 'Invalid plan selected. Choose monthly, annual, or lifetime.' });
        }

        const userId = user?.id ? String(user.id) : `guest_${Date.now()}`;
        const userEmail = user?.email || 'candidate@algoascent.dev';
        const userName = user?.name || user?.username || 'Candidate';

        const order = await PaymentService.createOrder(
            userId,
            userEmail,
            userName,
            planId
        );

        res.json(order);
    } catch (err: any) {
        console.error('[Payments:create] Error:', err);
        res.status(500).json({ error: err.message || 'Failed to initialize payment order' });
    }
});

// ── POST /api/payments/:orderId/submit-utr & /submit-upi ──────────────────────
router.post(['/:orderId/submit-utr', '/submit-upi', '/submit-utr'], async (req: Request, res: Response) => {
    try {
        const user = getAuthUser(req);
        if (!user || !user.id) {
            return res.status(401).json({ error: 'Please sign in to submit and link your payment to your account.' });
        }

        const rawOrderId = req.params.orderId || req.body.orderId;
        const utrNumber = req.body.utrNumber || req.body.utr;

        if (!rawOrderId) {
            return res.status(400).json({ error: 'Order ID is required.' });
        }
        if (!utrNumber) {
            return res.status(400).json({ error: 'UPI UTR / Reference Number is required.' });
        }

        const orderId = String(rawOrderId);
        const result = await PaymentService.submitUtr(orderId, String(utrNumber), {
            id: String(user.id),
            email: user.email
        });

        res.json(result);
    } catch (err: any) {
        console.warn('[Payments:submit-utr] Error:', err.message);
        res.status(400).json({ error: err.message || 'Failed to submit payment details' });
    }
});

// ── GET /api/payments/:orderId/status ────────────────────────────────────────
router.get('/:orderId/status', async (req: Request, res: Response) => {
    try {
        const rawOrderId = req.params.orderId;
        if (!rawOrderId) {
            return res.status(400).json({ error: 'orderId parameter is required' });
        }

        const orderId = String(rawOrderId);
        const status = await PaymentService.getOrderStatus(orderId);
        res.json(status);
    } catch (err: any) {
        res.status(404).json({ error: err.message || 'Order not found' });
    }
});

// ── GET /api/payments/history ────────────────────────────────────────────────
router.get('/history', async (req: Request, res: Response) => {
    try {
        const user = getAuthUser(req);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const payments = await PaymentModel.find({
            $or: [{ userId: String(user.id) }, { userEmail: user.email }]
        }).sort({ createdAt: -1 }).lean();

        res.json({
            payments,
            activeSubscription: {
                plan: user.plan,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionExpiresAt: user.subscriptionExpiresAt
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Failed to retrieve payment history' });
    }
});

// ── GET /api/payments/premium-content — Test Protected Route ─────────────────
router.get('/premium-content', requirePremium, (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Access granted to premium resources.',
        user: (req as any).user
    });
});

// ── POST /api/payments/test-mode/simulate-approve — Dev Only ─────────────────
router.post('/:orderId/dev-simulate-approve', async (req: Request, res: Response) => {
    if (process.env.MANUAL_PAYMENT_TEST_MODE !== 'true' && process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: 'Test simulation is disabled in production.' });
    }

    try {
        const user = (req as any).user;
        const orderId = String(req.params.orderId);
        const result = await PaymentService.approvePayment(
            orderId,
            { id: user?.id || 'dev_admin', email: user?.email || 'admin@algoascent.dev' },
            'Simulated approval in test mode'
        );
        res.json(result);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
