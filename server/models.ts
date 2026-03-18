import mongoose, { Schema, Document } from 'mongoose';

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user', required: true },
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
