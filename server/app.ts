import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios, { AxiosError } from 'axios';
import { storage } from './storage.js';
import { InsertUser, InsertActivity, InsertTask } from '../shared/schema.js';
import { signToken, verifyToken, extractBearer, JwtPayload } from './jwt.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const api = express.Router();

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-id', 'x-user-id'],
    credentials: true,
}));
app.use(express.json());

// COOP headers — required for Google OAuth popup (window.closed) to work
app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

// Health check — returns storage type and env status for easy debugging
api.get('/health', async (_req, res) => {
    const { mongoConnected } = await import('./mongo-storage.js');
    const apiKey = process.env.OPENROUTER_API_KEY;
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        storage: mongoConnected ? 'mongodb' : 'file',
        env: {
            openrouter: apiKey
                ? `present (${apiKey.slice(0, 12)}...)`
                : 'MISSING — set OPENROUTER_API_KEY in Vercel dashboard',
            frontendUrl: process.env.FRONTEND_URL || 'not set',
            mongodb: !!process.env.MONGODB_URI,
            port: process.env.PORT || 3001,
            nodeEnv: process.env.NODE_ENV || 'development',
            runtime: 'express/vercel',
        },
    });
});

// Login
api.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' }); return;
        }
        const user = await storage.getUserByEmail(email.trim().toLowerCase());
        if (!user || user.password !== password) {
            res.status(401).json({ error: 'Invalid email or password' }); return;
        }
        const { password: _, ...safeUser } = user;
        const token = signToken({ id: user.id, email: user.email, role: user.role, plan: (user as any).plan ?? 'free' });
        res.json({ user: safeUser, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Register
api.post('/register', async (req, res) => {
    try {
        const userData: InsertUser = req.body;
        if (!userData.email || !userData.password || !userData.username) {
            res.status(400).json({ error: 'Email, password and username are required' }); return;
        }
        userData.email = userData.email.trim().toLowerCase();
        if (await storage.getUserByEmail(userData.email)) {
            res.status(409).json({ error: 'An account with this email already exists' }); return;
        }
        if (await storage.getUserByUsername(userData.username)) {
            res.status(409).json({ error: 'This username is already taken' }); return;
        }
        // Ensure defaults for new fields
        if (!(userData as any).plan) (userData as any).plan = 'free';
        if ((userData as any).aiUsageCount === undefined) (userData as any).aiUsageCount = 0;
        if (!(userData as any).aiUsageResetAt) (userData as any).aiUsageResetAt = new Date().toISOString().slice(0, 10);
        const user = await storage.createUser(userData);
        const { password: _, ...safeUser } = user;
        const jwtToken = signToken({ id: user.id, email: user.email, role: user.role, plan: (user as any).plan ?? 'free' });
        res.status(201).json({ user: safeUser, token: jwtToken });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Google Auth
api.post('/auth/google', async (req, res) => {
    try {
        const { token: googleAccessToken } = req.body;
        if (!googleAccessToken) { res.status(400).json({ error: 'Token is required' }); return; }
        const googleUserRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${googleAccessToken}` }
        });
        if (!googleUserRes.ok) {
            res.status(401).json({ error: 'Failed to authenticate with Google' }); return;
        }
        const googleData = await googleUserRes.json();
        const email: string = googleData.email;
        if (!email) { res.status(400).json({ error: 'Google account has no email' }); return; }
        let user = await storage.getUserByEmail(email);
        if (user) {
            if (email === 'aakashleo420@gmail.com' && user.role !== 'admin')
                user = await storage.updateUser(user.id, { role: 'admin' }) ?? user;
        } else {
            const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
            let username = baseUsername;
            let counter = 1;
            while (await storage.getUserByUsername(username))
                username = `${baseUsername}${counter++}`;
            user = await storage.createUser({
                username, email,
                password: Math.random().toString(36).slice(-12),
                role: email === 'aakashleo420@gmail.com' ? 'admin' : 'user',
                plan: 'free',
                aiUsageCount: 0,
                aiUsageResetAt: new Date().toISOString().slice(0, 10),
            });
        }
        const { password: _, ...safeUser } = user;
        const jwtToken = signToken({ id: user.id, email: user.email, role: user.role, plan: (user as any).plan ?? 'free' });
        res.json({ user: safeUser, token: jwtToken });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ── User routes ──────────────────────────────────────────────────
// IMPORTANT: specific paths must come before wildcard /:id

// Get user by username
api.get('/users/by-username/:username', async (req, res) => {
    try {
        const user = await storage.getUserByUsername(req.params.username);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        res.json(user);
    } catch {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Get user activities — must be before /users/:id
api.get('/users/:userId/activities', async (req, res) => {
    try {
        const activities = await storage.getUserActivities(req.params.userId);
        res.json(activities);
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Get user by ID
api.get('/users/:id', async (req, res) => {
    try {
        const user = await storage.getUser(req.params.id);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        res.json(user);
    } catch {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Create user (internal)
api.post('/users', async (req, res) => {
    try {
        const user = await storage.createUser(req.body);
        res.status(201).json(user);
    } catch {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ── Activity routes ──────────────────────────────────────────────

// Create activity
api.post('/activities', async (req, res) => {
    try {
        const activity = await storage.createActivity(req.body as InsertActivity);
        res.status(201).json(activity);
    } catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Update activity
api.put('/activities/:id', async (req, res) => {
    try {
        const activity = await storage.updateActivity(req.params.id, req.body);
        if (!activity) { res.status(404).json({ error: 'Activity not found' }); return; }
        res.json(activity);
    } catch {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Delete activity
api.delete('/activities/:id', async (req, res) => {
    try {
        const deleted = await storage.deleteActivity(req.params.id);
        if (!deleted) { res.status(404).json({ error: 'Activity not found' }); return; }
        res.status(204).send();
    } catch {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// ── Task routes ──────────────────────────────────────────────────

// GET user tasks
api.get('/users/:userId/tasks', async (req, res) => {
    try {
        const tasks = await storage.getUserTasks(req.params.userId);
        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST create task
api.post('/tasks', async (req, res) => {
    try {
        const task = await storage.createTask(req.body as InsertTask);
        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH update task (toggle complete, edit)
api.patch('/tasks/:id', async (req, res) => {
    try {
        const task = await storage.updateTask(req.params.id, req.body);
        if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
        res.json(task);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE task
api.delete('/tasks/:id', async (req, res) => {
    try {
        const deleted = await storage.deleteTask(req.params.id);
        if (!deleted) { res.status(404).json({ error: 'Task not found' }); return; }
        res.status(204).send();
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

import { PROBLEM_DATASET, DIFF_ORDER, ProblemRecord } from '../shared/problemDataset.js';

// ── Recommendation engine ────────────────────────────────────────

interface ActivityInput {
    topic: string;
    difficulty: string;
    solved: boolean;
    date: string;
}

interface RecommendedProblem extends ProblemRecord {
    reason: string;
    score: number;
    isNew: boolean;
}

interface RecommendationResponse {
    recommendedDifficulty: 'Easy' | 'Medium' | 'Hard';
    difficultyReason: string;
    topicPriority: { topic: string; reason: string; urgency: 'high' | 'medium' | 'low' }[];
    problems: RecommendedProblem[];
    solvedIds: string[];
}

function buildRecommendations(activities: ActivityInput[]): RecommendationResponse {
    // ── 1. Build per-topic stats ──────────────────────────────────
    const topicStats: Record<string, { solved: number; attempted: number; lastSeen: string; difficulties: string[] }> = {};

    activities.forEach(a => {
        const t = a.topic || 'General';
        if (!topicStats[t]) topicStats[t] = { solved: 0, attempted: 0, lastSeen: a.date, difficulties: [] };
        if (a.solved) topicStats[t].solved++;
        else topicStats[t].attempted++;
        if (a.date > topicStats[t].lastSeen) topicStats[t].lastSeen = a.date;
        if (a.difficulty) topicStats[t].difficulties.push(a.difficulty);
    });

    // ── 2. Determine recommended difficulty ──────────────────────
    const totalSolved = activities.filter(a => a.solved).length;
    const recentSolved = activities
        .filter(a => a.solved && new Date(a.date).getTime() > Date.now() - 7 * 86_400_000).length;
    const hardSolved = activities.filter(a => a.solved && a.difficulty === 'Hard').length;
    const mediumSolved = activities.filter(a => a.solved && a.difficulty === 'Medium').length;
    const solveRate = activities.length ? activities.filter(a => a.solved).length / activities.length : 0;

    let recommendedDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
    let difficultyReason = '';

    if (totalSolved === 0) {
        recommendedDifficulty = 'Easy';
        difficultyReason = 'Start with Easy problems to build confidence and pattern recognition.';
    } else if (solveRate >= 0.75 && mediumSolved >= 5 && hardSolved >= 2) {
        recommendedDifficulty = 'Hard';
        difficultyReason = `Strong ${Math.round(solveRate * 100)}% solve rate with ${hardSolved} Hard problems solved — ready for Hard challenges.`;
    } else if (solveRate >= 0.55 && mediumSolved >= 3) {
        recommendedDifficulty = 'Medium';
        difficultyReason = `${Math.round(solveRate * 100)}% solve rate — Medium problems will push your growth optimally.`;
    } else if (totalSolved >= 3 && solveRate >= 0.4) {
        recommendedDifficulty = 'Medium';
        difficultyReason = `You've solved ${totalSolved} problems. Time to step up to Medium difficulty.`;
    } else {
        recommendedDifficulty = 'Easy';
        difficultyReason = `${Math.round(solveRate * 100)}% solve rate — solidify Easy problems before moving up.`;
    }

    // ── 3. Topic priority ────────────────────────────────────────
    const coveredTopics = new Set(Object.keys(topicStats));
    const allTopics = [...new Set(PROBLEM_DATASET.map(p => p.topic))];
    const untouchedTopics = allTopics.filter(t => !coveredTopics.has(t));

    const topicPriority: RecommendationResponse['topicPriority'] = [];

    // Weak topics: attempted but low solve rate
    Object.entries(topicStats)
        .filter(([, s]) => s.attempted > 0 && s.solved / (s.solved + s.attempted) < 0.4)
        .sort(([, a], [, b]) => (a.solved / (a.solved + a.attempted)) - (b.solved / (b.solved + b.attempted)))
        .slice(0, 3)
        .forEach(([topic, s]) => {
            const rate = Math.round((s.solved / (s.solved + s.attempted)) * 100);
            topicPriority.push({ topic, reason: `Only ${rate}% solve rate — needs focused practice`, urgency: 'high' });
        });

    // Stale topics: haven't touched in 14+ days
    const twoWeeksAgo = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
    Object.entries(topicStats)
        .filter(([, s]) => s.lastSeen < twoWeeksAgo && s.solved > 0)
        .slice(0, 2)
        .forEach(([topic]) => {
            topicPriority.push({ topic, reason: 'Not practiced in 2+ weeks — review to retain', urgency: 'medium' });
        });

    // Untouched topics
    untouchedTopics.slice(0, 3).forEach(topic => {
        topicPriority.push({ topic, reason: 'Not started yet — broaden your coverage', urgency: 'low' });
    });

    // ── 4. Score and rank problems ───────────────────────────────
    const solvedNames = new Set(activities.filter(a => a.solved).map(a => a.topic + ':' + a.difficulty));
    // Use problem name as proxy for "already solved" since we don't store problem IDs in activities
    const attemptedTopicDiff = new Set(activities.map(a => `${a.topic}:${a.difficulty}`));

    const scored: RecommendedProblem[] = PROBLEM_DATASET.map(p => {
        let score = 0;
        const tStats = topicStats[p.topic];
        const diffScore = DIFF_ORDER[p.difficulty] ?? 1;
        const targetDiffScore = DIFF_ORDER[recommendedDifficulty];

        // Difficulty match — prefer recommended, allow ±1
        const diffDelta = Math.abs(diffScore - targetDiffScore);
        if (diffDelta === 0) score += 40;
        else if (diffDelta === 1) score += 20;

        // Weak topic bonus
        if (tStats && tStats.solved / Math.max(tStats.solved + tStats.attempted, 1) < 0.4) score += 25;

        // Untouched topic bonus
        if (!coveredTopics.has(p.topic)) score += 20;

        // Stale topic bonus
        if (tStats && tStats.lastSeen < twoWeeksAgo) score += 15;

        // Prereqs met
        const prereqsMet = p.prereqs.every(req => coveredTopics.has(req) || req === '');
        if (prereqsMet) score += 15;
        else score -= 20;

        // Slight recency penalty for topics done this week (avoid repetition)
        if (tStats && tStats.lastSeen >= new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10)) score -= 5;

        // Build reason string
        let reason = '';
        if (!coveredTopics.has(p.topic)) reason = `New topic to explore`;
        else if (tStats && tStats.solved / Math.max(tStats.solved + tStats.attempted, 1) < 0.4) reason = `Strengthen weak ${p.topic} skills`;
        else if (tStats && tStats.lastSeen < twoWeeksAgo) reason = `Review ${p.topic} — not practiced recently`;
        else reason = `Good next step in ${p.topic}`;

        if (p.difficulty === recommendedDifficulty) reason += ` · Matches your current level`;

        return { ...p, score, reason, isNew: !coveredTopics.has(p.topic) };
    });

    // Sort by score desc, deduplicate by topic (max 2 per topic in top results)
    const topicCount: Record<string, number> = {};
    const problems = scored
        .sort((a, b) => b.score - a.score)
        .filter(p => {
            topicCount[p.topic] = (topicCount[p.topic] || 0) + 1;
            return topicCount[p.topic] <= 2;
        })
        .slice(0, 12);

    const solvedIds = activities.filter(a => a.solved).map((_, i) => String(i));

    return { recommendedDifficulty, difficultyReason, topicPriority, problems, solvedIds };
}

// ── Auth middleware ──────────────────────────────────────────────

/**
 * requireAuth — verifies JWT from Authorization: Bearer <token>
 * Attaches decoded payload to req.authUser
 */
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.status(401).json({ error: 'Unauthorized — Bearer token required' }); return; }
    const payload = verifyToken(token);
    if (!payload) { res.status(401).json({ error: 'Unauthorized — invalid or expired token' }); return; }
    (req as any).authUser = payload;
    next();
};

const AI_FREE_DAILY_LIMIT = 2;

/**
 * checkPlanAccess — requireAuth + AI quota enforcement.
 * Admins and premium users bypass the daily limit.
 * Free users are limited to AI_FREE_DAILY_LIMIT requests/day (checked live from DB).
 */
const checkPlanAccess = async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.status(401).json({ error: 'Unauthorized — Bearer token required' }); return; }
    const payload = verifyToken(token);
    if (!payload) { res.status(401).json({ error: 'Unauthorized — invalid or expired token' }); return; }

    // Admins and premium users: skip quota check
    if (payload.role === 'admin' || payload.plan === 'premium') {
        (req as any).authUser = payload;
        next(); return;
    }

    // Free users: check live DB count (token doesn't carry mutable usage)
    const user = await storage.getUser(payload.id);
    if (!user) { res.status(401).json({ error: 'Unauthorized — user not found' }); return; }

    const today = new Date().toISOString().slice(0, 10);
    const resetAt = (user as any).aiUsageResetAt ?? today;
    const usageToday = resetAt === today ? ((user as any).aiUsageCount ?? 0) : 0;

    if (usageToday >= AI_FREE_DAILY_LIMIT) {
        res.status(403).json({
            error: 'AI_LIMIT_REACHED',
            message: `Free plan allows ${AI_FREE_DAILY_LIMIT} AI requests per day. Upgrade to Premium for unlimited access.`,
            usageToday, limit: AI_FREE_DAILY_LIMIT, plan: 'free',
        }); return;
    }
    (req as any).authUser = payload;
    next();
};

/**
 * requireAdmin — verifies JWT and checks role === 'admin'.
 * No separate x-admin-id header needed — role is in the token.
 */
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const payload = verifyToken(token);
    if (!payload) { res.status(401).json({ error: 'Unauthorized — invalid or expired token' }); return; }
    if (payload.role !== 'admin') { res.status(403).json({ error: 'Forbidden: admin only' }); return; }
    (req as any).adminUser = payload;
    next();
};

