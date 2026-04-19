import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage.js';
import { verifyToken, extractBearer } from './jwt.js';
import {
    sendPasswordResetEmail,
    verifyPasswordResetToken,
    consumePasswordResetToken,
} from './email.service.js';

const router = Router();

// ── Input schemas ─────────────────────────────────────────────────────────────
const ForgotPasswordSchema = z.object({
    email: z.string().email().max(255).transform(s => s.trim().toLowerCase()),
});

const ResetPasswordSchema = z.object({
    token: z.string().length(64),
    email: z.string().email().max(255).transform(s => s.trim().toLowerCase()),
    newPassword: z.string().min(8).max(128),
});

// ── Auth middleware ───────────────────────────────────────────────────────────
export async function authenticate(req: any, res: any, next: any) {
    const token = extractBearer(req.headers.authorization);
    if (!token) return res.status(401).json({ error: 'Missing authentication token' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

    const user = await storage.getUser(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
}

// ── GET /api/user/profile ─────────────────────────────────────────────────────
router.get('/profile', authenticate, (req: any, res: any) => {
    const { password, ...safeUser } = req.user;
    res.json(safeUser);
});

// ── PUT /api/user/profile ─────────────────────────────────────────────────────
router.put('/profile', authenticate, async (req: any, res: any) => {
    try {
        const { name, email, profileImage, learningGoal } = req.body;

        if (email && !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (profileImage !== undefined) updateData.profileImage = profileImage;
        if (learningGoal !== undefined) updateData.learningGoal = learningGoal;

        const updatedUser = await storage.updateUser(req.user.id, updateData);
        if (!updatedUser) return res.status(500).json({ error: 'Failed to update user' });

        const { password, ...safeUser } = updatedUser;
        res.json(safeUser);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /api/user/forgot-password ────────────────────────────────────────────
/**
 * Always returns 200 regardless of whether the email exists.
 * Prevents email enumeration attacks.
 */
router.post('/forgot-password', async (req: any, res: any) => {
    const result = ForgotPasswordSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Valid email required' });
    }

    try {
        const user = await storage.getUserByEmail(result.data.email);
        if (user) {
            // Fire-and-forget — never block the response on email delivery
            sendPasswordResetEmail(user.email, user.username).catch(err =>
                console.error('[forgot-password] Email send failed:', err?.message)
            );
        }
        res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    } catch (err: any) {
        console.error('[forgot-password] Error:', err?.message);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ── POST /api/user/reset-password ─────────────────────────────────────────────
router.post('/reset-password', async (req: any, res: any) => {
    const result = ResetPasswordSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Invalid request', details: result.error.flatten() });
    }

    const { token, email, newPassword } = result.data;

    try {
        const validEmail = await verifyPasswordResetToken(token, email);
        if (!validEmail) {
            return res.status(400).json({
                error: 'Reset link is invalid or has expired. Please request a new one.',
            });
        }

        const user = await storage.getUserByEmail(email);
        if (!user) return res.status(400).json({ error: 'Account not found.' });

        await storage.updateUser(user.id, { password: newPassword });

        // One-time use — delete token immediately after use
        await consumePasswordResetToken(token, email);

        res.json({ message: 'Password updated successfully. You can now sign in.' });
    } catch (err: any) {
        console.error('[reset-password] Error:', err?.message);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

export default router;
