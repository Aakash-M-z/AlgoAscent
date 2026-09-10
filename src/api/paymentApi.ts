import axios from 'axios';
import { API_BASE } from './config';
import { SessionManager } from '../utils/sessionManager';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
});

api.interceptors.request.use(config => {
    const token = SessionManager.getToken() || localStorage.getItem('pt_token') || '';
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export interface PricingPlan {
    id: 'monthly' | 'annual' | 'lifetime';
    name: string;
    amount: number;
    amountInPaise: number;
    billingCycle: 'monthly' | 'annual' | 'one-time';
    durationDays: number | null;
    description: string;
    badge?: string;
    features: string[];
}

export interface PaymentConfig {
    paymentMethod: string;
    currency: string;
    plans: Record<string, PricingPlan>;
    upi: {
        upiId: string;
        payeeName: string;
        qrCodeUrl: string;
    };
    isTestMode?: boolean;
}

export interface OrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    plan: PricingPlan;
    status: string;
    qrCodeUrl: string;
    upiId: string;
    payeeName: string;
    instructions: string[];
}

export interface PaymentStatusResponse {
    orderId: string;
    amount: number;
    currency: string;
    plan: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'PAID' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | string;
    isPaid: boolean;
    utrNumber?: string;
    rejectionReason?: string;
    adminNote?: string;
    createdAt?: string;
    userSubmittedAt?: string;
    verifiedAt?: string;
}

export interface PaymentHistoryItem {
    _id: string;
    orderId: string;
    utrNumber?: string;
    amount: number;
    currency: string;
    plan: string;
    billingCycle: string;
    status: string;
    rejectionReason?: string;
    verifiedBy?: string;
    createdAt: string;
}

export const paymentApi = {
    getConfig: async (): Promise<PaymentConfig> => {
        try {
            const res = await api.get('/payments/config');
            return res.data;
        } catch {
            return {
                paymentMethod: 'MANUAL_UPI',
                currency: 'INR',
                upi: {
                    upiId: 'aakashleo420@okicici',
                    payeeName: 'Aakash Leo',
                    qrCodeUrl: '/payment/gpay-qr.png'
                },
                plans: {
                    monthly: {
                        id: 'monthly',
                        name: 'Pro Monthly',
                        amount: 299,
                        amountInPaise: 29900,
                        billingCycle: 'monthly',
                        durationDays: 30,
                        description: 'Flexible month-to-month access to all AlgoAscent Pro features.',
                        features: [
                            'Unlimited AI Code Explanations & Hints',
                            'Unlimited AI Coding & Behavioral Mock Interviews',
                            'Full Assessment Studio & Proctoring Reports',
                            'Advanced Performance Analytics & Streaks',
                            'Spaced Repetition Review Engine'
                        ]
                    },
                    annual: {
                        id: 'annual',
                        name: 'Pro Annual',
                        amount: 2499,
                        amountInPaise: 249900,
                        billingCycle: 'annual',
                        durationDays: 365,
                        badge: 'Best Value (Save 30%)',
                        description: 'Comprehensive 1-year prep pack with priority AI processing.',
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
                        amount: 4999,
                        amountInPaise: 499900,
                        billingCycle: 'one-time',
                        durationDays: null,
                        badge: 'One-Time Payment',
                        description: 'Pay once, enjoy lifetime access to current and future AlgoAscent features.',
                        features: [
                            'Lifetime Unlimited Access to all Pro features',
                            'All Future Product Updates & AI Models included',
                            'Exclusive Lifetime Elite Discord/Community Role',
                            'Dedicated 1-on-1 Candidate Resume Review Guide'
                        ]
                    }
                }
            };
        }
    },

    createOrder: async (planId: 'monthly' | 'annual' | 'lifetime'): Promise<OrderResponse> => {
        const res = await api.post('/payments/create', { planId });
        return res.data;
    },

    submitUtr: async (orderId: string, utrNumber: string): Promise<{
        success: boolean;
        message: string;
        status: string;
        orderId: string;
        utrNumber: string;
        amount: number;
    }> => {
        const res = await api.post(`/payments/${orderId}/submit-utr`, { utrNumber });
        return res.data;
    },

    getOrderStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
        const res = await api.get(`/payments/${orderId}/status`);
        return res.data;
    },

    getHistory: async (): Promise<{ payments: PaymentHistoryItem[]; activeSubscription: any }> => {
        const res = await api.get('/payments/history');
        return res.data;
    },

    devSimulateApprove: async (orderId: string): Promise<{ success: boolean; message: string; orderId: string; status: string }> => {
        const res = await api.post(`/payments/${orderId}/dev-simulate-approve`);
        return res.data;
    }
};
