import { Activity, InsertActivity, User, InsertUser, AdminLog, Task, InsertTask } from '../../shared/schema';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Attach admin id to every admin request
const adminHeaders = (adminId: string) => ({
  'Content-Type': 'application/json',
  'x-admin-id': adminId,
});

export class DatabaseAPI {
  // User operations
  async getUser(id: string | number): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE}/users/${id}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE}/users/by-username/${username}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return null;
    }
  }

  async createUser(userData: InsertUser): Promise<User | null> {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  // Activity operations
  async getUserActivities(userId: string | number): Promise<Activity[]> {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/activities`);
      if (!response.ok) {
        console.error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async createActivity(activityData: InsertActivity): Promise<Activity | null> {
    try {
      const response = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  async updateActivity(id: string | number, activityData: Partial<Activity>): Promise<Activity | null> {
    try {
      const response = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Error updating activity:', error);
      return null;
    }
  }

  async deleteActivity(id: string | number): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting activity:', error);
      return false;
    }
  }

  // ── Admin API ──────────────────────────────────────────────────

  async adminGetUsers(adminId: string): Promise<Omit<User, 'password'>[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, { headers: adminHeaders(adminId) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) {
      console.error('adminGetUsers:', e);
      return [];
    }
  }

  async adminDeleteUser(adminId: string, userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: adminHeaders(adminId),
      });
      return res.ok;
    } catch (e) {
      console.error('adminDeleteUser:', e);
      return false;
    }
  }

  async adminChangeRole(adminId: string, userId: string, role: 'admin' | 'user'): Promise<Omit<User, 'password'> | null> {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: adminHeaders(adminId),
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) {
      console.error('adminChangeRole:', e);
      return null;
    }
  }

  async adminGetActivities(adminId: string, filters?: { userId?: string; date?: string }): Promise<Activity[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.userId) params.set('userId', filters.userId);
      if (filters?.date) params.set('date', filters.date);
      const res = await fetch(`${API_BASE}/admin/activities?${params}`, { headers: adminHeaders(adminId) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) {
      console.error('adminGetActivities:', e);
      return [];
    }
  }

  async adminGetLogs(adminId: string): Promise<AdminLog[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/logs`, { headers: adminHeaders(adminId) });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    } catch (e) {
      console.error('adminGetLogs:', e);
      return [];
    }
  }

  // ── Task API ───────────────────────────────────────────────────

  async getUserTasks(userId: string): Promise<Task[]> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/tasks`);
      if (!res.ok) return [];
      return res.json();
    } catch { return []; }
  }

  async createTask(task: InsertTask): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task | null> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch { return false; }
  }

  async getRecommendations(activities: import('../../shared/schema').Activity[]): Promise<{
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
      const payload = activities.map(a => ({
        topic: a.topic || a.category,
        difficulty: a.difficulty || 'Medium',
        solved: a.solved,
        date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString(),
      }));
      const res = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: payload }),
      });
      if (!res.ok) return null;
      return res.json();
    } catch (error) {
      console.error('getRecommendations:', error);
      return null;
    }
  }

  async analyzeProgress(activities: import('../../shared/schema').Activity[], username?: string): Promise<{
    strengths: string[];
    weaknesses: string[];
    suggestions: { topic: string; reason: string; priority: 'High' | 'Medium' | 'Low' }[];
    nextProblems: { name: string; difficulty: 'Easy' | 'Medium' | 'Hard'; topic: string; reason: string }[];
    overallAssessment: string;
    nextMilestone: string;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities, username }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return res.json();
    } catch (error) {
      console.error('analyzeProgress:', error);
      return null;
    }
  }
}

export const databaseAPI = new DatabaseAPI();