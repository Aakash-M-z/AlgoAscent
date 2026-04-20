import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios, { AxiosError } from 'axios';
import { storage } from './storage.js';
import { InsertUser, InsertActivity, InsertTask } from '../shared/schema.js';
import { signToken, verifyToken, extractBearer, JwtPayload } from './jwt.js';
import { sendWelcomeEmail } from './email.js';
import adminRoutes from './adminRoutes.js';
import userRoutes from './userRoutes.js';
import interviewRoutes from './interviewRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Security headers ──────────────────────────────────────────────
app.use(helmet({
    crossOriginEmbedderPolicy: false,   // needed for Google OAuth
    contentSecurityPolicy: false,        // managed by Vercel/CDN
}));

// ── Request logging ───────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Global rate limiting ──────────────────────────────────────────
// 200 req / 15 min per IP — generous for normal use, blocks abuse
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
    skip: (req) => req.path === '/api/health' || req.path === '/api/health/details',
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints — 20 attempts / 15 min
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// ── Global middleware MUST come before route mounting ─────────────
app.use(cors({
    origin: [
        'https://progresss-tracker.vercel.app',
        'http://localhost:5173',  // Vite dev server
        'http://localhost:5000',
        'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-id', 'x-user-id'],
    credentials: true,
}));
app.use(express.json({ limit: '2mb' }));  // prevent oversized payloads

// COOP headers — required for Google OAuth popup (window.closed) to work
app.use((_req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
});

// ── API Router Setup ──────────────────────────────────────────────
const api = express.Router();
app.use('/api', api);

// Health check — standardized for frontend monitoring
api.get('/health', async (_req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Detailed health — for admin debugging
api.get('/health/details', async (_req, res) => {
    const { mongoConnected } = await import('./mongo-storage.js');
    const apiKey = process.env.OPENROUTER_API_KEY;
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        storage: mongoConnected ? 'mongodb' : 'file',
        env: {
            openrouter: apiKey ? `present` : 'MISSING',
            frontendUrl: 'https://progresss-tracker.vercel.app',
            mongodb: !!process.env.MONGODB_URI,
            port: process.env.PORT || 3001,
            nodeEnv: process.env.NODE_ENV || 'development',
        },
    });
});

// Login
api.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' }); return;
        }
        const user = await storage.getUserByEmail(email.trim().toLowerCase());
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password' }); return;
        }

        // Support both bcrypt hashes (new) and plain text (legacy migration)
        let passwordMatch = false;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            // bcrypt hash — use compare
            const bcrypt = await import('bcryptjs');
            passwordMatch = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plain text
            passwordMatch = user.password === password;
        }

        if (!passwordMatch) {
            res.status(401).json({ error: 'Invalid email or password' }); return;
        }

        // Check if account is active — must be after password check to avoid user enumeration
        if (user.isActive === false) {
            res.status(403).json({
                error: 'ACCOUNT_DEACTIVATED',
                message: 'Your account has been deactivated. Please contact the administrator.',
            }); return;
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
api.post('/register', authLimiter, async (req, res) => {
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
        if ((userData as any).isActive === undefined) (userData as any).isActive = true;
        // Hash password before storing
        const bcrypt = await import('bcryptjs');
        userData.password = await bcrypt.hash(userData.password, 12);
        const user = await storage.createUser(userData);
        const { password: _, ...safeUser } = user;
        const jwtToken = signToken({ id: user.id, email: user.email, role: user.role, plan: (user as any).plan ?? 'free' });

        // Background email — don't await to avoid registration lag
        sendWelcomeEmail(user.email, user.username).catch(err =>
            console.error('[register] Welcome email failed:', err?.message ?? err)
        );

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
            headers: { Authorization: `Bearer ${googleAccessToken}` },
            signal: AbortSignal.timeout(10000), // 10s — prevents ECONNRESET on slow Google responses
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
                isActive: true,
            });
        }
        const { password: _, ...safeUser } = user;
        const jwtToken = signToken({ id: user.id, email: user.email, role: user.role, plan: (user as any).plan ?? 'free' });

        // Background email for new users — don't await
        if (user.createdAt && (Date.now() - new Date(user.createdAt).getTime()) < 10000) {
            sendWelcomeEmail(user.email, user.username).catch(err =>
                console.error('[google-auth] Welcome email failed:', err?.message ?? err)
            );
        }

        res.json({ user: safeUser, token: jwtToken });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Profile routes
