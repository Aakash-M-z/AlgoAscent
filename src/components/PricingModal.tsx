import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    X, Check, Crown, Clock, CheckCircle2, XCircle,
    Copy, Loader2, ArrowRight, RefreshCw, Shield, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { paymentApi, PricingPlan, OrderResponse, PaymentStatusResponse } from '../api/paymentApi';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: 'monthly' | 'annual' | 'lifetime';
}

export const PricingModal: React.FC<PricingModalProps> = ({
    isOpen,
    onClose,
    initialPlan = 'annual'
}) => {
    const { user, login } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>(initialPlan);
    const [order, setOrder] = useState<OrderResponse | null>(null);
    const [orderLoading, setOrderLoading] = useState(false);
    const [utrNumber, setUtrNumber] = useState('');
    const [submittingUtr, setSubmittingUtr] = useState(false);
    const [copiedOrderId, setCopiedOrderId] = useState(false);
    const [copiedUpi, setCopiedUpi] = useState(false);
    const [copiedUtr, setCopiedUtr] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatusResponse | null>(null);
    const [config, setConfig] = useState<any>(null);
    const [adminApproving, setAdminApproving] = useState(false);

    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const stopPolling = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    useEffect(() => {
        if (isOpen) {
            setSelectedPlan(initialPlan);
            setPaymentStatus(null);
            setUtrNumber('');
            paymentApi.getConfig().then(cfg => setConfig(cfg)).catch(() => {});
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [isOpen, initialPlan]);

    // Create unique order when modal opens or plan changes
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        stopPolling();
        setPaymentStatus(null);
        setUtrNumber('');
        setOrderLoading(true);

        paymentApi.createOrder(selectedPlan)
            .then(res => {
                if (!isMounted) return;
                setOrder(res);
                setOrderLoading(false);
            })
            .catch(err => {
                if (!isMounted) return;
                console.warn('[PricingModal] Order initialization failed:', err);
                setOrderLoading(false);
            });

        return () => {
            isMounted = false;
            stopPolling();
        };
    }, [isOpen, selectedPlan, user]);

    // Status polling loop after UTR submission
    const startStatusPolling = (orderId: string) => {
        stopPolling();
        pollingRef.current = setInterval(async () => {
            try {
                const status = await paymentApi.getOrderStatus(orderId);
                setPaymentStatus(status);

                if (status.status === 'PAID') {
                    stopPolling();
                    if (user) {
                        login({
                            ...user,
                            plan: 'premium'
                        });
                    }
                    toast('Payment verified! Welcome to AlgoAscent Pro.', 'success');
                } else if (['REJECTED', 'CANCELLED', 'EXPIRED'].includes(status.status)) {
                    stopPolling();
                }
            } catch {
                // Ignore silent poll network fluctuations
            }
        }, 6000);
    };

    const handleCopyOrderId = () => {
        if (!order?.orderId) return;
        navigator.clipboard.writeText(order.orderId);
        setCopiedOrderId(true);
        toast('Order reference copied', 'info');
        setTimeout(() => setCopiedOrderId(false), 1800);
    };

    const handleCopyUpi = () => {
        const upi = order?.upiId || config?.upi?.upiId || 'aakashleo420@okicici';
        navigator.clipboard.writeText(upi);
        setCopiedUpi(true);
        toast('UPI ID copied', 'info');
        setTimeout(() => setCopiedUpi(false), 1800);
    };

    const handleCopyUtr = (utr: string) => {
        navigator.clipboard.writeText(utr);
        setCopiedUtr(true);
        toast('UTR reference copied', 'info');
        setTimeout(() => setCopiedUtr(false), 1800);
    };

    // User Submits UTR for Verification
    const handleSubmitUtr = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;

        const clean = utrNumber.trim().replace(/[\s-]/g, '');
        if (!clean || clean.length < 6) {
            toast('Please enter your 12-digit UPI UTR / Reference number', 'warning');
            return;
        }

        setSubmittingUtr(true);
        try {
            const res = await paymentApi.submitUtr(order.orderId, clean);
            toast('Payment submitted for administrator verification', 'info');
            setPaymentStatus({
                orderId: res.orderId,
                amount: res.amount,
                currency: 'INR',
                plan: selectedPlan,
                status: 'UNDER_REVIEW',
                isPaid: false,
                utrNumber: res.utrNumber,
                userSubmittedAt: new Date().toISOString()
            });

            startStatusPolling(res.orderId);
        } catch (err: any) {
            toast(err.response?.data?.error || err.message || 'Submission failed', 'error');
        } finally {
            setSubmittingUtr(false);
        }
    };

    // Admin direct test approve (Only for admin role)
    const handleAdminApprove = async () => {
        if (!order?.orderId || user?.role !== 'admin') return;
        setAdminApproving(true);
        try {
            const res = await paymentApi.devSimulateApprove(order.orderId);
            toast('Admin verified payment successfully', 'success');
            setPaymentStatus({
                orderId: res.orderId,
                amount: currentPlan.amount,
                currency: 'INR',
                plan: selectedPlan,
                status: 'PAID',
                isPaid: true
            });
            if (user) {
                login({ ...user, plan: 'premium' });
            }
        } catch (err: any) {
            toast(err.response?.data?.error || err.message || 'Approval failed', 'error');
        } finally {
            setAdminApproving(false);
        }
    };

    const handleTryAgain = () => {
        setPaymentStatus(null);
        setUtrNumber('');
        if (order) {
            paymentApi.createOrder(selectedPlan).then(res => setOrder(res)).catch(() => {});
        }
    };

    if (!isOpen) return null;

    const plans = config?.plans || {
        monthly: {
            id: 'monthly',
            name: 'Pro Monthly',
            amount: 299,
            billingCycle: 'monthly',
            description: 'Full AI mentor & assessment studio access.'
        },
        annual: {
            id: 'annual',
            name: 'Pro Annual',
            amount: 2499,
            billingCycle: 'annual',
            badge: 'Save 30%',
            description: 'Comprehensive 1-year prep pack with priority AI.'
        },
        lifetime: {
            id: 'lifetime',
            name: 'Lifetime Pass',
            amount: 4999,
            billingCycle: 'one-time',
            badge: 'One-Time',
            description: 'Pay once, permanent access to all features.'
        }
    };

    const currentPlan = plans[selectedPlan] || plans.annual;
    const qrImageUrl = order?.qrCodeUrl || config?.upi?.qrCodeUrl || '/payment/gpay-qr.png';
    const upiId = order?.upiId || config?.upi?.upiId || 'aakashleo420@okicici';
    const payeeName = order?.payeeName || config?.upi?.payeeName || 'Aakash Leo';
    const isAdmin = user?.role === 'admin';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/90 backdrop-blur-md font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-2xl bg-[#08080C] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col text-zinc-200"
            >
                {/* Subtle AI Ambient Horizon */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-16 bg-gradient-to-b from-[#FF3B1F]/10 to-transparent blur-2xl pointer-events-none" />

                {/* Minimal Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all z-20 cursor-pointer"
                >
                    <X size={16} />
                </button>

                {/* ═══════════════════════════════════════════════════════════
                    STATE 1: APPROVED & ACTIVE
                   ═══════════════════════════════════════════════════════════ */}
                {paymentStatus?.status === 'PAID' ? (
                    <div className="p-8 sm:p-12 text-center flex flex-col items-center my-auto overflow-y-auto">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                            <CheckCircle2 size={30} />
                        </div>

                        <span className="text-[11px] font-mono font-medium uppercase tracking-widest text-emerald-400 mb-1">
                            Verified by Administrator
                        </span>

                        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
                            Subscription Active
                        </h2>
                        <p className="text-zinc-400 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">
                            ₹{(paymentStatus.amount || currentPlan.amount).toLocaleString('en-IN')} payment confirmed. Your AlgoAscent Pro membership is now unlocked.
                        </p>

                        <div className="w-full max-w-sm p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left text-xs font-mono space-y-2 mb-6 text-zinc-400">
                            <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                                <span>Order</span>
                                <span className="text-zinc-200">{paymentStatus.orderId}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.04] pb-1.5">
                                <span>Plan</span>
                                <span className="text-white capitalize">{paymentStatus.plan}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status</span>
                                <span className="text-emerald-400 font-semibold">Active</span>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-xs font-medium bg-zinc-100 text-black hover:bg-white transition-all cursor-pointer shadow-sm"
                        >
                            Continue to Workspace
                        </button>
                    </div>

                /* ═══════════════════════════════════════════════════════════
                    STATE 2: UNDER REVIEW
                   ═══════════════════════════════════════════════════════════ */
                ) : paymentStatus?.status === 'UNDER_REVIEW' ? (
                    <div className="p-8 sm:p-12 text-center flex flex-col items-center my-auto overflow-y-auto">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                            <Clock size={28} className="animate-pulse" />
                        </div>

                        <span className="text-[11px] font-mono font-medium uppercase tracking-widest text-amber-400 mb-1">
                            Pending Admin Verification
                        </span>

                        <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-2">
                            Payment Under Review
                        </h2>
                        <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
                            Your transaction reference has been recorded. Our administrator will verify the amount in bank records before your subscription activates.
                        </p>

                        <div className="w-full max-w-sm p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left text-xs font-mono space-y-2.5 mb-6 text-zinc-400">
                            <div className="flex justify-between border-b border-white/[0.04] pb-2">
                                <span>Order Reference</span>
                                <span className="text-zinc-200 font-semibold">{paymentStatus.orderId}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/[0.04] pb-2">
                                <span>Amount</span>
                                <span className="text-zinc-200 font-semibold">₹{paymentStatus.amount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                                <span>Submitted UTR</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-amber-300 font-semibold">{paymentStatus.utrNumber}</span>
                                    {paymentStatus.utrNumber && (
                                        <button
                                            onClick={() => handleCopyUtr(paymentStatus.utrNumber!)}
                                            className="text-zinc-500 hover:text-white cursor-pointer ml-1"
                                            title="Copy UTR"
                                        >
                                            {copiedUtr ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 pt-1">
                                <RefreshCw size={11} className="animate-spin text-amber-400 shrink-0" />
                                <span>Checking status in background...</span>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-between">
                                <span className="text-[11px] text-[#D4AF37]">Admin View</span>
                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/dashboard/admin/payments');
                                    }}
                                    className="text-xs font-medium text-white hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Review in Admin Panel</span>
                                    <ExternalLink size={11} />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 transition-all cursor-pointer"
                        >
                            Close
                        </button>
                    </div>

                /* ═══════════════════════════════════════════════════════════
                    STATE 3: REJECTED
                   ═══════════════════════════════════════════════════════════ */
                ) : paymentStatus?.status === 'REJECTED' ? (
                    <div className="p-8 sm:p-12 text-center flex flex-col items-center my-auto overflow-y-auto">
                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
                            <XCircle size={28} />
                        </div>

                        <span className="text-[11px] font-mono font-medium uppercase tracking-widest text-red-400 mb-1">
                            Verification Unsuccessful
                        </span>

                        <h2 className="text-xl font-semibold text-white tracking-tight mb-2">
                            Transaction Not Confirmed
                        </h2>
                        <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-5 leading-relaxed">
                            Reason: <span className="text-zinc-200">{paymentStatus.rejectionReason || 'Could not verify payment in bank records.'}</span>
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleTryAgain}
                                className="px-5 py-2 rounded-xl text-xs font-medium bg-[#FF3B1F] text-white hover:bg-[#ff553d] transition-all cursor-pointer"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onClose}
                                className="px-5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] text-zinc-400 hover:text-white transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                /* ═══════════════════════════════════════════════════════════
                    STATE 4: FOCUSED PAYMENT PROCEDURE & REAL GPAY QR
                    (NO REDUNDANT 3 PRICING MODEL CARDS!)
                   ═══════════════════════════════════════════════════════════ */
                ) : (
                    <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                        {/* Clean Minimal Header */}
                        <div className="text-left space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500">
                                    Direct UPI Checkout
                                </span>
                                {isAdmin && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            navigate('/dashboard/admin/payments');
                                        }}
                                        className="text-[11px] font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <Shield size={11} />
                                        <span>Admin Dashboard</span>
                                    </button>
                                )}
                            </div>
                            <h2 className="text-xl font-semibold text-white tracking-tight">
                                Complete Payment & Verification
                            </h2>
                        </div>

                        {/* Selected Plan Bar with Mini-Switchers */}
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs text-zinc-400 font-medium">Selected Plan:</span>
                                <span className="text-sm font-semibold text-white">{currentPlan.name}</span>
                                <span className="text-sm font-mono font-bold text-[#FF3B1F]">₹{currentPlan.amount.toLocaleString('en-IN')}</span>
                                <span className="text-[10px] text-zinc-500">
                                    {currentPlan.billingCycle === 'monthly' ? '/mo' : currentPlan.billingCycle === 'annual' ? '/yr' : ' once'}
                                </span>
                            </div>

                            {/* Minimal Inline Plan Pill Switcher */}
                            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/[0.05]">
                                {(['monthly', 'annual', 'lifetime'] as const).map(pKey => (
                                    <button
                                        key={pKey}
                                        type="button"
                                        onClick={() => setSelectedPlan(pKey)}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                            selectedPlan === pKey
                                                ? 'bg-white/10 text-white shadow-sm'
                                                : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                    >
                                        {pKey === 'monthly' ? '₹299' : pKey === 'annual' ? '₹2,499' : '₹4,999'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Payment Card: QR + Procedure & UTR Form */}
                        <div className="p-4 sm:p-5 rounded-xl bg-[#0D0D12] border border-white/[0.08] space-y-4">
                            {/* Order Ref & Amount Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] text-xs">
                                <div>
                                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Order Reference</span>
                                    <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                                        <span>{orderLoading ? 'Generating...' : order?.orderId || 'ALG-PENDING'}</span>
                                        {order?.orderId && (
                                            <button
                                                onClick={handleCopyOrderId}
                                                className="text-zinc-500 hover:text-white cursor-pointer"
                                                title="Copy Order ID"
                                            >
                                                {copiedOrderId ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right">
                                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Total Payable</span>
                                    <span className="text-base font-bold text-white font-mono">
                                        ₹{currentPlan.amount.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            {/* Center Grid: Real GPay QR (Left) + Procedure (Right) */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-1">
                                {/* Real GPay QR Display */}
                                <div className="flex flex-col items-center shrink-0">
                                    <div className="p-1.5 bg-white rounded-xl shadow-lg border border-white/[0.15]">
                                        <img
                                            src={qrImageUrl}
                                            alt="Google Pay QR Code"
                                            className="w-40 h-40 object-contain rounded-lg"
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-500 mt-1.5">
                                        Scan with GPay, PhonePe, Paytm
                                    </span>
                                </div>

                                {/* Procedure & UTR Form */}
                                <div className="flex-1 w-full text-left space-y-3">
                                    {/* Payee Details */}
                                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                            <span className="text-[9px] uppercase text-zinc-500 block">Payee</span>
                                            <span className="text-zinc-300 truncate block font-sans text-xs">{payeeName}</span>
                                        </div>
                                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                                            <span className="text-[9px] uppercase text-zinc-500 block">UPI ID</span>
                                            <div className="flex items-center justify-between">
                                                <span className="text-zinc-300 truncate text-xs">{upiId}</span>
                                                <button
                                                    onClick={handleCopyUpi}
                                                    className="text-zinc-500 hover:text-white cursor-pointer ml-1"
                                                    title="Copy UPI ID"
                                                >
                                                    {copiedUpi ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step by Step Procedure */}
                                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.05] text-[11px] text-zinc-400 space-y-1">
                                        <div className="text-zinc-300 font-medium text-[11px]">Payment Procedure:</div>
                                        <ol className="list-decimal list-inside space-y-0.5 text-zinc-400 text-[11px]">
                                            <li>Scan the QR code and pay <strong className="text-white">₹{currentPlan.amount.toLocaleString('en-IN')}</strong>.</li>
                                            <li>Copy the 12-digit UPI UTR / Reference ID from your app.</li>
                                            <li>Paste the UTR below and submit for administrator review.</li>
                                        </ol>
                                    </div>

                                    {/* UTR Form */}
                                    <form onSubmit={handleSubmitUtr} className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder="Enter 12-digit UPI UTR Number"
                                                value={utrNumber}
                                                onChange={(e) => setUtrNumber(e.target.value)}
                                                className="flex-1 px-3 py-2 rounded-lg bg-black/50 border border-white/[0.1] text-white placeholder-zinc-600 text-xs font-mono tracking-wider focus:outline-none focus:border-[#FF3B1F]"
                                            />
                                            <button
                                                type="submit"
                                                disabled={submittingUtr || orderLoading || !utrNumber.trim()}
                                                className="px-4 py-2 rounded-lg font-medium text-xs bg-[#FF3B1F] hover:bg-[#ff553d] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                            >
                                                {submittingUtr ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>Submit UTR</span>
                                                        <ArrowRight size={12} />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                                            <span>Manual bank verification before activation</span>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={handleAdminApprove}
                                                    disabled={adminApproving || !order}
                                                    className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                                                >
                                                    {adminApproving ? 'Approving...' : 'Admin Test Approve'}
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default PricingModal;
