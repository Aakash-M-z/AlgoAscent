import axios from 'axios';
import { SessionManager } from '../utils/sessionManager';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use(config => {
    const token = SessionManager.getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export const mockInterviewApi = {
    start: async (type: string) => {
        const res = await api.post('/interview/start', { type });
        return res.data;
    },
    submit: async (payload: { question: string, approach: string, code: string, followUpQuestion: string, followUpAnswer: string, type: string }) => {
        const res = await api.post('/interview/submit', payload);
        return res.data;
    },
    getFollowup: async (payload: { question: string, approach: string, code: string }) => {
        const res = await api.post('/interview/followup', payload);
        return res.data;
    },
    getHistory: async () => {
        const res = await api.get('/interview/history');
        return res.data;
    },
    getCodeFeedback: async (payload: { question: string, code: string, language: string }) => {
        const res = await api.post('/interview/feedback', payload);
        return res.data;
    },
    evaluateApproach: async (payload: { question: string, approach: string }) => {
        const res = await api.post('/interview/evaluate-approach', payload);
        return res.data;
    },
    runCode: async (payload: { code: string, language: string, questionText: string, functionName: string }) => {
        const res = await api.post('/interview/run', payload);
        return res.data;
    }
};
