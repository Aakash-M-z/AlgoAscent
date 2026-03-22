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

// Normalise language strings before sending to backend.
// Backend accepts: javascript | python3 | java | cpp
const LANG_MAP: Record<string, string> = {
    javascript: 'javascript',
    js: 'javascript',
    '63': 'javascript',
    python: 'python3',
    python3: 'python3',
    '71': 'python3',
    java: 'java',
    '62': 'java',
    cpp: 'cpp',
    'c++': 'cpp',
    '54': 'cpp',
};

function normalizeLanguage(lang: string): string {
    return LANG_MAP[lang?.toLowerCase()] ?? lang;
}

export const mockInterviewApi = {
    start: async (type: string) => {
        const res = await api.post('/interview/start', { type });
        return res.data;
    },
    submit: async (payload: {
        question: string;
        approach: string;
        code: string;
        followUpQuestion: string;
        followUpAnswer: string;
        type: string;
    }) => {
        const res = await api.post('/interview/submit', payload);
        return res.data;
    },
    getFollowup: async (payload: { question: string; approach: string; code: string }) => {
        const res = await api.post('/interview/followup', payload);
        return res.data;
    },
    getHistory: async () => {
        const res = await api.get('/interview/history');
        return res.data;
    },
    getCodeFeedback: async (payload: { question: string; code: string; language: string }) => {
        const res = await api.post('/interview/feedback', payload);
        return res.data;
    },
    evaluateApproach: async (payload: { question: string; approach: string }) => {
        const res = await api.post('/interview/evaluate-approach', payload);
        return res.data;
    },
    runCode: async (payload: {
        code: string;
        language: string;
        questionText?: string;
        functionName: string;
        testCases?: any[];
    }) => {
        const normalized = normalizeLanguage(payload.language);
        const body = {
            code: payload.code,
            language: normalized,
            functionName: payload.functionName,
            testCases: payload.testCases ?? [],
        };
        console.log('[mockInterviewApi.runCode] payload:', JSON.stringify(body, null, 2));
        const res = await api.post('/interview/run', body, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res.data;
    },
};
