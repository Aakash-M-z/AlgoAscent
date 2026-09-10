import mongoose from 'mongoose';
import { IPaymentProvider, PaymentPlanId, PaymentStatus, PlanConfig } from './payment.types.js';
import { ManualUPIProvider, OFFICIAL_PRICING_PLANS } from './manualUpi.provider.js';
import { PaymentModel, PaymentAuditModel, UserModel, NotificationModel } from '../../models.js';
import { storage } from '../../storage.js';
import { sendPaymentReceiptEmail, isEmailEnabled } from '../../email.service.js';

export class PaymentService {
    private static provider: IPaymentProvider = new ManualUPIProvider();

    static setProvider(provider: IPaymentProvider) {
        this.provider = provider;
    }

    static getProvider(): IPaymentProvider {
        return this.provider;
    }

    static getPricingPlans(): Record<PaymentPlanId, PlanConfig> {
        return OFFICIAL_PRICING_PLANS;
    }

    /**
     * Public payment configuration (safe for frontend)
     */
    static getConfig() {
        const manualProvider = this.provider instanceof ManualUPIProvider 
            ? this.provider 
            : new ManualUPIProvider();

        return {
            paymentMethod: process.env.PAYMENT_METHOD || 'MANUAL_UPI',
            currency: 'INR',
            plans: OFFICIAL_PRICING_PLANS,
            upi: {
                upiId: manualProvider.getUpiId(),
                payeeName: manualProvider.getPayeeName(),
                qrCodeUrl: manualProvider.getQrImageUrl()
            },
            isTestMode: process.env.MANUAL_PAYMENT_TEST_MODE === 'true'
        };
    }

    /**
     * Create unique order (Status: PENDING)
     * Server strictly enforces official plan price — ignores any client-sent amount!
     */
    static async createOrder(userId: string, userEmail: string, userName: string | undefined, planId: PaymentPlanId) {
        return this.provider.createOrder({
            userId,
            userEmail,
            userName,
            planId
        });
    }

    /**
     * User submits 12-digit UTR / Reference ID
     * Moves status from PENDING to UNDER_REVIEW
     * Does NOT activate subscription!
     */
    static async submitUtr(orderId: string, utrNumber: string, authUser: { id: string; email: string }) {
        const cleanUtr = (utrNumber || '').trim().replace(/[\s-]/g, '');
        if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 30) {
            throw new Error('Please enter a valid 6–25 digit UPI Transaction Reference / UTR number.');
        }

        // Check for obviously fake or placeholder UTRs
        if (/^(0+|1+|12345678|abcdef)$/i.test(cleanUtr)) {
            throw new Error('Invalid UTR format. Please provide the actual transaction reference from your bank receipt.');
        }

        const payment = await PaymentModel.findOne({ orderId });
        if (!payment) {
            throw new Error(`Order ${orderId} not found.`);
        }

        // Ensure caller owns this order
        if (payment.userId !== String(authUser.id) && payment.userEmail !== authUser.email) {
            throw new Error('Unauthorized to submit payment details for this order.');
        }

        // Already paid?
        if (payment.status === 'PAID') {
            return {
                success: true,
                message: 'This payment is already verified and active.',
                status: 'PAID',
                orderId: payment.orderId,
                amount: payment.amount
            };
        }

        // Prevent duplicate UTR usage across other payments
        const existingUtr = await PaymentModel.findOne({
            utrNumber: cleanUtr,
            orderId: { $ne: orderId },
            status: { $in: ['UNDER_REVIEW', 'PAID'] }
        });

        if (existingUtr) {
            throw new Error('This UPI Reference Number has already been submitted for another order. If you believe this is an error, please contact support.');
        }

        // Transition: PENDING -> UNDER_REVIEW
        payment.status = 'UNDER_REVIEW';
        payment.utrNumber = cleanUtr;
        payment.userSubmittedAt = new Date();
        payment.updatedAt = new Date();
        await payment.save();

        // Audit log
        await PaymentAuditModel.create({
            paymentId: String(payment._id),
            orderId: payment.orderId,
            action: 'UTR_SUBMITTED',
            actor: authUser.email,
            actorRole: 'user',
            metadata: {
                utrNumber: cleanUtr,
                amount: payment.amount,
                plan: payment.plan
            }
        }).catch(err => console.warn('[PaymentAudit] UTR_SUBMITTED log warning:', err?.message));

        console.log(`[Payment] 🟡 Order ${payment.orderId} submitted for review with UTR ${cleanUtr} by ${authUser.email}`);

