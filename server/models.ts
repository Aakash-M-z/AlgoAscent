import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String },
    learningGoal: { type: String },
    role: { type: String, default: 'user', required: true },
    plan: { type: String, default: 'free', required: true },
    isActive: { type: Boolean, default: true, index: true },  // false = deactivated
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

// ── Password Reset Token ──────────────────────────────────────────────────────
const passwordResetTokenSchema = new Schema({
    email: { type: String, required: true, index: true },
    token: { type: String, required: true },          // SHA-256 hash of raw token
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // MongoDB TTL auto-deletes
});
export const PasswordResetTokenModel = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

const interviewSessionSchema = new Schema({
    userId: { type: String, required: true },
    type: { type: String, required: true },
    question: { type: String, required: true },
    userAnswer: { type: String, required: true },
    score: {
        correctness: { type: Number, required: true },
        optimization: { type: Number, required: true },
        clarity: { type: Number, required: true },
        overallScore: { type: Number, required: true },
        testCasesPassed: { type: String }
    },
    feedback: {
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        improvements: [{ type: String }],
        complexityAnalysis: {
            time: { type: String },
            space: { type: String }
        },
        idealAnswer: { type: String, required: true }
    },
    createdAt: { type: Date, default: Date.now }
});

export const InterviewSessionModel = mongoose.model('InterviewSession', interviewSessionSchema);

// ── Problem (LeetCode dataset) ────────────────────────────────────────────────
const problemSchema = new Schema({
    leetcodeId: { type: Number, required: true, unique: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    topic: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    examples: [{ type: String }],
    constraints: { type: String, default: '' },
    testCases: [{ input: String, output: String }],
    tags: [{ type: String, index: true }],
    acceptanceRate: { type: Number },
    isPremium: { type: Boolean, default: false },
    url: { type: String },
    createdAt: { type: Date, default: Date.now },
});
export const ProblemModel = mongoose.model('Problem', problemSchema);
