import { Router } from 'express';
import mongoose from 'mongoose';
import { InterviewSessionModel, ActivityModel, UserModel } from './models.js';
import { extractBearer, verifyToken } from './jwt.js';
import axios from 'axios';

const router = Router();

// ── Auth Middleware ─────────────────────────────────────────
router.use((req, res, next) => {
    const token = extractBearer(req.headers.authorization as string || '');
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
    try {
        const payload = verifyToken(token);
        (req as any).user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

const AI_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const getAiConfig = () => ({
    headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// ── Mock Data (offline fallback) ───────────────────────────
const getMockMentorData = () => ({
    weakTopics: [
        { topic: 'Dynamic Programming', avgScore: 42, sessions: 4, trend: 'declining' },
        { topic: 'Graphs', avgScore: 55, sessions: 2, trend: 'stable' },
        { topic: 'Trees', avgScore: 63, sessions: 3, trend: 'improving' }
    ],
    strongTopics: [
        { topic: 'Arrays', avgScore: 88, sessions: 6, trend: 'improving' },
        { topic: 'Strings', avgScore: 79, sessions: 5, trend: 'stable' }
    ],
    readinessScore: 64,
    readinessTrend: +8,
    dailyPlan: {
        date: new Date().toISOString().slice(0, 10),
        focusTopic: 'Dynamic Programming',
        problems: [
            { title: 'Climbing Stairs', difficulty: 'Easy', platform: 'LeetCode', url: 'https://leetcode.com/problems/climbing-stairs/', why: 'Intro to 1D DP' },
            { title: 'Coin Change', difficulty: 'Medium', platform: 'LeetCode', url: 'https://leetcode.com/problems/coin-change/', why: 'Classic unbounded knapsack pattern' },
            { title: 'Longest Common Subsequence', difficulty: 'Medium', platform: 'LeetCode', url: 'https://leetcode.com/problems/longest-common-subsequence/', why: '2D DP fundamentals' },
        ],
        xpReward: 150,
        estimatedTime: '90 min'
    },
    insights: [
        { type: 'danger', text: 'You score below 50% on Dynamic Programming. This is a FAANG must-have.' },
        { type: 'success', text: 'Array problems improved by 22% this week. You\'ve mastered the basics.' },
        { type: 'info', text: 'You\'ve completed 0 System Design interviews. Add one to your weekly plan.' }
    ],
    isFallback: true
});

// ── GET /api/mentor/insights ───────────────────────────────
router.get('/insights', async (req, res) => {
    const userId = (req as any).user.id;
    const dbConnected = mongoose.connection.readyState === 1;

    if (!dbConnected) { res.json(getMockMentorData()); return; }

    try {
        // Fetch interview history
        const sessions = await InterviewSessionModel.find({ userId }).sort({ createdAt: -1 }).limit(50);
        const activities = await ActivityModel.find({ userId }).sort({ createdAt: -1 }).limit(100);

        if (sessions.length === 0 && activities.length === 0) {
            res.json({ ...getMockMentorData(), isFallback: true, isNewUser: true }); return;
        }

        // Aggregate topic performance from interview sessions
        const topicMap: Record<string, { total: number; count: number; recent: number[] }> = {};
        for (const s of sessions) {
            const t = s.type;
            if (!topicMap[t]) topicMap[t] = { total: 0, count: 0, recent: [] };
            topicMap[t].total += (s.score?.overallScore ?? 0);
            topicMap[t].count++;
            topicMap[t].recent.push(s.score?.overallScore ?? 0);
        }

        // Aggregate from DSA activities
        const activityTopicMap: Record<string, { total: number; count: number }> = {};
        for (const a of activities) {
            const topic = a.topic || a.category;
            if (!activityTopicMap[topic]) activityTopicMap[topic] = { total: 0, count: 0 };
            activityTopicMap[topic].total += a.solved ? 80 : 40;
            activityTopicMap[topic].count++;
        }

        // Build weak/strong topic list
        const allTopics = Object.entries(topicMap).map(([topic, data]) => {
            const avgScore = Math.round(data.total / data.count);
            const half = Math.floor(data.recent.length / 2);
            const recentAvg = half > 0 ? data.recent.slice(-half).reduce((a, b) => a + b, 0) / half : avgScore;
            const olderAvg = half > 0 ? data.recent.slice(0, half).reduce((a, b) => a + b, 0) / half : avgScore;
            const trend = recentAvg > olderAvg + 5 ? 'improving' : recentAvg < olderAvg - 5 ? 'declining' : 'stable';
            return { topic, avgScore, sessions: data.count, trend };
        });

        allTopics.sort((a, b) => a.avgScore - b.avgScore);
        const weakTopics = allTopics.filter(t => t.avgScore < 70).slice(0, 5);
        const strongTopics = allTopics.filter(t => t.avgScore >= 70).slice(0, 3);

        // Calculate readiness score
        const totalAvg = allTopics.length > 0
            ? Math.round(allTopics.reduce((acc, t) => acc + t.avgScore, 0) / allTopics.length)
            : 50;

        const activityBonus = Math.min(20, Math.floor(activities.length / 5) * 2);
        const readinessScore = Math.min(100, totalAvg + activityBonus);

        // Generate AI insights
        const focusTopic = weakTopics[0]?.topic || 'Dynamic Programming';
        const insightPrompt = `You are an AI coding mentor. Based on this data, create 3 personalized insights.

Weak topics: ${weakTopics.map(t => `${t.topic}(${t.avgScore}%)`).join(', ')}
Strong topics: ${strongTopics.map(t => `${t.topic}(${t.avgScore}%)`).join(', ')}
Total interview sessions: ${sessions.length}
Overall readiness: ${readinessScore}%

Return ONLY JSON array (no markdown):
[
  {"type": "danger"|"success"|"info", "text": "<actionable insight under 15 words>"},
  {"type": "danger"|"success"|"info", "text": "<actionable insight under 15 words>"},
  {"type": "danger"|"success"|"info", "text": "<actionable insight under 15 words>"}
]`;

        let insights = getMockMentorData().insights;
        try {
            const aiRes = await axios.post(AI_BASE_URL, {
                model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
                response_format: { type: 'json_object' },
                messages: [{ role: 'user', content: insightPrompt }],
                temperature: 0.7,
            }, { ...getAiConfig(), timeout: 20000 });
            const parsed = JSON.parse(aiRes.data.choices[0].message.content);
            if (Array.isArray(parsed)) insights = parsed;
            else if (Array.isArray(parsed.insights)) insights = parsed.insights;
        } catch (aiErr: any) {
            console.warn('[mentor/insights] AI call failed, using fallback:', aiErr?.message);
            /* use fallback */
        }

        // Daily plan
        const dailyPlan = {
            date: new Date().toISOString().slice(0, 10),
            focusTopic,
            problems: [
                { title: `${focusTopic} Intro`, difficulty: 'Easy', platform: 'LeetCode', url: 'https://leetcode.com', why: 'Foundation level for this topic' },
                { title: `${focusTopic} Classic`, difficulty: 'Medium', platform: 'LeetCode', url: 'https://leetcode.com', why: 'Core pattern recognition' },
                { title: `${focusTopic} Advanced`, difficulty: 'Hard', platform: 'LeetCode', url: 'https://neetcode.io', why: 'Stretch goal for mastery' },
            ],
            xpReward: 150,
            estimatedTime: '90 min'
        };

        res.json({ weakTopics, strongTopics, readinessScore, readinessTrend: 0, dailyPlan, insights, isFallback: false });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
