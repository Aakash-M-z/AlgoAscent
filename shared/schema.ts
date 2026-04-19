export interface User {
  id: string;
  username: string;
  name?: string;
  email: string;
  password: string;
  profileImage?: string;
  learningGoal?: string;
  role: 'admin' | 'user';
  plan: 'free' | 'premium';
  isActive: boolean;          // false = deactivated/deleted, blocks all API access
  aiUsageCount: number;
  aiUsageResetAt: string;
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

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  description: string;
  updatedAt: Date;
}

export type InsertFeatureFlag = Omit<FeatureFlag, 'id' | 'updatedAt'>;

export interface Notification {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'premium' | 'free';
  senderEmail: string;
  createdAt: Date;
}

export type InsertNotification = Omit<Notification, 'id' | 'createdAt'>;

export interface InterviewSession {
  id: string;
  userId: string;
  type: string;
  question: string;
  userAnswer: string;
  score: {
    correctness: number;
    optimization: number;
    clarity: number;
    overallScore: number;
  };
  feedback: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    idealAnswer: string;
  };
  createdAt: Date;
}

export type InsertInterviewSession = Omit<InterviewSession, 'id' | 'createdAt'>;