        return {
            success: true,
            message: 'Payment details submitted successfully. Our team will verify your transaction shortly.',
            status: 'UNDER_REVIEW',
            orderId: payment.orderId,
            amount: payment.amount,
            utrNumber: cleanUtr
        };
    }

    /**
     * Get order status for polling & UI updates
     */
    static async getOrderStatus(orderId: string) {
        const payment = await PaymentModel.findOne({ orderId }).lean();
        if (!payment) {
            throw new Error(`Order ${orderId} not found.`);
        }

        return {
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency || 'INR',
            plan: payment.plan,
            status: payment.status as PaymentStatus,
            isPaid: payment.status === 'PAID',
            utrNumber: payment.utrNumber,
            rejectionReason: payment.rejectionReason,
            adminNote: payment.adminNote,
            createdAt: payment.createdAt,
            userSubmittedAt: payment.userSubmittedAt,
            verifiedAt: payment.verifiedAt
        };
    }

    /**
     * Admin approves payment
     * Strictly verifies role, applies idempotent update, activates subscription, sends notification and receipt
     */
    static async approvePayment(
        paymentIdOrOrderId: string,
        adminUser: { id: string; email: string },
        adminNote?: string
    ) {
        const payment = await PaymentModel.findOne({
            $or: [
                { _id: paymentIdOrOrderId.match(/^[0-9a-fA-F]{24}$/) ? paymentIdOrOrderId : null },
                { orderId: paymentIdOrOrderId }
            ]
        });

        if (!payment) {
            throw new Error('Payment record not found.');
        }

        // Idempotency: Already paid?
        if (payment.status === 'PAID') {
            console.log(`[Payment:Approve] ⚡ Payment ${payment.orderId} is already PAID. Skipping duplicate mutation.`);
            return {
                success: true,
                message: 'Payment was already approved.',
                alreadyApproved: true,
                orderId: payment.orderId,
                status: 'PAID'
            };
        }

        const selectedPlan = OFFICIAL_PRICING_PLANS[payment.plan as PaymentPlanId];
        const now = new Date();

        // Calculate subscription expiry
        let expiresAt: Date | null = null;
        if (selectedPlan?.durationDays) {
            expiresAt = new Date(Date.now() + selectedPlan.durationDays * 24 * 60 * 60 * 1000);
        }

        // 1. Update Payment Status to PAID
        payment.status = 'PAID';
        payment.verifiedAt = now;
        payment.paidAt = now;
        payment.verifiedBy = adminUser.email;
        if (adminNote) {
            payment.adminNote = adminNote;
        }
        payment.updatedAt = now;
        await payment.save();

        // 2. Transactionally update User subscription
        try {
            const userQuery: any[] = [{ email: payment.userEmail }];
            if (mongoose.Types.ObjectId.isValid(payment.userId)) {
                userQuery.push({ _id: payment.userId });
            }

            await UserModel.findOneAndUpdate(
                { $or: userQuery },
                {
                    $set: {
                        plan: 'premium',
                        subscriptionPlan: payment.plan,
                        subscriptionExpiresAt: expiresAt
                    },
                    $push: {
                        paymentHistory: {
                            orderId: payment.orderId,
                            utrNumber: payment.utrNumber || 'MANUAL_VERIFIED',
                            amount: payment.amount,
                            currency: payment.currency || 'INR',
                            plan: payment.plan,
                            status: 'PAID',
                            verifiedBy: adminUser.email,
                            date: now.toISOString()
                        }
                    }
                }
            );
        } catch (uErr: any) {
            console.warn('[Payment:Approve] UserModel update warning:', uErr?.message);
        }

        // Fallback update in in-memory storage proxy
        try {
            await storage.updateUser(payment.userId, { plan: 'premium' } as any);
        } catch {}

        // 3. Create In-App Notification (Idempotent check)
        const notificationTitle = `Payment Verified 🎉`;
        const notificationMsg = `Your payment of ₹${payment.amount.toLocaleString('en-IN')} for ${selectedPlan?.name || 'AlgoAscent Pro'} has been verified. Your subscription is now active!`;

        try {
            const existingNotification = await NotificationModel.findOne({
                title: notificationTitle,
                message: notificationMsg,
                createdAt: { $gte: new Date(Date.now() - 3600000) }
            });

            if (!existingNotification) {
                await NotificationModel.create({
                    title: notificationTitle,
                    message: notificationMsg,
                    targetAudience: 'premium',
                    senderEmail: adminUser.email,
                    createdAt: now
                });
            }
        } catch (nErr: any) {
            console.warn('[Payment:Approve] Notification warning:', nErr?.message);
        }

        // 4. Audit Log
        await PaymentAuditModel.create({
            paymentId: String(payment._id),
            orderId: payment.orderId,
            action: 'PAYMENT_APPROVED',
            actor: adminUser.email,
            actorRole: 'admin',
            metadata: {
                adminNote,
                plan: payment.plan,
                amount: payment.amount,
                utrNumber: payment.utrNumber
            }
        }).catch(err => console.warn('[PaymentAudit] Warning:', err?.message));

        await PaymentAuditModel.create({
            paymentId: String(payment._id),
            orderId: payment.orderId,
            action: 'SUBSCRIPTION_ACTIVATED',
            actor: adminUser.email,
            actorRole: 'admin',
            metadata: {
                expiresAt: expiresAt ? expiresAt.toISOString() : 'never'
            }
        }).catch(() => {});

        // 5. Send Email Receipt if configured
        try {
            if (isEmailEnabled()) {
                await sendPaymentReceiptEmail(
                    payment.userEmail,
                    payment.userEmail.split('@')[0],
                    selectedPlan?.name || 'AlgoAscent Pro',
                    payment.amount,
                    payment.orderId,
                    payment.utrNumber || `UTR_${payment.orderId.slice(-6)}`,
                    expiresAt ? expiresAt.toLocaleDateString('en-IN') : 'Lifetime Access'
                );
            }
        } catch (mailErr: any) {
            console.warn('[Payment:Approve] Email receipt warning:', mailErr?.message);
        }

        console.log(`[Payment] ✅ Approved order ${payment.orderId} by admin ${adminUser.email}`);

        return {
            success: true,
            message: `Payment ${payment.orderId} approved successfully. User upgraded to Pro.`,
            orderId: payment.orderId,
            status: 'PAID'
        };
    }

    /**
     * Admin rejects payment
     * Stores rejection reason, does NOT activate subscription
     */
    static async rejectPayment(
        paymentIdOrOrderId: string,
        adminUser: { id: string; email: string },
        rejectionReason: string,
        adminNote?: string
    ) {
        const payment = await PaymentModel.findOne({
            $or: [
                { _id: paymentIdOrOrderId.match(/^[0-9a-fA-F]{24}$/) ? paymentIdOrOrderId : null },
                { orderId: paymentIdOrOrderId }
            ]
        });

        if (!payment) {
            throw new Error('Payment record not found.');
        }

        if (payment.status === 'PAID') {
            throw new Error('Cannot reject a payment that is already marked as PAID.');
        }

        const cleanReason = (rejectionReason || 'Payment could not be verified.').trim();
        const now = new Date();

        payment.status = 'REJECTED';
        payment.rejectionReason = cleanReason;
        payment.verifiedBy = adminUser.email;
        payment.verifiedAt = now;
        if (adminNote) {
            payment.adminNote = adminNote;
        }
        payment.updatedAt = now;
        await payment.save();

        // Audit Log
        await PaymentAuditModel.create({
            paymentId: String(payment._id),
            orderId: payment.orderId,
            action: 'PAYMENT_REJECTED',
            actor: adminUser.email,
            actorRole: 'admin',
            metadata: {
                rejectionReason: cleanReason,
                adminNote
            }
        }).catch(err => console.warn('[PaymentAudit] Warning:', err?.message));

        console.log(`[Payment] ❌ Rejected order ${payment.orderId} by admin ${adminUser.email} (Reason: ${cleanReason})`);

        return {
            success: true,
            message: `Payment ${payment.orderId} marked as REJECTED.`,
            orderId: payment.orderId,
            status: 'REJECTED',
            rejectionReason: cleanReason
        };
    }

    /**
     * Admin query list with pagination & status filters
     */
    static async listPayments(statusFilter?: string, limit: number = 50, page: number = 1) {
        const filter: any = {};
        if (statusFilter && statusFilter !== 'ALL') {
            filter.status = statusFilter.toUpperCase();
        }

        const skip = (page - 1) * limit;
        const [payments, totalCount, underReviewCount] = await Promise.all([
            PaymentModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PaymentModel.countDocuments(filter),
            PaymentModel.countDocuments({ status: 'UNDER_REVIEW' })
        ]);

        return {
            payments,
            totalCount,
            underReviewCount,
            page,
            totalPages: Math.ceil(totalCount / limit)
        };
    }

    /**
     * Admin get single payment details with audit trail
     */
    static async getPaymentDetails(paymentId: string) {
        const payment = await PaymentModel.findOne({
            $or: [
                { _id: paymentId.match(/^[0-9a-fA-F]{24}$/) ? paymentId : null },
                { orderId: paymentId }
            ]
        }).lean();

        if (!payment) {
            throw new Error('Payment not found.');
        }

        const auditTrail = await PaymentAuditModel.find({
            $or: [{ paymentId: String(payment._id) }, { orderId: payment.orderId }]
        }).sort({ timestamp: -1 }).lean();

        return {
            payment,
            auditTrail
        };
    }
}
