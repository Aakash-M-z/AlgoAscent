import crypto from 'crypto';
import { IPaymentProvider, CreateOrderParams, OrderResult, PlanConfig, PaymentPlanId } from './payment.types.js';
import { PaymentModel, PaymentAuditModel } from '../../models.js';

export const OFFICIAL_PRICING_PLANS: Record<PaymentPlanId, PlanConfig> = {
    monthly: {
        id: 'monthly',
        name: 'Pro Monthly',
        amount: Number(process.env.PREMIUM_PRICE_MONTHLY) || 299,
        amountInPaise: (Number(process.env.PREMIUM_PRICE_MONTHLY) || 299) * 100,
        billingCycle: 'monthly',
        durationDays: 30,
        description: 'Flexible month-to-month access to AlgoAscent Pro features.',
        features: [
            'Unlimited AI Code Explanations & Hints',
            'Full Assessment Studio & Proctoring Reports',
            'Advanced Performance Analytics & Streaks',
            'Spaced Repetition Review Engine'
        ]
    },
    annual: {
        id: 'annual',
        name: 'Pro Annual',
        amount: Number(process.env.PREMIUM_PRICE_ANNUAL) || 2499,
        amountInPaise: (Number(process.env.PREMIUM_PRICE_ANNUAL) || 2499) * 100,
        billingCycle: 'annual',
        durationDays: 365,
        badge: 'Best Value (Save 30%)',
        description: 'Comprehensive 1-year prep pack with priority AI features.',
        features: [
            'Everything in Monthly Pro',
            'Priority AI GPU Queuing (Zero wait-time)',
            'Unlimited Assessment Creation & Invites',
            'Verified Pro Crown Badge on Leaderboards',
            'Direct Access to Curated Top-Company Question Banks'
        ]
    },
    lifetime: {
        id: 'lifetime',
        name: 'Lifetime Pass',
        amount: Number(process.env.PREMIUM_PRICE_LIFETIME) || 4999,
        amountInPaise: (Number(process.env.PREMIUM_PRICE_LIFETIME) || 4999) * 100,
        billingCycle: 'one-time',
        durationDays: null,
        badge: 'One-Time Payment',
        description: 'Pay once, enjoy permanent access to current and future features.',
        features: [
            'Lifetime Unlimited Access to all Pro features',
            'All Future Product Updates & AI Models included',
            'Exclusive Lifetime Elite Discord/Community Role',
            'Dedicated 1-on-1 Candidate Resume Review Guide'
        ]
    }
};

export class ManualUPIProvider implements IPaymentProvider {
    readonly name = 'MANUAL_UPI';

    getQrImageUrl(): string {
        return process.env.UPI_QR_IMAGE || '/payment/gpay-qr.png';
    }

    getUpiId(): string {
        return process.env.UPI_ID || 'aakashleo420@okicici';
    }

    getPayeeName(): string {
        return process.env.UPI_PAYEE_NAME || 'Aakash Leo';
    }

    async createOrder(params: CreateOrderParams): Promise<OrderResult> {
        const plan = OFFICIAL_PRICING_PLANS[params.planId];
        if (!plan) {
            throw new Error(`Invalid plan selected: ${params.planId}`);
        }

        // Format: ALG-YYYYMMDD-XXXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const entropy = crypto.randomBytes(3).toString('hex').toUpperCase();
        const orderId = `ALG-${dateStr}-${entropy}`;

        const upiId = this.getUpiId();
        const payeeName = this.getPayeeName();
        const qrCodeUrl = this.getQrImageUrl();

        // 1. Create DB Payment record with PENDING status
        const payment = await PaymentModel.create({
            orderId,
            userId: params.userId,
            userEmail: params.userEmail,
            plan: plan.id,
            billingCycle: plan.billingCycle,
            amount: plan.amount,
            amountInPaise: plan.amountInPaise,
            currency: 'INR',
            status: 'PENDING',
            paymentMethod: 'MANUAL_UPI',
            qrImageUrl: qrCodeUrl,
            upiId,
            metadata: {
                payeeName,
                planName: plan.name,
                userName: params.userName || params.userEmail
            }
        });

        // 2. Audit trail
        await PaymentAuditModel.create({
            paymentId: String(payment._id),
            orderId,
            action: 'PAYMENT_CREATED',
            actor: params.userEmail,
            actorRole: 'user',
            metadata: {
                planId: plan.id,
                amount: plan.amount
            }
        }).catch(err => console.warn('[PaymentAudit] Warning:', err?.message));

        console.log(`[Payment] 🧾 New order created: ${orderId} for ${params.userEmail} (₹${plan.amount})`);

        return {
            orderId,
            amount: plan.amount,
            currency: 'INR',
            plan,
            status: 'PENDING',
            qrCodeUrl,
            upiId,
            payeeName,
            instructions: [
                'Scan the GPay QR code using any UPI app (GPay, PhonePe, Paytm, BHIM)',
                `Transfer the exact amount: ₹${plan.amount.toLocaleString('en-IN')}`,
                'Find your 12-digit UPI Reference Number / UTR in your payment receipt',
                'Submit the UTR number for verification'
            ]
        };
    }
}
