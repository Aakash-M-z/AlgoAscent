import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import {
    UserModel, ActivityModel, AdminLogModel, TaskModel,
    FeatureFlagModel, NotificationModel
} from './models.js';

const router = Router();

// Middleware to ensure MongoDB is connected
router.use((req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ error: 'Advanced Admin features require MongoDB connection. Please configure MONGODB_URI.' });
        return;
    }
    next();
});

// ── 1. Advanced Analytics Dashboard ───────────────────────
router.get('/analytics', async (req, res) => {
    try {
        const totalUsers = await UserModel.countDocuments();
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsersLast30 = await UserModel.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        
        const todayStr = new Date().toISOString().slice(0, 10);
        // DAU: users who solved/attempted a problem today
        const dauRows = await ActivityModel.distinct('userId', { date: { $regex: `^${todayStr}` } });
        const dau = dauRows.length;
        
        // Retention: users > 7 days old who were active in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeRecent = await ActivityModel.distinct('userId', { createdAt: { $gte: sevenDaysAgo } });
        const olderUsersCount = await UserModel.countDocuments({ createdAt: { $lt: sevenDaysAgo } });
        
        // Just rough retention approximation
        let retention = 0;
        if (olderUsersCount > 0) {
            retention = Math.round((activeRecent.length / olderUsersCount) * 100);
        }

        // Activity distribution by difficulty
        const diffStats = await ActivityModel.aggregate([
            { $group: { _id: "$difficulty", count: { $sum: 1 } } }
        ]);

        // Monthly user growth (rough grouping by month)
        const userGrowth = await UserModel.aggregate([
            { $project: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } } },
            { $group: { _id: { month: "$month", year: "$year" }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            { $limit: 12 }
        ]);

        res.json({
            kpis: { totalUsers, dau, newUsersLast30, retention },
            diffStats: diffStats.map(d => ({ difficulty: d._id, count: d.count })),
            userGrowth: userGrowth.map(g => ({ month: `${g._id.year}-${String(g._id.month).padStart(2, '0')}`, count: g.count }))
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 2. AI Usage Monitoring ────────────────────────────────
router.get('/ai-monitoring', async (req, res) => {
    try {
        // total ai requests proxy (sum of all users aiUsageCount if they didn't reset, but realistically we need a log)
        // For simplicity, we just aggregate current usage
        const usageData = await UserModel.aggregate([
            { $group: { _id: "$plan", totalAi: { $sum: "$aiUsageCount" }, avgAi: { $avg: "$aiUsageCount" } } }
        ]);

        const topUsers = await UserModel.find({}, { username: 1, email: 1, aiUsageCount: 1, plan: 1 })
            .sort({ aiUsageCount: -1 })
            .limit(10);

        res.json({ 
            usageByPlan: usageData.map(d => ({ plan: d._id, total: d.totalAi, avg: Math.round(d.avgAi * 10) / 10 })),
            topUsers 
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 3. Feature Toggles ────────────────────────────────────
router.get('/features', async (req, res) => {
    try {
        let flags = await FeatureFlagModel.find();
        if (flags.length === 0) {
            // Seed defaults
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
    try {
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? 'Connected' : dbState === 2 ? 'Connecting' : 'Disconnected';
        
        // Fake latency check
        const start = Date.now();
        await UserModel.findOne();
        const latency = Date.now() - start;

        res.json({
            uptime: process.uptime(),
            dbStatus,
            dbLatencyMs: latency,
            memory: process.memoryUsage(),
            env: process.env.NODE_ENV
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 5. Notifications / Broadcast ──────────────────────────
router.post('/notifications', async (req, res) => {
    try {
        const { title, message, targetAudience } = req.body;
        const adminEmail = (req as any).adminUser?.email || 'admin@system.local';
        
        const notif = await NotificationModel.create({
            title, message, targetAudience, senderEmail: adminEmail
        });
        
        // In a real app, you'd trigger webhooks, emails, or socket events here.
        res.status(201).json(notif);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/notifications', async (req, res) => {
    try {
        const notifs = await NotificationModel.find().sort({ createdAt: -1 }).limit(50);
        res.json(notifs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ── 6. Filtered Audit Logs ────────────────────────────────
router.get('/logs', async (req, res) => {
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
