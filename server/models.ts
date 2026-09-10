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
    subscriptionPlan: { type: String, enum: ['free', 'monthly', 'annual', 'lifetime'], default: 'free' },
    subscriptionExpiresAt: { type: Date },
    paymentHistory: { type: Array, default: [] },
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

const problemReviewSchema = new Schema({
    userId: { type: String, required: true, index: true },
    problemTitle: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true },
    platform: { type: String, required: true },
    rating: { type: Number, required: true },
    nextReviewDate: { type: Date, required: true, index: true },
    interval: { type: Number, required: true },
    easeFactor: { type: Number, required: true },
    lastReviewed: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
});
export const ProblemReviewModel = mongoose.model('ProblemReview', problemReviewSchema);

const jobResultSchema = new Schema({
    jobId: { type: String, required: true, unique: true, index: true },
    result: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 86400 } }, // 24-hour TTL
});
export const JobResultModel = mongoose.model('JobResult', jobResultSchema);

// ── Connected Platform Accounts ─────────────────────────────────────────────
const connectedAccountSchema = new Schema({
    userId: { type: String, required: true, index: true },
    platform: { type: String, required: true, index: true },
    username: { type: String, required: true },
    profileUrl: { type: String, default: '' },
    rating: { type: Number, default: null },
    rank: { type: Schema.Types.Mixed, default: null },
    solvedCount: { type: Number, default: 0 },
    contestCount: { type: Number, default: null },
    lastSyncedAt: { type: Date, default: Date.now },
    syncStatus: { type: String, default: 'success' },
    metadata: { type: Schema.Types.Mixed, default: {} }
});
connectedAccountSchema.index({ userId: 1, platform: 1 }, { unique: true });
export const ConnectedAccountModel = mongoose.model('ConnectedAccount', connectedAccountSchema);

// ── Contests Cache ──────────────────────────────────────────────────────────
const contestSchema = new Schema({
    platform: { type: String, required: true, index: true },
    contestId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    url: { type: String, default: '' },
    status: { type: String, default: 'upcoming' }
});
export const ContestModel = mongoose.model('Contest', contestSchema);

// ── Contest Reminders ───────────────────────────────────────────────────────
const contestReminderSchema = new Schema({
    userId: { type: String, required: true, index: true },
    contestId: { type: String, required: true, index: true },
    reminderTime: { type: Date, required: true },
    reminderType: { type: String, required: true },
    sent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});
contestReminderSchema.index({ userId: 1, contestId: 1, reminderType: 1 }, { unique: true });
export const ContestReminderModel = mongoose.model('ContestReminder', contestReminderSchema);

// ── Assessment Management System Models ───────────────────────────────────────

const assessmentQuestionEmbeddedSchema = new Schema({
    id: { type: String, required: true },
    questionId: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['Coding', 'DSA', 'Aptitude', 'Logical Reasoning', 'Quantitative Ability', 'OOP', 'DBMS', 'SQL', 'OS', 'CN', 'Git', 'Technical'],
        required: true,
        default: 'Technical'
    },
    questionType: {
        type: String,
        enum: ['coding', 'mcq', 'multi_select', 'subjective'],
        required: true,
        default: 'mcq'
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium'
    },
    points: { type: Number, default: 10 },
    order: { type: Number, default: 0 },
    options: [{ id: String, text: String }],
    correctAnswer: { type: Schema.Types.Mixed }, // String or Array or Text - Hidden from candidate until evaluation
    explanation: { type: String, default: '' },
    functionName: { type: String, default: 'solution' },
    params: [{ type: String }],
    starterCode: { type: Map, of: String, default: {} },
    testCases: [{
        input: { type: Schema.Types.Mixed },
        expectedOutput: { type: Schema.Types.Mixed },
        description: { type: String }
    }],
    hiddenTestCases: [{
        input: { type: Schema.Types.Mixed },
        expectedOutput: { type: Schema.Types.Mixed },
        description: { type: String }
    }],
    timeLimit: { type: Number, default: 2 }, // seconds
    memoryLimit: { type: Number, default: 256 }, // MB
    tags: [{ type: String }]
}, { _id: false });

const assessmentSchema = new Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    instructions: { type: String, default: '' },
    createdBy: { type: String, required: true, index: true },
    creatorName: { type: String, default: 'Admin' },
    duration: { type: Number, required: true, default: 60 }, // minutes
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    passingScore: { type: Number, default: 60 }, // percentage
    maxAttempts: { type: Number, default: 1 },
    accessMode: {
        type: String,
        enum: ['public', 'authenticated', 'private'],
        default: 'authenticated'
    },
    shareToken: { type: String, required: true, unique: true, index: true },
    assignedUserIds: [{ type: String, index: true }],
    assignedEmails: [{ type: String, index: true }],
    settings: {
        requireFullscreen: { type: Boolean, default: true },
        trackTabSwitches: { type: Boolean, default: true },
        randomizeQuestions: { type: Boolean, default: false },
        randomizeOptions: { type: Boolean, default: false },
        showResultsImmediately: { type: Boolean, default: true },
        negativeMarking: { type: Boolean, default: false },
        negativeMarkingFactor: { type: Number, default: 0.25 }
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'closed', 'archived'],
        default: 'published',
        index: true
    },
    questions: [assessmentQuestionEmbeddedSchema],
    totalPoints: { type: Number, default: 0 },
    questionCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