api.use('/user', userRoutes);

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
api.get('/users/:id/activities', async (req, res) => {
    try {
        const id = req.params.id;
        console.log(`[GET] /users/${id}/activities - Incoming request`);

        // 1. Validate: Check if user ID is valid (MongoDB ObjectId format)
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            console.warn(`[Validation Error] Invalid user ID format received: ${id}`);
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        // 2. Add timeout handling using Promise.race (Optimize query blocking operations)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query Timeout')), 8000)
        );

        // 3. Ensure a response is always returned and handle unhandled rejections internally
        const activitiesPromise = storage.getUserActivities(id);
        const activities = await Promise.race([activitiesPromise, timeoutPromise]) as any[];

        // 5. Log DB query results
        console.log(`[DB] Successfully fetched ${activities?.length || 0} activities for user: ${id}`);

        // Return 200 OK with empty array if no activities (fixes frontend 404 error)
        return res.json(activities || []);
    } catch (error: any) {
        // 6. Log errors with stack trace
        console.error(`[Error] /users/${req.params.id}/activities:`, error.message);
        console.error(error.stack);

        if (error.message === 'Query Timeout') {
            return res.status(504).json({ error: 'Database query timed out' });
        }

        // 7. Return 500 for server errors instead of 503
        return res.status(500).json({ error: 'Internal Server Error while fetching activities. Please try again later.' });
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
 * requireAuth — verifies JWT, then checks user still exists and is active.
 * Returns 401 ACCOUNT_DEACTIVATED if user was deleted/deactivated by admin.
 */
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.status(401).json({ error: 'Unauthorized — Bearer token required' }); return; }
    const payload = verifyToken(token);
    if (!payload) { res.status(401).json({ error: 'Unauthorized — invalid or expired token' }); return; }

    try {
        // Live DB check — catches deactivated/deleted accounts even with valid JWT
        const user = await storage.getUser(payload.id);
        // isActive defaults to true for existing users that don't have the field yet
        if (!user || user.isActive === false) {
            res.status(401).json({
                error: 'ACCOUNT_DEACTIVATED',
                message: 'Your account has been deactivated. Please contact support.',
            });
            return;
        }
    } catch {
        // DB unavailable — fall through with JWT-only auth rather than blocking all requests
    }

    (req as any).authUser = payload;
    next();
};

const AI_FREE_DAILY_LIMIT = 20;

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
                            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
                            'X-Title': 'DSA Tracker AI',
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

// ── General AI Chat route ────────────────────────────────────────

