export type PaymentPlanId = 'monthly' | 'annual' | 'lifetime';
export type PaymentStatus = 'PENDING' | 'UNDER_REVIEW' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';

export interface PlanConfig {
    id: PaymentPlanId;
    name: string;
    amount: number;
    amountInPaise: number;
    billingCycle: 'monthly' | 'annual' | 'one-time';
    durationDays: number | null;
    description: string;
    badge?: string;
    features: string[];
}

export interface CreateOrderParams {
    userId: string;
    userEmail: string;
    userName?: string;
    planId: PaymentPlanId;
}

export interface OrderResult {
    orderId: string;
    amount: number;
    currency: string;
    plan: PlanConfig;
    status: PaymentStatus;
    qrCodeUrl: string;
    upiId: string;
    payeeName: string;
    instructions: string[];
}

export interface IPaymentProvider {
    readonly name: string;
    createOrder(params: CreateOrderParams): Promise<OrderResult>;
}
