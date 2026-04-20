import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import {
    UserModel, ActivityModel, AdminLogModel, TaskModel,
    FeatureFlagModel, NotificationModel, InterviewSessionModel
} from './models.js';
import { sendWelcomeEmail } from './email.js';
import { sendAccountDeactivatedEmail, sendAccountActivatedEmail } from './email.service.js';

const router = Router();

// ── Zod schemas ───────────────────────────────────────────────────────────────
const CreateUserSchema = z.object({
    username: z.string().min(2).max(32).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
    email: z.string().email().max(255).transform(s => s.trim().toLowerCase()),
    password: z.string().min(8).max(128).optional(),
    role: z.enum(['admin', 'user']).default('user'),
    plan: z.enum(['free', 'premium']).default('free'),
    sendWelcome: z.boolean().default(false),
});

const UpdateUserSchema = z.object({
    role: z.enum(['admin', 'user']).optional(),
    plan: z.enum(['free', 'premium']).optional(),
}).refine(d => d.role !== undefined || d.plan !== undefined, {
    message: 'At least one of role or plan must be provided',
});

// ── Helper: log admin action ──────────────────────────────────────────────────
async function logAction(req: Request, action: string, targetId: string, targetEmail: string, detail: string) {
    const admin = (req as any).adminUser;
    await AdminLogModel.create({
        adminId: admin?.id ?? 'system',
        adminEmail: admin?.email ?? 'system',
        action,
        targetId,
        targetEmail,
        detail,
    }).catch(err => console.error('[adminLog] Failed to write log:', err?.message));
}


// ── Middleware: MongoDB Status Checker ─────────────────────
// Instead of 503, we flag the request so routes can provide fallback data
router.use((req, res, next) => {
    (req as any).dbConnected = mongoose.connection.readyState === 1;
    if (!(req as any).dbConnected) {
        console.warn('⚠️ Admin Route: MongoDB not connected, using fallback mode');
    }
    next();
});

// ═════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

