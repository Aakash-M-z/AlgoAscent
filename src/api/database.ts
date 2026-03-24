import { Activity, InsertActivity, User, InsertUser, AdminLog, Task, InsertTask } from '../../shared/schema';
import { SessionManager } from '../utils/sessionManager';

import { API_BASE } from './config';

// ── Header helpers ────────────────────────────────────────────────

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = SessionManager.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── API response types ────────────────────────────────────────────

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
}

// ── DatabaseAPI ───────────────────────────────────────────────────

export class DatabaseAPI {

  // ── Auth ────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<AuthResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
      return res.json();
    } catch (e) { console.error('login:', e); return null; }
  }

  async register(email: string, password: string, username: string): Promise<AuthResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
      return res.json();
    } catch (e) { console.error('register:', e); return null; }
  }

  async googleAuth(accessToken: string): Promise<AuthResponse | null> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: accessToken }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
      return res.json();
    } catch (e) { console.error('googleAuth:', e); return null; }
  }

  // ── Profile ─────────────────────────────────────────────────────
  
  async getProfile(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async updateProfile(data: Partial<User>): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  // ── Users ───────────────────────────────────────────────────────

  async getUser(id: string | number): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/api/users/by-username/${username}`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async createUser(userData: InsertUser): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!res.ok) return null;
      const data: AuthResponse = await res.json();
      return data.user as User;
    } catch { return null; }
  }

  // ── Activities ──────────────────────────────────────────────────

  async getUserActivities(userId: string | number): Promise<Activity[]> {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/activities`, { headers: authHeaders() });
      if (!res.ok) { console.error(`Failed to fetch activities: ${res.status}`); return []; }
      return res.json();
    } catch (e) { console.error('getUserActivities:', e); return []; }
  }

  async createActivity(activityData: InsertActivity): Promise<Activity | null> {
    try {
      const res = await fetch(`${API_BASE}/api/activities`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(activityData),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async updateActivity(id: string | number, activityData: Partial<Activity>): Promise<Activity | null> {
    try {
      const res = await fetch(`${API_BASE}/api/activities/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(activityData),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async deleteActivity(id: string | number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/activities/${id}`, { method: 'DELETE', headers: authHeaders() });
      return res.ok;
    } catch { return false; }
  }

  // ── Tasks ───────────────────────────────────────────────────────

  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/tasks`, { headers: authHeaders() });
      if (!res.ok) return [];
      return res.json();
    } catch { return []; }
  }

  async createTask(task: InsertTask): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(task),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE', headers: authHeaders() });
      return res.ok;
    } catch { return false; }
  }

  // ── Admin ───────────────────────────────────────────────────────

  async adminGetUsers(): Promise<Omit<User, 'password'>[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) { console.error('adminGetUsers:', e); return []; }
  }

  async adminDeleteUser(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, { method: 'DELETE', headers: authHeaders() });
      return res.ok;
    } catch { return false; }
  }

  async adminChangeRole(userId: string, role: 'admin' | 'user'): Promise<Omit<User, 'password'> | null> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) { console.error('adminChangeRole:', e); return null; }
  }

  async adminChangePlan(userId: string, plan: 'free' | 'premium'): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/plan`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ plan }),
      });
      return res.ok;
    } catch { return false; }
  }

  async adminGetActivities(filters?: { userId?: string; date?: string }): Promise<Activity[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.userId) params.set('userId', filters.userId);
      if (filters?.date) params.set('date', filters.date);
      const res = await fetch(`${API_BASE}/admin/activities?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) { console.error('adminGetActivities:', e); return []; }
  }

  async adminGetLogs(): Promise<AdminLog[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/logs`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) { console.error('adminGetLogs:', e); return []; }
  }

  // ── AI ──────────────────────────────────────────────────────────

  async analyzeProgress(
    activities: Activity[],
    username?: string,
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    suggestions: { topic: string; reason: string; priority: 'High' | 'Medium' | 'Low' }[];
    nextProblems: { name: string; difficulty: 'Easy' | 'Medium' | 'Hard'; topic: string; reason: string }[];
    overallAssessment: string;
    nextMilestone: string;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ activities, username }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`); }
      return res.json();
    } catch (e) { console.error('analyzeProgress:', e); return null; }
  }

  async explainTopic(
    subject: string,
    topic: string,
    subtopics: string[],
    interviewQuestions: string[],
  ): Promise<{ explanation: string | null; fallback?: boolean; errorCode?: string; keyPoints?: string[] }> {
    const res = await fetch(`${API_BASE}/api/ai/explain-topic`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ subject, topic, subtopics, interviewQuestions }),
    });

    // 403 = plan limit reached — throw with special code
    if (res.status === 403) {
      const e = await res.json().catch(() => ({}));
      const err: any = new Error(e.message || 'AI_LIMIT_REACHED');
      err.code = 'AI_LIMIT_REACHED';
      throw err;
    }

    // Other non-ok statuses
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      const err: any = new Error(e.message || e.error || `HTTP ${res.status}`);
      err.code = e.error || 'AI_UNAVAILABLE';
      throw err;
    }

    // 200 — may be a fallback payload (explanation: null, fallback: true)
    return res.json();
  }

  async getAiUsage(userId: string): Promise<{
    plan: string; usageToday: number; limit: number; remaining: number | null;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}/ai-usage`, { headers: authHeaders() });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  // ── Recommendations ─────────────────────────────────────────────

  async getRecommendations(activities: Activity[]): Promise<{
    recommendedDifficulty: 'Easy' | 'Medium' | 'Hard';
    difficultyReason: string;
    topicPriority: { topic: string; reason: string; urgency: 'high' | 'medium' | 'low' }[];
    problems: Array<{
      id: string; number: number; name: string;
      difficulty: 'Easy' | 'Medium' | 'Hard';
      topic: string; platform: string;
      tags: string[]; reason: string; score: number; isNew: boolean;
    }>;
  } | null> {
    try {
      const payload = (activities as any[]).map((a: any) => ({
        topic: a.topic || a.category || 'General',
        difficulty: a.difficulty || 'Medium',
        solved: a.solved ?? a.problemSolved ?? false,
        date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString(),
      }));
      const res = await fetch(`${API_BASE}/api/recommendations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ activities: payload }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch (e) { console.error('getRecommendations:', e); return null; }
  }
}

export const databaseAPI = new DatabaseAPI();