assessmentSchema.index({ createdAt: -1 });
export const AssessmentModel = mongoose.model('Assessment', assessmentSchema);

const assessmentAttemptSchema = new Schema({
    assessmentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, default: '' },
    userName: { type: String, default: 'Candidate' },
    status: {
        type: String,
        enum: ['in_progress', 'completed', 'expired', 'locked'],
        default: 'in_progress',
        index: true
    },
    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    submittedAt: { type: Date, default: null },
    questionOrder: [{ type: String }],
    answers: { type: Map, of: Schema.Types.Mixed, default: {} }, // questionId -> { value, answeredAt, timeSpent }
    codingSubmissions: { type: Map, of: Schema.Types.Mixed, default: {} }, // questionId -> { code, language, testResults, passedCount, runtimeMs, pointsEarned }
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    accuracy: { type: Number, default: 0 },
    attemptedCount: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    categoryScores: { type: Map, of: Schema.Types.Mixed, default: {} }, // category -> { earned, max, percentage }
    timeTakenSeconds: { type: Number, default: 0 },
    integrityEvents: [{
        type: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' }
    }],
    integrityScore: { type: Number, default: 100 },
    tabSwitchCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    aiEvaluation: {
        summary: { type: String, default: '' },
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        recommendations: [{ type: String }]
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
assessmentAttemptSchema.index({ assessmentId: 1, userId: 1 });
assessmentAttemptSchema.index({ submittedAt: -1 });
export const AssessmentAttemptModel = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

const assessmentQuestionBankSchema = new Schema({
    title: { type: String, required: true, index: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['Coding', 'DSA', 'Aptitude', 'Logical Reasoning', 'Quantitative Ability', 'OOP', 'DBMS', 'SQL', 'OS', 'CN', 'Git', 'Technical', 'Frontend', 'Backend', 'Full Stack'],
        required: true,
        index: true
    },
    questionType: {
        type: String,
        enum: ['coding', 'mcq', 'multi_select', 'subjective'],
        required: true,
        index: true
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true,
        index: true
    },
    points: { type: Number, default: 10 },
    options: [{ id: String, text: String }],
    correctAnswer: { type: Schema.Types.Mixed },
    explanation: { type: String, default: '' },
    functionName: { type: String, default: 'solution' },
    params: [{ type: String }],
    starterCode: { type: Map, of: String, default: {} },
    testCases: [{
        input: { type: Schema.Types.Mixed },
        expectedOutput: { type: Schema.Types.Mixed },
        description: { type: String }
    }],
    hiddenTestCases: [{
        input: { type: Schema.Types.Mixed },
        expectedOutput: { type: Schema.Types.Mixed },
        description: { type: String }
    }],
    expectedComplexity: {
        time: { type: String, default: '' },
        space: { type: String, default: '' }
    },
    timeLimit: { type: Number, default: 2 },
    memoryLimit: { type: Number, default: 256 },
    tags: [{ type: String, index: true }],
    createdAt: { type: Date, default: Date.now }
});
export const AssessmentQuestionBankModel = mongoose.model('AssessmentQuestionBank', assessmentQuestionBankSchema);

// ── Payment / Subscription Model ──────────────────────────────────────────
const paymentSchema = new Schema({
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    providerOrderId: { type: String, index: true },
    providerPaymentId: { type: String, index: true },
    paymentId: { type: String, index: true },
    signature: { type: String },
    amount: { type: Number, required: true },
    amountInPaise: { type: Number },
    currency: { type: String, default: 'INR' },
    plan: { type: String, enum: ['monthly', 'annual', 'lifetime'], required: true },
    billingCycle: { type: String, enum: ['monthly', 'annual', 'one-time'], required: true },
    status: {
        type: String,
        enum: ['PENDING', 'UNDER_REVIEW', 'PAID', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REFUNDED', 'CREATED'],
        default: 'PENDING',
        index: true
    },
    paymentMethod: { type: String, default: 'MANUAL_UPI' },
    qrImageUrl: { type: String },
    qrPayload: { type: String },
    receipt: { type: String },
    utrNumber: { type: String, index: true },
    upiId: { type: String },
    userSubmittedAt: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    adminNote: { type: String },
    rejectionReason: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    paidAt: { type: Date },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function () {
    this.updatedAt = new Date();
});

export const PaymentModel = mongoose.model('Payment', paymentSchema);

// ── Payment Audit Trail Model ─────────────────────────────────────────────
const paymentAuditSchema = new Schema({
    paymentId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    action: {
        type: String,
        enum: ['PAYMENT_CREATED', 'UTR_SUBMITTED', 'PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'SUBSCRIPTION_ACTIVATED'],
        required: true,
        index: true
    },
    actor: { type: String, required: true },
    actorRole: { type: String, default: 'user' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true }
});

export const PaymentAuditModel = mongoose.model('PaymentAudit', paymentAuditSchema);


