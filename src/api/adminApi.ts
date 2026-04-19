import axios from 'axios';
import { API_BASE } from './config';
import { SessionManager } from '../utils/sessionManager';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    // interceptors handle auth automatically like in database.ts
});

api.interceptors.request.use(config => {
    const token = SessionManager.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const adminApi = {
    // 1. User Management
    getUsers: async () => {
        const res = await api.get('/admin/users', {
            headers: { 'Cache-Control': 'no-store' },
        });
        return res.data;
    },
    createUser: async (data: {
        username: string;
        email: string;
        password?: string;
        role: 'admin' | 'user';
        plan: 'free' | 'premium';
        sendWelcome: boolean;
    }) => {
        const res = await api.post('/admin/users', data);
        return res.data;
    },
    updateUser: async (id: string, data: { role?: 'admin' | 'user'; plan?: 'free' | 'premium' }) => {
        const res = await api.patch(`/admin/users/${id}`, data);
        return res.data;
    },
    deleteUser: async (id: string) => {
        await api.delete(`/admin/users/${id}`);
    },
    deleteUsersBulk: async (userIds: string[]) => {
        for (const id of userIds) {
            await api.delete(`/admin/users/${id}`);
        }
    },

    // 2. Advanced Analytics
    getAnalytics: async () => {
        const res = await api.get('/admin/analytics');
        return res.data;
    },
    getInterviewAnalytics: async () => {
        const res = await api.get('/admin/interview-analytics');
        return res.data;
    },

    // 3. AI Monitoring
    getAiMonitoring: async () => {
        const res = await api.get('/admin/ai-monitoring');
        return res.data;
    },

    // 4. Feature Flags
    getFeatures: async () => {
        const res = await api.get('/admin/features');
        return res.data;
    },
    updateFeature: async (key: string, enabled: boolean) => {
        const res = await api.patch(`/admin/features/${key}`, { enabled });
        return res.data;
    },

    // 5. System Health
    getHealthDetails: async () => {
        const res = await api.get('/admin/health-details');
        return res.data;
    },

    // 6. Notifications
    createNotification: async (data: { title: string; message: string; targetAudience: string }) => {
        const res = await api.post('/admin/notifications', data);
        return res.data;
    },
    getNotifications: async () => {
        const res = await api.get('/admin/notifications');
        return res.data;
    },

    // 7. Audit Logs filtered
    getLogsFiltered: async (action?: string) => {
        const params = action ? { action } : {};
        const res = await api.get('/admin/logs', { params });
        return res.data;
    }
};
