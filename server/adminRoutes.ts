import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
    UserModel, ActivityModel, AdminLogModel, TaskModel,
    FeatureFlagModel, NotificationModel
} from './models.js';

const router = Router();

// ── Middleware: MongoDB Status Checker ─────────────────────
// Instead of 503, we flag the request so routes can provide fallback data
router.use((req, res, next) => {
    (req as any).dbConnected = mongoose.connection.readyState === 1;
    if (!(req as any).dbConnected) {
        console.warn('⚠️ Admin Route: MongoDB not connected, using fallback mode');
    }
    next();
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

export default router;
