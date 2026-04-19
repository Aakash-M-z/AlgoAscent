import mongoose from 'mongoose';
import { UserModel, ActivityModel, AdminLogModel, TaskModel } from './models.js';
import { IStorage } from './storage.js';
import { User, InsertUser, Activity, InsertActivity, AdminLog, InsertAdminLog, Task, InsertTask } from '../shared/schema.js';

export let mongoConnected = false;

/**
 * Connects to MongoDB with enhanced logging and error handling.
 * Does NOT fallback silenty if connection fails.
 */
export async function connectMongo(): Promise<boolean> {
    const uri = process.env.MONGODB_URI || '';

    if (!uri) {
        console.error('❌ MONGODB_URI is not defined in .env file');
        return false;
    }

    // Mask URI for safe logging
    const maskedUri = uri.replace(/\/\/.*:.*@/, '//****:****@');
    console.log(`📡 Connecting to MongoDB: ${maskedUri}`);

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });

        mongoConnected = true;
        console.log('✅ MongoDB Connected Successfully');
        return true;
    } catch (err: any) {
        mongoConnected = false;

        let errorHint = '';
        if (err.message.includes('authentication failed')) {
            errorHint = 'Check your MongoDB Atlas username and password (ensure special chars are URL encoded).';
        } else if (err.message.includes('IP address') || err.message.includes('reachable')) {
            errorHint = 'Check your MongoDB Atlas IP Whitelist / Network Access.';
        }

        console.error(`❌ MongoDB Connection Failed: ${err.message}`);
        if (errorHint) console.error(`💡 Hint: ${errorHint}`);

        return false;
    }
}

export class MongoStorage implements IStorage {
    // ... rest of the file remains same
    async getUser(id: string | number): Promise<User | undefined> {
        try {
            const user = await UserModel.findById(id.toString());
            return user ? this.mapUser(user) : undefined;
        } catch { return undefined; }
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const user = await UserModel.findOne({ username });
        return user ? this.mapUser(user) : undefined;
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        const user = await UserModel.findOne({ email });
        return user ? this.mapUser(user) : undefined;
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const user = new UserModel(insertUser);
        await user.save();
        return this.mapUser(user);
    }

    async updateUser(id: string | number, data: Partial<User>): Promise<User | undefined> {
        const updated = await UserModel.findByIdAndUpdate(id.toString(), data, { new: true });
        return updated ? this.mapUser(updated) : undefined;
    }

    async getAllUsers(): Promise<User[]> {
        const users = await UserModel.find().sort({ createdAt: -1 });
        return users.map(u => this.mapUser(u));
    }

    async deleteUser(id: string | number): Promise<boolean> {
        const result = await UserModel.findByIdAndDelete(id.toString());
        return !!result;
    }

    async getUserActivities(userId: string | number): Promise<Activity[]> {
        const activities = await ActivityModel.find({ userId: userId.toString() }).sort({ createdAt: -1 });
        return activities.map(a => this.mapActivity(a));
    }

    async getAllActivities(): Promise<Activity[]> {
        const activities = await ActivityModel.find().sort({ createdAt: -1 });
        return activities.map(a => this.mapActivity(a));
    }

    async createActivity(insertActivity: InsertActivity): Promise<Activity> {
        const activity = new ActivityModel(insertActivity);
        await activity.save();
        return this.mapActivity(activity);
    }

    async updateActivity(id: string | number, data: Partial<Activity>): Promise<Activity | undefined> {
        const updated = await ActivityModel.findByIdAndUpdate(id.toString(), data, { new: true });
        return updated ? this.mapActivity(updated) : undefined;
    }

    async deleteActivity(id: string | number): Promise<boolean> {
        const result = await ActivityModel.findByIdAndDelete(id.toString());
        return !!result;
    }

    async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
        const entry = new AdminLogModel(log);
        await entry.save();
        return this.mapLog(entry);
    }

    async getAdminLogs(): Promise<AdminLog[]> {
        const logs = await AdminLogModel.find().sort({ createdAt: -1 }).limit(200);
        return logs.map(l => this.mapLog(l));
    }

    async getUserTasks(userId: string): Promise<Task[]> {
        const tasks = await TaskModel.find({ userId }).sort({ createdAt: -1 });
        return tasks.map(t => this.mapTask(t));
    }

    async createTask(insertTask: InsertTask): Promise<Task> {
        const task = new TaskModel(insertTask);
        await task.save();
        return this.mapTask(task);
    }

    async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
        const updated = await TaskModel.findByIdAndUpdate(id, data, { new: true });
        return updated ? this.mapTask(updated) : undefined;
    }

    async deleteTask(id: string): Promise<boolean> {
        const result = await TaskModel.findByIdAndDelete(id);
        return !!result;
    }

    async incrementAiUsage(userId: string | number): Promise<User | undefined> {
        const today = new Date().toISOString().slice(0, 10);
        const user = await UserModel.findById(userId.toString());
        if (!user) return undefined;
        const resetAt = (user as any).aiUsageResetAt ?? today;
        const newCount = resetAt === today ? ((user as any).aiUsageCount ?? 0) + 1 : 1;
        const updated = await UserModel.findByIdAndUpdate(
            userId.toString(),
            { aiUsageCount: newCount, aiUsageResetAt: today },
            { new: true }
        );
        return updated ? this.mapUser(updated) : undefined;
    }

    private mapUser(doc: any): User {
        return {
            id: doc._id.toString(),
            username: doc.username,
            name: doc.name,
            email: doc.email,
            password: doc.password,
            profileImage: doc.profileImage,
            learningGoal: doc.learningGoal,
            role: doc.role ?? 'user',
            plan: doc.plan ?? 'free',
            isActive: doc.isActive !== false, // default true for existing docs without field
            aiUsageCount: doc.aiUsageCount ?? 0,
            aiUsageResetAt: doc.aiUsageResetAt ?? new Date().toISOString().slice(0, 10),
            createdAt: doc.createdAt,
        };
    }

    private mapActivity(doc: any): Activity {
        return {
            id: doc._id.toString(),
            userId: doc.userId.toString(),
            date: doc.date,
            category: doc.category,
            topic: doc.topic,
            difficulty: doc.difficulty,
            platform: doc.platform,
            timeSpent: doc.timeSpent,
            problemDescription: doc.problemDescription ?? null,
            notes: doc.notes ?? null,
            timeComplexity: doc.timeComplexity ?? null,
            spaceComplexity: doc.spaceComplexity ?? null,
            solved: doc.solved,
            createdAt: doc.createdAt,
        };
    }

    private mapLog(doc: any): AdminLog {
        return {
            id: doc._id.toString(),
            adminId: doc.adminId,
            adminEmail: doc.adminEmail,
            action: doc.action,
            targetId: doc.targetId,
            targetEmail: doc.targetEmail,
            detail: doc.detail,
            createdAt: doc.createdAt,
        };
    }

    private mapTask(doc: any): Task {
        return {
            id: doc._id.toString(),
            userId: doc.userId,
            title: doc.title,
            category: doc.category,
            priority: doc.priority,
            deadline: doc.deadline ?? '',
            completed: doc.completed,
            completedAt: doc.completedAt,
            notes: doc.notes,
            createdAt: doc.createdAt,
        };
    }
}
