/**
 * aiCache.ts — Client-side AI response cache + failure analytics
 *
 * Cache: localStorage, per-key TTL (default 24h for analysis, 7d for explanations)
 * Analytics: in-memory ring buffer (last 50 events), persisted to localStorage
 */

// ── Types ─────────────────────────────────────────────────────────

export type AIFeature = 'analyze' | 'explain';

export interface CacheEntry<T> {
    data: T;
    cachedAt: number;   // ms timestamp
    ttl: number;        // ms
    hitCount: number;
}

export interface AIFailureEvent {
    feature: AIFeature;
    error: string;
    statusCode?: number;
    ts: number;
    durationMs?: number;
}

export interface AIAnalytics {
    totalRequests: number;
    totalFailures: number;
    totalCacheHits: number;
    avgDurationMs: number;
    recentFailures: AIFailureEvent[];
    lastSuccessAt: number | null;
    lastFailureAt: number | null;
}

// ── Constants ─────────────────────────────────────────────────────

const CACHE_PREFIX = 'ai_cache_';
const ANALYTICS_KEY = 'ai_analytics';
const MAX_FAILURE_LOG = 50;

const DEFAULT_TTL: Record<AIFeature, number> = {
    analyze: 24 * 60 * 60 * 1000,   // 24h — analysis changes as user logs more
    explain: 7 * 24 * 60 * 60 * 1000, // 7d — topic explanations are stable
};

// ── Cache helpers ─────────────────────────────────────────────────

function cacheKey(feature: AIFeature, key: string): string {
    return `${CACHE_PREFIX}${feature}_${key}`;
}

export function getCached<T>(feature: AIFeature, key: string): T | null {
    try {
        const raw = localStorage.getItem(cacheKey(feature, key));
        if (!raw) return null;
        const entry: CacheEntry<T> = JSON.parse(raw);
        if (Date.now() - entry.cachedAt > entry.ttl) {
            localStorage.removeItem(cacheKey(feature, key));
            return null;
        }
        // Increment hit count silently
        entry.hitCount++;
        localStorage.setItem(cacheKey(feature, key), JSON.stringify(entry));
        return entry.data;
    } catch {
        return null;
    }
}

export function setCached<T>(feature: AIFeature, key: string, data: T, ttl?: number): void {
    try {
        const entry: CacheEntry<T> = {
            data,
            cachedAt: Date.now(),
            ttl: ttl ?? DEFAULT_TTL[feature],
            hitCount: 0,
        };
        localStorage.setItem(cacheKey(feature, key), JSON.stringify(entry));
    } catch {
        // localStorage quota exceeded — silently skip caching
    }
}

export function invalidateCache(feature: AIFeature, key: string): void {
    localStorage.removeItem(cacheKey(feature, key));
}

export function invalidateAllCache(feature?: AIFeature): void {
    const prefix = feature ? `${CACHE_PREFIX}${feature}_` : CACHE_PREFIX;
    Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k));
}

/** Returns metadata about a cached entry without consuming it */
export function getCacheInfo(feature: AIFeature, key: string): { age: number; hitCount: number } | null {
    try {
        const raw = localStorage.getItem(cacheKey(feature, key));
        if (!raw) return null;
        const entry: CacheEntry<unknown> = JSON.parse(raw);
        if (Date.now() - entry.cachedAt > entry.ttl) return null;
        return { age: Date.now() - entry.cachedAt, hitCount: entry.hitCount };
    } catch {
        return null;
    }
}

// ── Analytics ─────────────────────────────────────────────────────

function loadAnalytics(): AIAnalytics {
    try {
        const raw = localStorage.getItem(ANALYTICS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {
        totalRequests: 0,
        totalFailures: 0,
        totalCacheHits: 0,
        avgDurationMs: 0,
        recentFailures: [],
        lastSuccessAt: null,
        lastFailureAt: null,
    };
}

function saveAnalytics(a: AIAnalytics): void {
    try {
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(a));
    } catch { /* ignore */ }
}

export function trackRequest(): void {
    const a = loadAnalytics();
    a.totalRequests++;
    saveAnalytics(a);
}

export function trackCacheHit(): void {
    const a = loadAnalytics();
    a.totalCacheHits++;
    saveAnalytics(a);
}

export function trackSuccess(durationMs: number): void {
    const a = loadAnalytics();
    // Rolling average
    const prevTotal = a.avgDurationMs * (a.totalRequests - a.totalFailures - 1);
    const successCount = a.totalRequests - a.totalFailures;
    a.avgDurationMs = successCount > 0 ? (prevTotal + durationMs) / successCount : durationMs;
    a.lastSuccessAt = Date.now();
    saveAnalytics(a);
}

export function trackFailure(event: Omit<AIFailureEvent, 'ts'>): void {
    const a = loadAnalytics();
    a.totalFailures++;
    a.lastFailureAt = Date.now();
    a.recentFailures = [
        { ...event, ts: Date.now() },
        ...a.recentFailures,
    ].slice(0, MAX_FAILURE_LOG);
    saveAnalytics(a);
}

export function getAnalytics(): AIAnalytics {
    return loadAnalytics();
}

export function clearAnalytics(): void {
    localStorage.removeItem(ANALYTICS_KEY);
}

// ── Cache key builders ────────────────────────────────────────────

/** Stable key for analysis: hash of activity count + topic set + solved count */
export function buildAnalysisCacheKey(activities: { topic?: string; solved?: boolean }[]): string {
    const topics = [...new Set(activities.map(a => a.topic || ''))].sort().join(',');
    const solved = activities.filter(a => a.solved).length;
    return `${activities.length}_${solved}_${topics.slice(0, 80)}`;
}

/** Stable key for topic explanation: subject + topic title */
export function buildExplainCacheKey(subject: string, topic: string): string {
    return `${subject}__${topic}`.toLowerCase().replace(/\s+/g, '_').slice(0, 100);
}