api.post('/ai/chat', async (req, res) => {
    try {
        let authUser: any = null;

        // Optional Auth Check - allow unauthenticated fallback
        const token = extractBearer(req.headers.authorization);
        if (token) {
            const payload = verifyToken(token);
            if (payload) {
                // Check usage if not admin/premium
                if (payload.role !== 'admin' && payload.plan !== 'premium') {
                    const user = await storage.getUser(payload.id);
                    if (user) {
                        const today = new Date().toISOString().slice(0, 10);
                        const resetAt = (user as any).aiUsageResetAt ?? today;
                        const usageToday = resetAt === today ? ((user as any).aiUsageCount ?? 0) : 0;
                        if (usageToday >= AI_FREE_DAILY_LIMIT) {
                            res.status(403).json({
                                error: 'AI_LIMIT_REACHED',
                                message: `Free plan allows ${AI_FREE_DAILY_LIMIT} AI requests per day. Upgrade to Premium for unlimited access.`
                            }); return;
                        }
                    }
                }
                authUser = payload;
            }
        }

        const { message, history = [], userStats } = req.body;

        if (!message) { res.status(400).json({ error: 'Message is required' }); return; }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
            res.status(501).json({ error: 'API_KEY_MISSING', message: 'AI service is not configured' }); return;
        }

        const hasUserData = userStats && (userStats.solved > 0 || userStats.streak > 0 || userStats.topCat);

        const systemPrompt = hasUserData
            ? `You are an expert AI mentor and interviewer for Software Engineering and DSA.
You have access to the user's progress data:
- Problems solved: ${userStats.solved || 0}
- Current streak: ${userStats.streak || 0} days
- Strongest/Most active topic: ${userStats.topCat || 'N/A'}

Act as a mentor + interviewer. Use this data to personalize your responses.
Encourage them on their streak. If they ask for advice, guide them based on their recent topics.
Detect the user's intent. If they want to chat, converse naturally.
Never reject a valid query. Keep your tone friendly, helpful, and clear.`
            : `You are a helpful AI assistant for coding interviews and DSA.
Provide clean code solutions, explain the approach, and state time/space complexity.
Act as a mentor. Handle general conversation naturally.
Never reject a valid query. Keep your tone friendly, helpful, and clear.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message }
        ];

        let reply: string;
        try {
            reply = await callOpenRouter(apiKey, {
                messages,
                temperature: 0.6,
                max_tokens: 1500,
                timeoutMs: 25000,
                retries: 1,
                tag: '[chat]',
            });
        } catch (err: any) {
            const code: string = err?.code ?? 'AI_UNAVAILABLE';
            console.error(`[chat] Failed. code=${code}`, err?.message);
            res.status(502).json({ error: code, message: 'AI failed to respond at this time' }); return;
        }

        if (authUser && authUser.role !== 'admin' && authUser.plan !== 'premium') {
            await storage.incrementAiUsage(authUser.id).catch(() => { });
        }

        res.json({ reply });
    } catch (error: any) {
        console.error('[chat] Unexpected error:', error?.message ?? error);
        res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
    }
});

// ── Context-aware AI chat (subject follow-up questions) ───────────────────────
api.post('/ai/chat-context', checkPlanAccess, async (req, res) => {
    try {
        const authUser = (req as any).authUser;
        const {
            message,
            context,
            history = [],
        }: {
            message: string;
            context: { title: string; explanation: string; keyPoints: string[] };
            history: { role: 'user' | 'assistant'; content: string }[];
        } = req.body;

        if (!message?.trim()) {
            res.status(400).json({ error: 'message is required' }); return;
        }
        if (!context?.title) {
            res.status(400).json({ error: 'context.title is required' }); return;
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            res.status(501).json({ error: 'API_KEY_MISSING' }); return;
        }

        // Keep last 5 exchanges (10 messages) to stay within token budget
        const trimmedHistory = history.slice(-10);

        const keyPointsText = context.keyPoints?.length
            ? `\nKey points:\n${context.keyPoints.map(p => `• ${p}`).join('\n')}`
            : '';

        const explanationSnippet = context.explanation
            ? `\n\nExplanation provided to the user:\n"""\n${context.explanation.slice(0, 1200)}${context.explanation.length > 1200 ? '…' : ''}\n"""`
            : '';

        const systemPrompt = `You are an expert tutor specializing in DSA, System Design, Operating Systems, OOP, and Computer Networks.

The user is currently studying: "${context.title}"${keyPointsText}${explanationSnippet}

Your role:
- Answer follow-up questions about this specific topic clearly and concisely
- Use examples, analogies, and code snippets where helpful
- If asked something unrelated, gently redirect to the current topic
- Keep responses focused — 2–4 paragraphs max unless a longer answer is genuinely needed
- Format code in markdown code blocks with the correct language tag`;

        const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...trimmedHistory,
            { role: 'user' as const, content: message.trim() },
        ];

        let reply: string;
        try {
            reply = await callOpenRouter(apiKey, {
                messages,
                temperature: 0.5,
                max_tokens: 800,
                timeoutMs: 20000,
                retries: 1,
                tag: '[chat-context]',
            });
        } catch (err: any) {
            res.status(502).json({ error: err?.code ?? 'AI_UNAVAILABLE' }); return;
        }

        // Increment usage for free users
        if (authUser?.role !== 'admin' && authUser?.plan !== 'premium') {
            await storage.incrementAiUsage(authUser.id).catch(() => { });
        }

        res.json({ reply });
    } catch (err: any) {
        console.error('[chat-context] error:', err?.message);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});

// ── Admin routes ─────────────────────────────────────────────────
// User CRUD (GET/POST/PATCH/DELETE /admin/users) is handled by adminRoutes.ts
// Only non-overlapping routes remain here.

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

// GET current user's AI usage status
api.get('/users/:userId/ai-usage', requireAuth, async (req, res) => {
    try {
        const authUser = (req as any).authUser as JwtPayload;
        if (authUser.role !== 'admin' && authUser.id !== req.params.userId) {
            res.status(403).json({ error: 'Forbidden' }); return;
        }
        const user = await storage.getUser(String(req.params.userId));
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

// Advanced Enterprise Admin routes module
api.use('/admin', requireAdmin, adminRoutes);

// Mock Interview routes
api.use('/interview', interviewRoutes);

// AI Mentor routes
import mentorRoutes from './mentorRoutes.js';
api.use('/mentor', mentorRoutes);

// ── Problems API ──────────────────────────────────────────────────────────────
import { ProblemModel } from './models.js';

/**
 * GET /api/problems
 * Query params:
 *   difficulty = easy | medium | hard
 *   topic      = Arrays | Graphs | ...
 *   tags       = comma-separated tag list (any match)
 *   search     = full-text search on title
 *   page       = page number (default 1)
 *   limit      = results per page (default 20, max 100)
 */
api.get('/problems', async (req, res) => {
    try {
        const { difficulty, topic, tags, search, page = '1', limit = '20' } = req.query as Record<string, string>;

        const filter: Record<string, any> = {};
        if (difficulty) filter.difficulty = difficulty.toLowerCase();
        if (topic) filter.topic = { $regex: new RegExp(`^${topic}$`, 'i') };
        if (tags) filter.tags = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
        if (search) filter.title = { $regex: new RegExp(search, 'i') };

        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const [problems, total] = await Promise.all([
            ProblemModel.find(filter, { description: 0 }) // exclude heavy field from list view
                .sort({ leetcodeId: 1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            ProblemModel.countDocuments(filter),
        ]);

        res.json({
            problems,
            pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/problems/:slug
 * Returns full problem including description and test cases.
 */
api.get('/problems/:slug', async (req, res) => {
    try {
        const problem = await ProblemModel.findOne({ slug: req.params.slug }).lean();
        if (!problem) return res.status(404).json({ error: 'Problem not found' });
        res.json(problem);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/problems/random
 * Returns a random problem, optionally filtered by difficulty/topic.
 */
api.get('/problems/random', async (req, res) => {
    try {
        const { difficulty, topic } = req.query as Record<string, string>;
        const filter: Record<string, any> = {};
        if (difficulty) filter.difficulty = difficulty.toLowerCase();
        if (topic) filter.topic = { $regex: new RegExp(`^${topic}$`, 'i') };

        const count = await ProblemModel.countDocuments(filter);
        if (count === 0) return res.status(404).json({ error: 'No problems match the filter' });

        const skip = Math.floor(Math.random() * count);
        const problem = await ProblemModel.findOne(filter).skip(skip).lean();
        res.json(problem);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Export the router for use elsewhere
export { api };

// ── Global error handler (Express 5 async errors) ─────────────────────────────
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? err.statusCode ?? 500;
    const message = err.message || 'Internal server error';

    // Don't log 4xx — those are client errors, not server bugs
    if (status >= 500) {
        console.error(`[error] ${req.method} ${req.path} →`, err);
    }

    // Never expose stack traces in production
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
});

if (process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1') {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api'))
            res.sendFile(path.resolve(distPath, 'index.html'));
    });
}

// ── Debug: Log All Routes ──────────────────────────────────────────
function printRoutes(stack: any[], prefix = '') {
    stack.forEach(r => {
        if (r.route) {
            const methods = Object.keys(r.route.methods).join(',').toUpperCase();
            console.log(`${methods} ${prefix}${r.route.path}`);
        } else if (r.name === 'router' && r.handle?.stack) {
            const mount = r.regexp?.source
                ?.replace(/\\\//g, '/')
                ?.replace(/^\^/, '')
                ?.replace(/\\\/?(?=\\\/|\$)/, '')
                ?.replace(/\?.*$/, '')
                ?.replace(/\$$/, '') ?? '';
            printRoutes(r.handle.stack, prefix + mount);
        }
    });
}

if (process.env.NODE_ENV !== 'production') {
    // Defer to next tick so all route registrations (including async imports) complete first
    setImmediate(() => {
        const router = (app as any)._router;
        if (router?.stack) {
            console.log('--- REGISTERED ROUTES ---');
            printRoutes(router.stack);
            console.log('-------------------------');
        }
    });
}

export default app;
