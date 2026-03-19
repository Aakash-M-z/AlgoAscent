import { useAuth } from '../contexts/AuthContext';

export const AI_FREE_DAILY_LIMIT = 2;

export interface PlanInfo {
    plan: 'free' | 'premium';
    isAdmin: boolean;
    isPremium: boolean;
    isFree: boolean;
    canUseAI: boolean;
    aiUsageToday: number;
    aiRemaining: number | null; // null = unlimited
}

/**
 * Returns plan-gating info derived from the current session user.
 * No network call — reads from the cached session.
 */
export function usePlan(): PlanInfo {
    const { user } = useAuth();

    const plan = (user?.plan ?? 'free') as 'free' | 'premium';
    const isAdmin = user?.role === 'admin';
    const isPremium = plan === 'premium' || isAdmin;
    const isFree = !isPremium;

    const today = new Date().toISOString().slice(0, 10);
    const resetAt = user?.aiUsageResetAt ?? today;
    const aiUsageToday = resetAt === today ? (user?.aiUsageCount ?? 0) : 0;

    const aiRemaining = isPremium ? null : Math.max(0, AI_FREE_DAILY_LIMIT - aiUsageToday);
    const canUseAI = isPremium || aiUsageToday < AI_FREE_DAILY_LIMIT;

    return { plan, isAdmin, isPremium, isFree, canUseAI, aiUsageToday, aiRemaining };
}
