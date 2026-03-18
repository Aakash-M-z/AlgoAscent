import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { storage } from './storage.js';
import { InsertUser, InsertActivity, InsertTask } from '../shared/schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const api = express.Router();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'x-admin-id'] }));
app.use(express.json());

// Health check
api.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
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
        res.json(safeUser);
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
        const user = await storage.createUser(userData);
        const { password: _, ...safeUser } = user;
        res.status(201).json(safeUser);
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Google Auth
api.post('/auth/google', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) { res.status(400).json({ error: 'Token is required' }); return; }
        const googleUserRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
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
                role: email === 'aakashleo420@gmail.com' ? 'admin' : 'user'
            });
        }
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
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

// ── Admin middleware ─────────────────────────────────────────────
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const adminId = req.headers['x-admin-id'] as string;
    if (!adminId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const user = await storage.getUser(adminId);
    if (!user || user.role !== 'admin') { res.status(403).json({ error: 'Forbidden: admin only' }); return; }
    (req as any).adminUser = user;
    next();
};

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
        const admin = (req as any).adminUser;
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
        const admin = (req as any).adminUser;
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
