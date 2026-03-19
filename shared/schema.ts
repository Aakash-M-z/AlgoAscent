export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  plan: 'free' | 'premium';
  aiUsageCount: number;       // resets daily
  aiUsageResetAt: string;     // ISO date string of last reset
  createdAt: Date;
}

export type InsertUser = Omit<User, 'id' | 'createdAt'>;

export interface Activity {
  id: string;
  userId: string;
  date: string;
  category: string;
  topic: string;
  difficulty: string;
  platform: string;
  timeSpent: number;
  problemDescription: string | null;
  notes: string | null;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  solved: boolean;
  createdAt: Date;
}

export type InsertActivity = Omit<Activity, 'id' | 'createdAt'>;

export interface Task {
  id: string;
  userId: string;
  title: string;
  category: 'Work' | 'Study' | 'Fitness' | 'Personal' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  deadline: string;
  completed: boolean;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

export type InsertTask = Omit<Task, 'id' | 'createdAt'>;

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;       // e.g. 'DELETE_USER', 'CHANGE_ROLE', 'LOGIN'
  targetId?: string;    // user/activity id affected
  targetEmail?: string;
  detail: string;       // human-readable description
  createdAt: Date;
}

export type InsertAdminLog = Omit<AdminLog, 'id' | 'createdAt'>;
