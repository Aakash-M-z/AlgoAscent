import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock, Search, RefreshCw,
    Copy, Check, AlertCircle, Shield, User, DollarSign,
    Calendar, ArrowRight, Loader2, Filter, FileText
} from 'lucide-react';
import { adminApi } from '../../../api/adminApi';
import { useToast } from '../../../components/Toast';

interface PaymentItem {
    _id: string;
    orderId: string;
    userId: string;
    userEmail: string;
    plan: string;
    billingCycle: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'PAID' | 'REJECTED' | 'CANCELLED';
    utrNumber?: string;
    userSubmittedAt?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    adminNote?: string;
    rejectionReason?: string;
    createdAt: string;
}

export const PaymentApprovals: React.FC = () => {
    const { toast } = useToast();
    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNDER_REVIEW' | 'PAID' | 'REJECTED' | 'PENDING'>('UNDER_REVIEW');
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
    const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchPayments = async () => {
        try {
            const data = await adminApi.getPayments(statusFilter === 'ALL' ? undefined : statusFilter);
            if (data?.payments) {
                setPayments(data.payments);
            }
        } catch (err: any) {
            toast(err.response?.data?.error || err.message || 'Failed to load payments', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchPayments();
    }, [statusFilter]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPayments();
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        toast('Copied to clipboard!', 'info');
    };

    const handleApprove = async (payment: PaymentItem) => {
        const note = adminNotes[payment._id] || '';
        setActionLoading(payment._id);
        try {
            const res = await adminApi.approvePayment(payment._id, note);
            toast(res.message || `Order ${payment.orderId} approved successfully!`, 'success');
            await fetchPayments();
        } catch (err: any) {
            toast(err.response?.data?.error || err.message || 'Approval failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (payment: PaymentItem) => {
        const reason = rejectionReasons[payment._id] || 'Payment not found in bank records';
        const note = adminNotes[payment._id] || '';
        setActionLoading(payment._id);
        try {
            const res = await adminApi.rejectPayment(payment._id, reason, note);
            toast(res.message || `Order ${payment.orderId} marked as rejected.`, 'info');
            await fetchPayments();
        } catch (err: any) {
            toast(err.response?.data?.error || err.message || 'Rejection failed', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredPayments = payments.filter(p => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            p.orderId.toLowerCase().includes(term) ||
            p.userEmail.toLowerCase().includes(term) ||
            (p.utrNumber && p.utrNumber.toLowerCase().includes(term))
        );
    });

    const underReviewCount = payments.filter(p => p.status === 'UNDER_REVIEW').length;

    return (
        <div className="space-y-6">
            {/* Top Bar / Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] border border-white/10 p-5 rounded-2xl">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>Payment Verification Dashboard</span>
                        {underReviewCount > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                                {underReviewCount} Pending Review
                            </span>
                        )}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                        Verify manual Google Pay / UPI payments against bank app records and activate subscriptions.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {(['UNDER_REVIEW', 'ALL', 'PAID', 'REJECTED', 'PENDING'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                statusFilter === tab
                                    ? 'bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20'
                                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                            }`}
                        >
                            {tab === 'UNDER_REVIEW' && '🟡 Needs Review'}
                            {tab === 'ALL' && 'All Orders'}
                            {tab === 'PAID' && '🟢 Approved (Paid)'}
                            {tab === 'REJECTED' && '🔴 Rejected'}
                            {tab === 'PENDING' && '⚪ Awaiting UTR'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by Order ID, Email, UTR..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                    <Loader2 size={30} className="animate-spin text-[#D4AF37]" />
                    <span className="text-gray-400 text-sm">Loading payment records...</span>
                </div>
            ) : filteredPayments.length === 0 ? (
                <div className="p-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                    <FileText size={36} className="mx-auto text-gray-600 mb-3" />
                    <h4 className="text-white font-bold text-sm">No payment records found</h4>
                    <p className="text-gray-500 text-xs mt-1">
                        {statusFilter === 'UNDER_REVIEW' 
                            ? 'Great job! There are no orders awaiting verification right now.' 
                            : 'No records match the selected filter.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPayments.map(payment => {
                        const isUnderReview = payment.status === 'UNDER_REVIEW';
                        const isPaid = payment.status === 'PAID';
                        const isRejected = payment.status === 'REJECTED';
                        const isPending = payment.status === 'PENDING';

                        return (
                            <div
                                key={payment._id}
                                className={`p-5 rounded-2xl border transition-all ${
                                    isUnderReview
                                        ? 'bg-[#161622] border-amber-500/40 shadow-lg shadow-amber-500/5'
                                        : isPaid
                                        ? 'bg-[#101518] border-emerald-500/30'
                                        : isRejected
                                        ? 'bg-[#161113] border-red-500/30 opacity-80'
                                        : 'bg-white/[0.02] border-white/10'
                                }`}
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                                                {payment.orderId}
                                            </span>
                                            <button
                                                onClick={() => handleCopy(payment.orderId, `ord_${payment._id}`)}
                                                className="text-gray-400 hover:text-white"
                                                title="Copy Order ID"
                                            >
                                                {copiedId === `ord_${payment._id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                            </button>

                                            {/* Status Badge */}
                                            {isUnderReview && (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                    <Clock size={11} /> Under Review
                                                </span>
                                            )}
                                            {isPaid && (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                                    <CheckCircle2 size={11} /> Verified & Paid
                                                </span>
                                            )}
                                            {isRejected && (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                                                    <XCircle size={11} /> Rejected
                                                </span>
                                            )}
                                            {isPending && (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-500/20 text-gray-400 border border-gray-500/30 flex items-center gap-1">
                                                    <Clock size={11} /> Awaiting UTR
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-400">
                                            <User size={12} />
                                            <span className="text-gray-300 font-medium">{payment.userEmail}</span>
                                            <span>•</span>
                                            <span>Created: {new Date(payment.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Amount & Plan */}
                                    <div className="text-left lg:text-right">
                                        <div className="text-lg font-black text-white">
                                            ₹{payment.amount.toLocaleString('en-IN')}
                                        </div>
                                        <div className="text-xs text-gray-400 capitalize">
                                            {payment.plan} ({payment.billingCycle})
                                        </div>
                                    </div>
                                </div>

                                {/* Details & UTR Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                                            Submitted UPI UTR / Reference ID
                                        </span>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm font-bold text-amber-300">
                                                {payment.utrNumber || <span className="text-gray-500 font-normal italic">Not submitted yet</span>}
                                            </span>
                                            {payment.utrNumber && (
                                                <button
                                                    onClick={() => handleCopy(payment.utrNumber!, `utr_${payment._id}`)}
                                                    className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-xs text-gray-300 flex items-center gap-1"
                                                >
                                                    {copiedId === `utr_${payment._id}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                                    <span>{copiedId === `utr_${payment._id}` ? 'Copied' : 'Copy'}</span>
                                                </button>
                                            )}
                                        </div>
                                        {payment.userSubmittedAt && (
                                            <span className="text-[10px] text-gray-500 block pt-0.5">
                                                Submitted: {new Date(payment.userSubmittedAt).toLocaleString()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Audit / Review Info */}
                                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs space-y-1">
                                        {isPaid && (
                                            <>
                                                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Verification Record</span>
                                                <div className="text-gray-300">Verified by: <strong className="text-white">{payment.verifiedBy || 'Admin'}</strong></div>
                                                <div className="text-gray-400 text-[11px]">{payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString() : ''}</div>
                                                {payment.adminNote && <div className="text-gray-400 italic">Note: "{payment.adminNote}"</div>}
                                            </>
                                        )}
                                        {isRejected && (
                                            <>
                                                <span className="text-[10px] uppercase font-bold text-red-400 block">Rejection Record</span>
                                                <div className="text-red-300 font-semibold">Reason: {payment.rejectionReason}</div>
                                                <div className="text-gray-400 text-[11px]">Reviewed by: {payment.verifiedBy}</div>
                                                {payment.adminNote && <div className="text-gray-400 italic">Note: "{payment.adminNote}"</div>}
                                            </>
                                        )}
                                        {(isUnderReview || isPending) && (
                                            <>
                                                <span className="text-[10px] uppercase font-bold text-gray-500 block">Verification Action</span>
                                                <p className="text-[11px] text-gray-400">
                                                    Check your Google Pay or bank account for ₹{payment.amount} with UTR: <strong>{payment.utrNumber || 'N/A'}</strong>.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Action Controls for Under Review or Pending */}
                                {(isUnderReview || isPending) && (
                                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
                                        <div className="w-full md:w-2/3 flex flex-col sm:flex-row gap-2">
                                            <input
                                                type="text"
                                                placeholder="Admin note or bank reference (optional)..."
                                                value={adminNotes[payment._id] || ''}
                                                onChange={(e) => setAdminNotes({ ...adminNotes, [payment._id]: e.target.value })}
                                                className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-white placeholder-gray-500 text-xs"
                                            />
                                            <select
                                                value={rejectionReasons[payment._id] || ''}
                                                onChange={(e) => setRejectionReasons({ ...rejectionReasons, [payment._id]: e.target.value })}
                                                className="px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-gray-300 text-xs"
                                            >
                                                <option value="">Select rejection reason (if rejecting)...</option>
                                                <option value="Payment not found in bank records">Payment not found in bank records</option>
                                                <option value="Incorrect amount received">Incorrect amount received</option>
                                                <option value="Invalid or forged UTR reference">Invalid or forged UTR reference</option>
                                                <option value="Duplicate transaction ID">Duplicate transaction ID</option>
                                                <option value="Other verification failure">Other verification failure</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                            <button
                                                onClick={() => handleReject(payment)}
                                                disabled={actionLoading === payment._id}
                                                className="px-4 py-2 rounded-xl font-bold text-xs bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                <XCircle size={14} />
                                                <span>Reject</span>
                                            </button>

                                            <button
                                                onClick={() => handleApprove(payment)}
                                                disabled={actionLoading === payment._id}
                                                className="px-5 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-black shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                {actionLoading === payment._id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <CheckCircle2 size={14} />
                                                )}
                                                <span>Approve & Activate Pro</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PaymentApprovals;
