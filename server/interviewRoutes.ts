import { Router } from 'express';
import mongoose from 'mongoose';
import { InterviewSessionModel } from './models.js';
import { extractBearer, verifyToken, JwtPayload } from './jwt.js';
import axios from 'axios';

const router = Router();

// Middleware to extract user from token for interview routes
router.use((req, res, next) => {
    const token = extractBearer(req.headers.authorization as string || '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = verifyToken(token);
        (req as any).user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

const DSA_QUESTIONS = [
    "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "Reverse a singly linked list.",
    "Find the maximum depth of a binary tree.",
    "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid."
];

const OS_QUESTIONS = [
    "Explain the difference between a process and a thread.",
    "What is a deadlock and what are the 4 Coffman conditions?",
    "Explain virtual memory and page fault."
];

const OOP_QUESTIONS = [
    "What are the four pillars of Object-Oriented Programming? Provide examples.",
    "Explain the difference between an interface and an abstract class.",
    "What is polymorphism? Provide a coding example."
];

const CN_QUESTIONS = [
    "Explain the OSI model layers.",
    "What is the difference between TCP and UDP?",
    "How does DNS work?"
];

// POST /api/interview/start
router.post('/start', (req, res) => {
    const { type } = req.body;
    let questions = DSA_QUESTIONS;
    if (type === 'OS') questions = OS_QUESTIONS;
    if (type === 'OOP') questions = OOP_QUESTIONS;
    if (type === 'CN') questions = CN_QUESTIONS;

    const question = questions[Math.floor(Math.random() * questions.length)];
    res.json({ question, type });
});

// POST /api/interview/followup
router.post('/followup', async (req, res) => {
    try {
        const { question, approach, code } = req.body;
        const systemPrompt = `You are a FAANG technical interviewer.
The candidate was asked: "${question}"
Their approach: "${approach}"
Their code: "${code}"

Respond with EXACTLY ONE short follow-up question (e.g., about time complexity, an edge case, or a potential optimization). 
Speak directly to the candidate as the interviewer. Keep it under 2 sentences. Do NOT evaluate them yet, just ask the question.`;
        
        const apiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.7,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ followup: apiRes.data.choices[0].message.content });
    } catch (err: any) {
        console.error('Followup error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to generate follow-up' });
    }
});

// POST /api/interview/submit
router.post('/submit', async (req, res) => {
    try {
        const { question, approach, code, followUpQuestion, followUpAnswer, type } = req.body;
        const userId = (req as any).user.id;
        
        const userAnswer = `[Approach]: ${approach}\n\n[Code]: ${code}\n\n[Follow-Up Asked]: ${followUpQuestion}\n[Follow-Up Answer]: ${followUpAnswer}`;

        const systemPrompt = `You are a strict technical interviewer. You evaluate the user's complete interview performance on this ${type} question: 
Question: "${question}"

User Output:
"${userAnswer}"

Analyze the answer and return ONLY valid JSON matching this schema:
{
  "correctness": <number 0-100>,
  "optimization": <number 0-100>,
  "clarity": <number 0-100>,
  "overallScore": <number 0-100>,
  "strengths": [<string array>],
  "weaknesses": [<string array>],
  "improvements": [<string array>],
  "idealAnswer": "<string explaining the best possible answer>"
}`;

        const apiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.3,
            max_tokens: 1000
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        let feedback;
        try {
            const rawContent = apiRes.data.choices[0].message.content;
            feedback = JSON.parse(rawContent);
        } catch {
            return res.status(500).json({ error: 'AI returned invalid structured format.' });
        }

        const sessionData = {
            userId,
            type,
            question,
            userAnswer,
            score: {
                correctness: feedback.correctness,
                optimization: feedback.optimization,
                clarity: feedback.clarity,
                overallScore: feedback.overallScore
            },
            feedback: {
                strengths: feedback.strengths,
                weaknesses: feedback.weaknesses,
                improvements: feedback.improvements,
                idealAnswer: feedback.idealAnswer
            },
            createdAt: new Date()
        };

        if (mongoose.connection.readyState === 1) {
            const session = new InterviewSessionModel(sessionData);
            await session.save();
            return res.json(session);
        } else {
            // DB not connected, just return the evaluation payload without crashing
            return res.json({ id: 'local-session', ...sessionData });
        }
    } catch (err: any) {
        console.error('Interview evaluation error:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to evaluate interview' });
    }
});

// GET /api/interview/history
router.get('/history', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
             return res.json([]);
        }
        const userId = (req as any).user.id;
        const history = await InterviewSessionModel.find({ userId }).sort({ createdAt: -1 });
        res.json(history);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