api.post('/recommendations', (req, res) => {
    try {
        const { activities } = req.body as { activities: ActivityInput[] };
        if (!Array.isArray(activities)) {
            res.status(400).json({ error: 'activities array required' }); return;
        }
        res.json(buildRecommendations(activities));
    } catch (err: any) {
        console.error('Recommendations error:', err);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// ── OpenRouter shared helper ─────────────────────────────────────

/**
 * Model chain — tried in order until one succeeds.
 * gpt-4o-mini is cheap, fast, and highly available on OpenRouter.
 * mixtral is the fallback for variety.
 */
const OR_MODELS = [
    'openai/gpt-4o-mini',
    'mistralai/mistral-7b-instruct',
    'mistralai/mixtral-8x7b-instruct',
];

const OR_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
// Use env var so it works on Render, Vercel, and local without hardcoding
const OR_REFERER = process.env.FRONTEND_URL || process.env.APP_URL || process.env.RENDER_EXTERNAL_URL || 'https://progresss-tracker.vercel.app';

interface ORMessage { role: 'system' | 'user' | 'assistant'; content: string; }

interface ORCallOptions {
    messages: ORMessage[];
    temperature?: number;
    max_tokens?: number;
    timeoutMs?: number;   // per-attempt timeout
    retries?: number;     // extra attempts after first failure
    tag: string;          // log prefix e.g. '[analyze]'
}

/**
 * Calls OpenRouter with automatic model fallback + retry.
 * Returns the raw content string or throws with a `.code` property.
 */
async function callOpenRouter(apiKey: string, opts: ORCallOptions): Promise<string> {
    const {
        messages, temperature = 0.4, max_tokens = 700,
        timeoutMs = 20_000, retries = 1, tag,
    } = opts;

    console.log(`${tag} OpenRouter call — referer=${OR_REFERER} models=${OR_MODELS.join(',')}`);

    let lastErr: any = null;

    for (const model of OR_MODELS) {
        for (let attempt = 1; attempt <= retries + 1; attempt++) {
            try {
                console.log(`${tag} Trying model="${model}" attempt=${attempt}`);

                const response = await axios.post(
                    OR_ENDPOINT,
                    { model, messages, temperature, max_tokens },
                    {
                        timeout: timeoutMs,
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json',
                            'HTTP-Referer': OR_REFERER,
                            'X-Title': 'DSA Progress Tracker',
                        },
                    },
                );

                console.log(`${tag} model="${model}" status=${response.status} usage=${JSON.stringify(response.data?.usage ?? {})}`);

                const content: string = response.data?.choices?.[0]?.message?.content?.trim() ?? '';
                if (!content) {
                    console.warn(`${tag} model="${model}" returned empty content — data:`, JSON.stringify(response.data));
                    const e: any = new Error('Empty content from model');
                    e.code = 'INVALID_RESPONSE';
                    throw e;
                }

                return content; // ✅ success

            } catch (err: any) {
                lastErr = err;

                // Axios wraps HTTP errors — extract details
                if (axios.isAxiosError(err)) {
                    const axErr = err as AxiosError;
                    const status = axErr.response?.status ?? 0;
                    const body = JSON.stringify(axErr.response?.data ?? {});
                    console.error(`${tag} model="${model}" attempt=${attempt} HTTP ${status}: ${body}`);

                    // 401/403 = bad key — no point retrying any model
                    if (status === 401 || status === 403) {
                        const e: any = new Error(`OpenRouter auth failed (${status})`);
                        e.code = 'AUTH_FAILED';
                        throw e;
                    }

                    // 429 = rate limit — skip to next model immediately
                    if (status === 429) {
                        console.warn(`${tag} model="${model}" rate-limited — trying next model`);
                        break; // break attempt loop, continue model loop
                    }

                    // Timeout
                    if (axErr.code === 'ECONNABORTED' || axErr.message?.includes('timeout')) {
                        console.warn(`${tag} model="${model}" attempt=${attempt} timed out after ${timeoutMs}ms`);
                        lastErr = Object.assign(new Error('Timeout'), { code: 'TIMEOUT' });
                    }

                    // 5xx — retry same model once, then move on
                    if (status >= 500 && attempt <= retries) {
                        const delay = attempt * 1000;
                        console.warn(`${tag} model="${model}" 5xx — retrying in ${delay}ms`);
                        await new Promise(r => setTimeout(r, delay));
                        continue;
                    }
                } else {
                    // Non-axios error (e.g. INVALID_RESPONSE from above)
                    console.error(`${tag} model="${model}" attempt=${attempt} non-HTTP error:`, err?.message);
                }

                // Move to next model after exhausting retries
                break;
            }
        }
    }

    // All models exhausted
    console.error(`${tag} All models failed. Last error:`, lastErr?.message ?? lastErr);
    const finalErr: any = new Error('All AI models unavailable');
    finalErr.code = lastErr?.code ?? 'AI_UNAVAILABLE';
    throw finalErr;
}

// ── AI Analysis route ────────────────────────────────────────────

api.post('/ai/analyze', checkPlanAccess, async (req, res) => {
    try {
        const authUser = (req as any).authUser;
        const { activities, username } = req.body as {
            activities: Array<{
                topic: string; difficulty: string; solved: boolean;
                date: string; timeSpent: number; category: string;
            }>;
            username?: string;
        };

        if (!activities || activities.length === 0) {
            res.status(400).json({ error: 'No activity data provided' }); return;
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
            console.warn('[analyze] OPENROUTER_API_KEY missing');
            res.status(501).json({ error: 'OPENROUTER_API_KEY is not configured' }); return;
        }

        // ── Build compact summary ──────────────────────────────────
        const topicMap: Record<string, { solved: number; attempted: number }> = {};
        const diffMap: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
        const dailyMap: Record<string, number> = {};

        activities.forEach(a => {
            const t = a.topic || a.category || 'General';
            if (!topicMap[t]) topicMap[t] = { solved: 0, attempted: 0 };
            if (a.solved) topicMap[t].solved++; else topicMap[t].attempted++;
            if (a.difficulty && diffMap[a.difficulty] !== undefined) diffMap[a.difficulty]++;
            const day = a.date?.slice(0, 10);
            if (day) dailyMap[day] = (dailyMap[day] || 0) + 1;
        });

        const totalSolved = activities.filter(a => a.solved).length;
        const totalAttempted = activities.length - totalSolved;
        const activeDays = Object.keys(dailyMap).length;
        const topicSummary = Object.entries(topicMap)
            .sort(([, a], [, b]) => (b.solved + b.attempted) - (a.solved + a.attempted))
            .map(([t, v]) => `${t}: ${v.solved} solved, ${v.attempted} attempted`)
            .join('; ');

        const systemPrompt =
            'Act as a coding coach. Analyze the user\'s DSA progress and return structured insights. ' +
            'Respond ONLY with a valid JSON object — no markdown, no explanation, no code fences.';

        const userPrompt =
            `Student: ${username || 'User'}\n` +
            `Total solved: ${totalSolved} | Attempted (unsolved): ${totalAttempted} | Active days: ${activeDays}\n` +
            `Difficulty — Easy: ${diffMap.Easy}, Medium: ${diffMap.Medium}, Hard: ${diffMap.Hard}\n` +
            `Topics: ${topicSummary}\n\n` +
            `Return this exact JSON shape:\n` +
            `{\n` +
            `  "strengths": ["<insight>","<insight>","<insight>"],\n` +
            `  "weaknesses": ["<insight>","<insight>","<insight>"],\n` +
            `  "suggestions": [\n` +
            `    { "topic": "<topic>", "reason": "<why>", "priority": "High|Medium|Low" },\n` +
            `    { "topic": "<topic>", "reason": "<why>", "priority": "High|Medium|Low" },\n` +
            `    { "topic": "<topic>", "reason": "<why>", "priority": "High|Medium|Low" }\n` +
            `  ],\n` +
            `  "nextProblems": [\n` +
            `    { "name": "<name>", "difficulty": "Easy|Medium|Hard", "topic": "<topic>", "reason": "<why>" },\n` +
            `    { "name": "<name>", "difficulty": "Easy|Medium|Hard", "topic": "<topic>", "reason": "<why>" },\n` +
            `    { "name": "<name>", "difficulty": "Easy|Medium|Hard", "topic": "<topic>", "reason": "<why>" }\n` +
            `  ],\n` +
            `  "overallAssessment": "<2-3 sentence summary>",\n` +
            `  "nextMilestone": "<one concrete goal>"\n` +
            `}`;

        const raw = await callOpenRouter(apiKey, {
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            temperature: 0.4, max_tokens: 700, timeoutMs: 20_000, retries: 1,
            tag: '[analyze]',
        });

        // Strip markdown fences if model wraps output
        const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        let result: unknown;
        try {
            result = JSON.parse(jsonStr);
        } catch {
            console.error('[analyze] JSON parse failed. Raw:', raw);
            res.status(502).json({ error: 'AI returned malformed JSON', raw }); return;
        }

        if (authUser && authUser.role !== 'admin' && authUser.plan !== 'premium') {
            await storage.incrementAiUsage(authUser.id).catch(() => { });
        }

        res.json(result);
    } catch (error: any) {
        console.error('[analyze] Fatal error:', error?.message ?? error);
        const code = error?.code ?? 'AI_UNAVAILABLE';
        if (code === 'TIMEOUT') { res.status(504).json({ error: 'AI request timed out' }); return; }
        if (code === 'AUTH_FAILED') { res.status(502).json({ error: 'OpenRouter authentication failed — check API key' }); return; }
        res.status(500).json({ error: 'Failed to generate analysis' });
    }
});

// ── AI Explain Topic route ───────────────────────────────────────

api.post('/ai/explain-topic', checkPlanAccess, async (req, res) => {
    try {
        const authUser = (req as any).authUser;
        const { subject, topic, subtopics, interviewQuestions } = req.body as {
            subject: string; topic: string; subtopics: string[]; interviewQuestions: string[];
        };
        if (!subject || !topic) { res.status(400).json({ error: 'subject and topic are required' }); return; }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
            console.warn('[explain-topic] OPENROUTER_API_KEY missing');
            res.status(501).json({ error: 'API_KEY_MISSING', message: 'AI service is not configured' }); return;
        }

        const systemPrompt = 'You are a senior software engineer and interview coach. Explain technical topics clearly for placement preparation. Use simple language, concrete examples, and highlight what interviewers actually ask.';
        const userPrompt = `Subject: ${subject}\nTopic: ${topic}\nSubtopics: ${subtopics?.join(', ') ?? ''}\n\nProvide a clear, structured explanation (3-5 paragraphs) covering:\n1. Core concept in simple terms\n2. How it works (with a brief example)\n3. Why it matters in interviews\n4. Common mistakes to avoid\n\nBe concise and practical. No markdown headers — use plain paragraphs.`;

        console.log(`[explain-topic] Request: subject="${subject}" topic="${topic}"`);

        let explanation: string;
        try {
            explanation = await callOpenRouter(apiKey, {
                messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
                temperature: 0.5, max_tokens: 600, timeoutMs: 20_000, retries: 1,
                tag: '[explain-topic]',
            });
        } catch (err: any) {
            const code: string = err?.code ?? 'AI_UNAVAILABLE';
            console.error(`[explain-topic] Failed. code=${code}`, err?.message);
            // Graceful fallback — 200 with fallback flag so frontend shows key points
            res.status(200).json({ explanation: null, fallback: true, errorCode: code, keyPoints: [] }); return;
        }

        if (authUser && authUser.role !== 'admin' && authUser.plan !== 'premium') {
            await storage.incrementAiUsage(authUser.id).catch(() => { });
        }

        console.log(`[explain-topic] Success for "${topic}" (${explanation.length} chars)`);
        res.json({ explanation, fallback: false });
    } catch (error: any) {
        console.error('[explain-topic] Unexpected error:', error?.message ?? error);
        res.status(500).json({ error: 'AI_UNAVAILABLE', message: 'Failed to generate explanation' });
    }
});

// ── Admin routes ─────────────────────────────────────────────────

// GET all users
api.get('/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await storage.getAllUsers();
        res.json(users.map(({ password: _, ...u }) => u));
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE user
api.delete('/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const admin = (req as any).adminUser as JwtPayload;
        if (req.params.id === admin.id) { res.status(400).json({ error: 'Cannot delete yourself' }); return; }
        const target = await storage.getUser(req.params.id);
        if (!target) { res.status(404).json({ error: 'User not found' }); return; }
        await storage.deleteUser(req.params.id);
        await storage.createAdminLog({
            adminId: admin.id, adminEmail: admin.email,
            action: 'DELETE_USER', targetId: target.id, targetEmail: target.email,
            detail: `Deleted user ${target.email}`,
        });
        res.status(204).send();
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH user role
api.patch('/admin/users/:id/role', requireAdmin, async (req, res) => {
    try {
        const admin = (req as any).adminUser as JwtPayload;
        const { role } = req.body;
        if (!['admin', 'user'].includes(role)) { res.status(400).json({ error: 'Role must be admin or user' }); return; }
        if (req.params.id === admin.id) { res.status(400).json({ error: 'Cannot change your own role' }); return; }
        const updated = await storage.updateUser(req.params.id, { role });
        if (!updated) { res.status(404).json({ error: 'User not found' }); return; }
        await storage.createAdminLog({
            adminId: admin.id, adminEmail: admin.email,
            action: 'CHANGE_ROLE', targetId: updated.id, targetEmail: updated.email,
            detail: `Changed ${updated.email} role to ${role}`,
        });
        const { password: _, ...safe } = updated;
        res.json(safe);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET all activities (admin view, with optional filters)
api.get('/admin/activities', requireAdmin, async (req, res) => {
    try {
        const { userId, date } = req.query;
        let activities = await storage.getAllActivities();
        if (userId) activities = activities.filter(a => a.userId === userId);
        if (date) activities = activities.filter(a => a.date?.startsWith(date as string));
        res.json(activities);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET admin logs
api.get('/admin/logs', requireAdmin, async (_req, res) => {
    try {
        res.json(await storage.getAdminLogs());
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH user plan (admin only)
api.patch('/admin/users/:id/plan', requireAdmin, async (req, res) => {
    try {
        const admin = (req as any).adminUser as JwtPayload;
        const { plan } = req.body;
        if (!['free', 'premium'].includes(plan)) { res.status(400).json({ error: 'Plan must be free or premium' }); return; }
        const updated = await storage.updateUser(req.params.id, { plan } as any);
        if (!updated) { res.status(404).json({ error: 'User not found' }); return; }
        await storage.createAdminLog({
            adminId: admin.id, adminEmail: admin.email,
            action: 'CHANGE_PLAN', targetId: updated.id, targetEmail: updated.email,
            detail: `Changed ${updated.email} plan to ${plan}`,
        });
        const { password: _, ...safe } = updated;
        res.json(safe);
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET current user's AI usage status
api.get('/users/:userId/ai-usage', requireAuth, async (req, res) => {
    try {
        const authUser = (req as any).authUser as JwtPayload;
        if (authUser.role !== 'admin' && authUser.id !== req.params.userId) {
            res.status(403).json({ error: 'Forbidden' }); return;
        }
        const user = await storage.getUser(req.params.userId);
        if (!user) { res.status(404).json({ error: 'User not found' }); return; }
        const today = new Date().toISOString().slice(0, 10);
        const resetAt = (user as any).aiUsageResetAt ?? today;
        const usageToday = resetAt === today ? ((user as any).aiUsageCount ?? 0) : 0;
        res.json({
            plan: (user as any).plan ?? 'free',
            usageToday,
            limit: AI_FREE_DAILY_LIMIT,
            remaining: (user as any).plan === 'premium' || user.role === 'admin'
                ? null  // null = unlimited
                : Math.max(0, AI_FREE_DAILY_LIMIT - usageToday),
            resetsAt: today,
        });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
});

app.use('/api', api);
app.use('/', api);

// Global error handler (required for Express 5 async errors)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
});

if (process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1') {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api'))
            res.sendFile(path.resolve(distPath, 'index.html'));
    });
}

export default app;
