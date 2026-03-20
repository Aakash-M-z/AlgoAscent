import mongoose, { Schema, Document } from 'mongoose';

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user', required: true },
    plan: { type: String, default: 'free', required: true },
    aiUsageCount: { type: Number, default: 0 },
    aiUsageResetAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    createdAt: { type: Date, default: Date.now }
});

const activitySchema = new Schema({
    userId: { type: String, required: true },
    date: { type: String, required: true },
    category: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, required: true },
    platform: { type: String, required: true },
    timeSpent: { type: Number, required: true },
    problemDescription: { type: String },
    notes: { type: String },
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
    solved: { type: Boolean, default: false, required: true },
    createdAt: { type: Date, default: Date.now }
});

const adminLogSchema = new Schema({
    adminId: { type: String, required: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true },
    targetId: { type: String },
    targetEmail: { type: String },
    detail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const taskSchema = new Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, required: true },
    deadline: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    completedAt: { type: String },
    notes: { type: String },
    createdAt: { type: String, default: () => new Date().toISOString() },
});

export const UserModel = mongoose.model('User', userSchema);
export const ActivityModel = mongoose.model('Activity', activitySchema);
export const AdminLogModel = mongoose.model('AdminLog', adminLogSchema);
export const TaskModel = mongoose.model('Task', taskSchema);

const featureFlagSchema = new Schema({
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    description: { type: String },
    updatedAt: { type: Date, default: Date.now }
});

const notificationSchema = new Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetAudience: { type: String, enum: ['all', 'premium', 'free'], default: 'all' },
    senderEmail: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const FeatureFlagModel = mongoose.model('FeatureFlag', featureFlagSchema);
export const NotificationModel = mongoose.model('Notification', notificationSchema);

const interviewSessionSchema = new Schema({
    userId: { type: String, required: true },
    type: { type: String, required: true },
    question: { type: String, required: true },
    userAnswer: { type: String, required: true },
    score: {
        correctness: { type: Number, required: true },
        optimization: { type: Number, required: true },
        clarity: { type: Number, required: true },
        overallScore: { type: Number, required: true }
    },
    feedback: {
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        improvements: [{ type: String }],
        idealAnswer: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});

export const InterviewSessionModel = mongoose.model('InterviewSession', interviewSessionSchema);
