import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { storage } from './storage.js';
import { InsertUser, InsertActivity } from '../shared/schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const api = express.Router();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());

// Health check
api.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Login
api.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password are required' });

        const user = await storage.getUserByEmail(email.trim().toLowerCase());
        if (!user || user.password !== password)
            return res.status(401).json({ error: 'Invalid email or password' });

        res.json(user);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Register
api.post('/register', async (req, res) => {
    try {
        const userData: InsertUser = req.body;
        if (!userData.email || !userData.password || !userData.username)
            return res.status(400).json({ error: 'Email, password and username are required' });

        userData.email = userData.email.trim().toLowerCase();

        if (await storage.getUserByEmail(userData.email))
            return res.status(409).json({ error: 'An account with this email already exists' });

        if (await storage.getUserByUsername(userData.username))
            return res.status(409).json({ error: 'This username is already taken' });

        const user = await storage.createUser(userData);
        res.status(201).json(user);
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Google Auth
api.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const googleUserRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!googleUserRes.ok)
            return res.status(401).json({ error: 'Failed to authenticate with Google' });

        const { email } = await googleUserRes.json();
        if (!email) return res.status(400).json({ error: 'Google account has no email' });

        let user = await storage.getUserByEmail(email);
        if (user) {
            if (email === 'aakashleo420@gmail.com' && user.role !== 'admin')
                user = await storage.updateUser(user.id, { role: 'admin' });
        } else {
            const baseUsername = email.split('@')[0];
            let username = baseUsername;
            let counter = 1;
            while (await storage.getUserByUsername(username))
                username = `${baseUsername}${counter++}`;

            user = await storage.createUser({
                username,
                email,
                password: Math.random().toString(36).slice(-10),
                role: email === 'aakashleo420@gmail.com' ? 'admin' : 'user'
            });
        }
        res.json(user);
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Get user by ID
api.get('/users/:id', async (req, res) => {
    try {
        const user = await storage.getUser(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Get user by username
api.get('/users/by-username/:username', async (req, res) => {
    try {
        const user = await storage.getUserByUsername(req.params.username);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Create user (internal)
api.post('/users', async (req, res) => {
    try {
        const user = await storage.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Get activities
api.get('/users/:userId/activities', async (req, res) => {
    try {
        const activities = await storage.getUserActivities(req.params.userId);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Create activity
api.post('/activities', async (req, res) => {
    try {
        const activity = await storage.createActivity(req.body as InsertActivity);
        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Update activity
api.put('/activities/:id', async (req, res) => {
    try {
        const activity = await storage.updateActivity(req.params.id, req.body);
        if (!activity) return res.status(404).json({ error: 'Activity not found' });
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Delete activity
api.delete('/activities/:id', async (req, res) => {
    try {
        const deleted = await storage.deleteActivity(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Activity not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

app.use('/api', api);
app.use('/', api);

if (process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1') {
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api'))
            res.sendFile(path.resolve(distPath, 'index.html'));
    });
}

export default app;