// ── GET /admin/users — list all users ────────────────────────────────────────
router.get('/users', async (req: Request, res: Response) => {
    if (!(req as any).dbConnected) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
    try {
        // Return all users including deactivated — pass ?active=true to filter active only
        const activeOnly = req.query.active === 'true';
        const filter = activeOnly ? { isActive: { $ne: false } } : {};
        const users = await UserModel.find(filter, { password: 0 }).sort({ createdAt: -1 }).lean();
        res.set('Cache-Control', 'no-store');
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /admin/users — create user ──────────────────────────────────────────
router.post('/users', async (req: Request, res: Response) => {
    if (!(req as any).dbConnected) {
        return res.status(503).json({ error: 'Database unavailable' });
    }

    const parsed = CreateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const { username, email, password, role, plan, sendWelcome } = parsed.data;

    try {
        // Duplicate checks
        const [emailExists, usernameExists] = await Promise.all([
            UserModel.exists({ email }),
            UserModel.exists({ username }),
        ]);
        if (emailExists) return res.status(409).json({ error: 'An account with this email already exists' });
        if (usernameExists) return res.status(409).json({ error: 'This username is already taken' });

        // Password: use provided or generate a secure temporary one
        const rawPassword = password ?? (Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '!');
        const hashedPassword = await bcrypt.hash(rawPassword, 12);

        const user = await UserModel.create({
            username, email,
            password: hashedPassword,
            role, plan,
            aiUsageCount: 0,
            aiUsageResetAt: new Date().toISOString().slice(0, 10),
        });

        // Fire-and-forget welcome email
        if (sendWelcome) {
            sendWelcomeEmail(email, username).catch(err =>
                console.error('[admin/createUser] Welcome email failed:', err?.message)
            );
        }

        await logAction(req, 'CREATE_USER', String(user._id), email,
            `Admin created user "${username}" with role=${role} plan=${plan}`);

        const { password: _pw, ...safeUser } = user.toObject();
        res.status(201).json(safeUser);
    } catch (err: any) {
        console.error('[admin/createUser]', err?.message);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// ── PATCH /admin/users/:id/status — toggle isActive (MUST be before /:id) ────
router.patch('/users/:id/status', async (req: Request, res: Response) => {
    if (!(req as any).dbConnected) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
    try {
        const admin = (req as any).adminUser;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'isActive must be a boolean' });
        }
        if (req.params.id === admin?.id && !isActive) {
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }

        const user = await UserModel.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive } },
            { new: true, projection: { password: 0 } }
        ).lean();

        if (!user) return res.status(404).json({ error: 'User not found' });

        const action = isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER';
        await logAction(req, action, String(req.params.id), (user as any).email,
            `${isActive ? 'Activated' : 'Deactivated'} user "${(user as any).username}"`);

        if (!isActive) {
            sendAccountDeactivatedEmail((user as any).email, (user as any).username).catch(err =>
                console.error('[admin/status] Deactivation email failed:', err?.message)
            );
        } else {
            sendAccountActivatedEmail((user as any).email, (user as any).username).catch(err =>
                console.error('[admin/status] Activation email failed:', err?.message)
            );
        }

        res.json({ id: req.params.id, isActive });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── PATCH /admin/users/:id — update role and/or plan ─────────────────────────
router.patch('/users/:id', async (req: Request, res: Response) => {
    if (!(req as any).dbConnected) {
        return res.status(503).json({ error: 'Database unavailable' });
    }

    const parsed = UpdateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    try {
        const user = await UserModel.findByIdAndUpdate(
            req.params.id,
            { $set: parsed.data },
            { new: true, projection: { password: 0 } }
        ).lean();

        if (!user) return res.status(404).json({ error: 'User not found' });

        await logAction(req, 'UPDATE_USER', String(req.params.id), (user as any).email,
            `Updated: ${JSON.stringify(parsed.data)}`);

        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/users/:id', async (req: Request, res: Response) => {
    if (!(req as any).dbConnected) {
        return res.status(503).json({ error: 'Database unavailable' });
    }
    try {
        const admin = (req as any).adminUser;
        console.log(`[admin/delete] id=${String(req.params.id)} | adminId=${admin?.id}`);

        // Prevent admin from deactivating themselves
        if (req.params.id === admin?.id) {
            return res.status(400).json({ error: 'You cannot deactivate your own account' });
        }

        const user = await UserModel.findByIdAndUpdate(
            req.params.id,
            { $set: { isActive: false } },
            { new: true, projection: { password: 0 } }
        ).lean();

        console.log(`[admin/delete] result:`, user ? `found ${(user as any).username}` : 'NOT FOUND');

        if (!user) return res.status(404).json({ error: 'User not found' });

        await logAction(req, 'DEACTIVATE_USER', String(req.params.id), (user as any).email,
            `Deactivated user "${(user as any).username}" — access revoked immediately`);

        // Notify the user their account was deactivated — fire-and-forget
        sendAccountDeactivatedEmail((user as any).email, (user as any).username).catch(err =>
            console.error('[admin/deactivate] Notification email failed:', err?.message)
        );

        res.status(204).send();
    } catch (err: any) {
        console.error('[admin/delete] error:', err?.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Mock Data Generators ──────────────────────────────────
const getMockAnalytics = () => ({
    kpis: {
        totalUsers: 1240,
        dau: 156,
        newUsersLast30: 84,
        retention: 68
    },
    diffStats: [
        { difficulty: 'Easy', count: 450 },
        { difficulty: 'Medium', count: 820 },
        { difficulty: 'Hard', count: 180 }
    ],
    userGrowth: [
        { month: '2025-10', count: 120 },
        { month: '2025-11', count: 240 },
        { month: '2025-12', count: 480 },
        { month: '2026-01', count: 860 },
        { month: '2026-02', count: 1240 }
    ],
    isFallback: true
});

const getMockAIUsage = () => ({
    usageByPlan: [
        { plan: 'free', total: 4500, avg: 12.5 },
        { plan: 'pro', total: 12800, avg: 45.2 },
        { plan: 'admin', total: 150, avg: 5.0 }
    ],
    topUsers: [
        { username: 'Aakashext', email: 'aakash@example.com', aiUsageCount: 450, plan: 'pro' },
        { username: 'MockUser1', email: 'user1@mock.com', aiUsageCount: 320, plan: 'free' },
    ],
    isFallback: true
});

const getMockFeatures = () => ([
    { name: 'AI Recommendations', key: 'ai_recs', enabled: true, description: 'Smart problem suggestions (Mocked)' },
    { name: 'Mock Interviews', key: 'mock_interviews', enabled: false, description: 'Beta P2P interviews (Mocked)' },
    { name: 'Advanced Analytics', key: 'advanced_analytics', enabled: true, description: 'Pro charts for users (Mocked)' },
]);

const getMockInterviewAnalytics = () => ({
    kpis: {
        totalUsers: 840,
        averageScore: 72,
        passRate: 64,
        mostFailedTopics: 'Dynamic Programming'
    },
    recentActivity: [
        { username: 'aakash', topic: 'Graphs', score: 85, timestamp: new Date(), status: 'Pass' },
        { username: 'user123', topic: 'DP', score: 45, timestamp: new Date(Date.now() - 3600000), status: 'Fail' },
        { username: 'dev_m', topic: 'Linked List', score: 92, timestamp: new Date(Date.now() - 7200000), status: 'Pass' },
    ],
    scoreDistribution: [
        { range: '0-20', count: 5 },
        { range: '21-40', count: 12 },
        { range: '41-60', count: 25 },
        { range: '61-80', count: 48 },
        { range: '81-100', count: 32 }
    ],
    topicPerformance: [
        { topic: 'Arrays', avgScore: 78, passRate: 82 },
        { topic: 'Trees', avgScore: 65, passRate: 58 },
        { topic: 'DP', avgScore: 42, passRate: 31 },
        { topic: 'Graphs', avgScore: 58, passRate: 45 }
    ],
    weeklyTrends: [
        { day: 'Mon', interviews: 12 },
        { day: 'Tue', interviews: 18 },
        { day: 'Wed', interviews: 15 },
        { day: 'Thu', interviews: 22 },
        { day: 'Fri', interviews: 30 },
        { day: 'Sat', interviews: 25 },
        { day: 'Sun', interviews: 10 }
    ],
    topUsers: [
        { username: 'aakash', avgScore: 94, totalInterviews: 12 },
        { username: 'top_coder', avgScore: 91, totalInterviews: 8 },
        { username: 'algo_master', avgScore: 89, totalInterviews: 15 }
    ],
    insights: [
        "Users struggle with Dynamic Programming (31% pass rate)",
        "Array manipulation topics show highest competency",
        "Average score dropped by 5% in the last 48 hours"
    ],
    isFallback: true
});

// ── 1. Advanced Analytics Dashboard ───────────────────────
router.get('/analytics', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.json(getMockAnalytics());
    }

    try {
        const totalUsers = await UserModel.countDocuments();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsersLast30 = await UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

        const todayStr = new Date().toISOString().slice(0, 10);
        const dauRows = await ActivityModel.distinct('userId', { date: { $regex: `^${todayStr}` } });
        const dau = dauRows.length;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeRecent = await ActivityModel.distinct('userId', { createdAt: { $gte: sevenDaysAgo } });
        const olderUsersCount = await UserModel.countDocuments({ createdAt: { $lt: sevenDaysAgo } });

        let retention = 0;
        if (olderUsersCount > 0) {
            retention = Math.round((activeRecent.length / olderUsersCount) * 100);
        }

        const diffStats = await ActivityModel.aggregate([
            { $group: { _id: "$difficulty", count: { $sum: 1 } } }
        ]);

        const userGrowth = await UserModel.aggregate([
            { $project: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } } },
            { $group: { _id: { month: "$month", year: "$year" }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 12 }
        ]);

        res.json({
            kpis: { totalUsers, dau, newUsersLast30, retention },
            diffStats: diffStats.map(d => ({ difficulty: d._id, count: d.count })),
            userGrowth: userGrowth.map(g => ({ month: `${g._id.year}-${String(g._id.month).padStart(2, '0')}`, count: g.count })),
            isFallback: false
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 2. AI Usage Monitoring ────────────────────────────────
router.get('/ai-monitoring', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.json(getMockAIUsage());
    }

    try {
        const usageData = await UserModel.aggregate([
            { $group: { _id: "$plan", totalAi: { $sum: "$aiUsageCount" }, avgAi: { $avg: "$aiUsageCount" } } }
        ]);

        const topUsers = await UserModel.find({}, { username: 1, email: 1, aiUsageCount: 1, plan: 1 })
            .sort({ aiUsageCount: -1 })
            .limit(10);

        res.json({
            usageByPlan: usageData.map(d => ({ plan: d._id, total: d.totalAi, avg: Math.round(d.avgAi * 10) / 10 })),
            topUsers,
            isFallback: false
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 3. Feature Toggles ────────────────────────────────────
router.get('/features', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.json(getMockFeatures());
    }

    try {
        let flags = await FeatureFlagModel.find();
        if (flags.length === 0) {
            await FeatureFlagModel.insertMany([
                { name: 'AI Recommendations', key: 'ai_recs', enabled: true, description: 'Smart problem suggestions' },
                { name: 'Mock Interviews', key: 'mock_interviews', enabled: false, description: 'Beta P2P interviews' },
                { name: 'Advanced Analytics', key: 'advanced_analytics', enabled: true, description: 'Pro charts for users' },
            ]);
            flags = await FeatureFlagModel.find();
        }
        res.json(flags);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/features/:key', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.status(200).json({ key: req.params.key, enabled: req.body.enabled, mock: true });
    }

    try {
        const { enabled } = req.body;
        const flag = await FeatureFlagModel.findOneAndUpdate({ key: req.params.key }, { enabled, updatedAt: new Date() }, { new: true });
        if (!flag) return res.status(404).json({ error: 'Feature flag not found' });
        res.json(flag);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 4. System Health ──────────────────────────────────────
router.get('/health-details', async (req, res) => {
    const dbStatus = (req as any).dbConnected ? 'Connected' : 'Disconnected (Fallback Mode)';

    try {
        let latency = 0;
        if ((req as any).dbConnected) {
            const start = Date.now();
            await UserModel.findOne();
            latency = Date.now() - start;
        }

        res.json({
            uptime: process.uptime(),
            dbStatus,
            dbLatencyMs: latency,
            memory: process.memoryUsage(),
            env: process.env.NODE_ENV,
            isFallback: !(req as any).dbConnected
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 5. Notifications / Broadcast ──────────────────────────
router.post('/notifications', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.status(201).json({ ...req.body, mock: true, createdAt: new Date() });
    }

    try {
        const { title, message, targetAudience } = req.body;
        const adminEmail = (req as any).adminUser?.email || 'admin@system.local';
        const notif = await NotificationModel.create({
            title, message, targetAudience, senderEmail: adminEmail
        });
        res.status(201).json(notif);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/notifications', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.json([]);
    }

    try {
        const notifs = await NotificationModel.find().sort({ createdAt: -1 }).limit(50);
        res.json(notifs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 6. Filtered Audit Logs ────────────────────────────────
router.get('/logs', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.json([
            { action: 'STORAGE_FALLBACK', detail: 'System running in local-data.json mode', createdAt: new Date() }
        ]);
    }

    try {
        const { action, limit = 50 } = req.query;
        let query: any = {};
        if (action) query.action = action;
        const logs = await AdminLogModel.find(query).sort({ createdAt: -1 }).limit(Number(limit));
        res.json(logs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 7. Interview Analytics ────────────────────────────────
router.get('/interview-analytics', async (req, res) => {
    if (!(req as any).dbConnected) {
        return res.json(getMockInterviewAnalytics());
    }

    try {
        const totalInterviews = await InterviewSessionModel.countDocuments();
        if (totalInterviews === 0) return res.json(getMockInterviewAnalytics());

        // Aggregate KPIs
        const stats = await InterviewSessionModel.aggregate([
            {
                $group: {
                    _id: null,
                    avgScore: { $avg: "$score.overallScore" },
                    totalUsers: { $addToSet: "$userId" }
                }
            }
        ]);

        const passCount = await InterviewSessionModel.countDocuments({ "score.overallScore": { $gte: 70 } });
        const passRate = Math.round((passCount / totalInterviews) * 100);

        // Topic Performance
        const topicStats = await InterviewSessionModel.aggregate([
            {
                $group: {
                    _id: "$type",
                    avgScore: { $avg: "$score.overallScore" },
                    count: { $sum: 1 },
                    passes: { $sum: { $cond: [{ $gte: ["$score.overallScore", 70] }, 1, 0] } }
                }
            },
            { $sort: { avgScore: 1 } }
        ]);

        const mostFailedTopic = topicStats.length > 0 ? topicStats[0]._id : "N/A";

        // Recent Activity
        const recentInterviews = await InterviewSessionModel.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    username: { $ifNull: ["$user.username", "Unknown"] },
                    topic: "$type",
                    score: "$score.overallScore",
                    timestamp: "$createdAt",
                    status: { $cond: [{ $gte: ["$score.overallScore", 70] }, "Pass", "Fail"] }
                }
            }
        ]);

        // Score Distribution
        const scoreDist = await InterviewSessionModel.aggregate([
            {
                $bucket: {
                    groupBy: "$score.overallScore",
                    boundaries: [0, 21, 41, 61, 81, 101],
                    default: "Other",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        // Weekly Trends
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const weeklyTrends = await InterviewSessionModel.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dayOfWeek: "$createdAt" },
                    interviews: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formattedTrends = weeklyTrends.map(w => ({
            day: days[w._id - 1],
            interviews: w.interviews
        }));

        // Top Users
        const topUsers = await InterviewSessionModel.aggregate([
            {
                $group: {
                    _id: "$userId",
                    avgScore: { $avg: "$score.overallScore" },
                    totalInterviews: { $sum: 1 }
                }
            },
            { $sort: { avgScore: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    username: { $ifNull: ["$user.username", "Shadow User"] },
                    avgScore: { $round: ["$avgScore", 1] },
                    totalInterviews: 1
                }
            }
        ]);

        res.json({
            kpis: {
                totalUsers: stats[0]?.totalUsers.length || 0,
                averageScore: Math.round(stats[0]?.avgScore || 0),
                passRate,
                mostFailedTopics: mostFailedTopic
            },
            recentActivity: recentInterviews,
            scoreDistribution: scoreDist.map((d, i) => ({
                range: `${[0, 21, 41, 61, 81][i]}-${[20, 40, 60, 80, 100][i]}`,
                count: d.count
            })),
            topicPerformance: topicStats.map(t => ({
                topic: t._id,
                avgScore: Math.round(t.avgScore),
                passRate: Math.round((t.passes / t.count) * 100)
            })),
            weeklyTrends: formattedTrends,
            topUsers,
            insights: [
                `Users struggle most with ${mostFailedTopic}`,
                `System competence level is currently at ${Math.round(stats[0]?.avgScore || 0)}%`,
                `High engagement detected in ${topicStats.sort((a, b) => b.count - a.count)[0]?._id || 'N/A'}`
            ],
            isFallback: false
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
