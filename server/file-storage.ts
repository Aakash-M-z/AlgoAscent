import { IStorage } from "./storage.js";
import { User, InsertUser, Activity, InsertActivity, AdminLog, InsertAdminLog, Task, InsertTask } from "../shared/schema.js";
import fs from 'fs';
import path from 'path';

export class FileStorage implements IStorage {
    private users: Map<string, User>;
    private activities: Map<string, Activity>;
    private adminLogs: Map<string, AdminLog>;
    private tasks: Map<string, Task>;
    private currentUserId: number;
    private currentActivityId: number;
    private currentLogId: number;
    private currentTaskId: number;
    private filePath: string;

    constructor() {
        this.users = new Map();
        this.activities = new Map();
        this.adminLogs = new Map();
        this.tasks = new Map();
        this.currentUserId = 1;
        this.currentActivityId = 1;
        this.currentLogId = 1;
        this.currentTaskId = 1;
        this.filePath = path.join(process.cwd(), 'local-data.json');
        this.loadData();
    }

    private loadData() {
        if (fs.existsSync(this.filePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
                if (data.users) {
                    data.users.forEach((u: User) => this.users.set(u.id.toString(), u));
                    const ids = data.users.map((u: User) => parseInt(u.id)).filter((n: number) => !isNaN(n));
                    this.currentUserId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
                }
                if (data.activities) {
                    data.activities.forEach((a: Activity) => this.activities.set(a.id.toString(), a));
                    const ids = data.activities.map((a: Activity) => parseInt(a.id)).filter((n: number) => !isNaN(n));
                    this.currentActivityId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
                }
                if (data.adminLogs) {
                    data.adminLogs.forEach((l: AdminLog) => this.adminLogs.set(l.id.toString(), l));
                    const ids = data.adminLogs.map((l: AdminLog) => parseInt(l.id)).filter((n: number) => !isNaN(n));
                    this.currentLogId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
                }
                if (data.tasks) {
                    data.tasks.forEach((t: Task) => this.tasks.set(t.id.toString(), t));
                    const ids = data.tasks.map((t: Task) => parseInt(t.id)).filter((n: number) => !isNaN(n));
                    this.currentTaskId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
                }
            } catch (e) {
                console.error("Failed to load local data:", e);
            }
        }
    }

    private saveData() {
        try {
            const data = {
                users: Array.from(this.users.values()),
                activities: Array.from(this.activities.values()),
                adminLogs: Array.from(this.adminLogs.values()),
                tasks: Array.from(this.tasks.values()),
            };
            fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error("Failed to save local data:", e);
        }
    }

    async getUser(id: string | number): Promise<User | undefined> {
        return this.users.get(id.toString());
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find(
            (user) => user.username === username
        );
    }

    async getUserByEmail(email: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find(
            (user) => user.email === email
        );
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const id = this.currentUserId++;
        const user: User = { ...insertUser, id: id.toString(), createdAt: new Date() };
        this.users.set(id.toString(), user);
        this.saveData();
        return user;
    }

    async getUserActivities(userId: string | number): Promise<Activity[]> {
        return Array.from(this.activities.values()).filter(
            (activity) => activity.userId === userId.toString()
        );
    }

    async createActivity(insertActivity: InsertActivity): Promise<Activity> {
        const id = this.currentActivityId++;
        const activity: Activity = { ...insertActivity, id: id.toString(), createdAt: new Date() };
        this.activities.set(id.toString(), activity);
        this.saveData();
        return activity;
    }

    async updateActivity(id: string | number, activity: Partial<Activity>): Promise<Activity | undefined> {
        const strId = id.toString();
        const existing = this.activities.get(strId);
        if (!existing) return undefined;
        const updated = { ...existing, ...activity };
        this.activities.set(strId, updated);
        this.saveData();
        return updated;
    }

    async deleteActivity(id: string | number): Promise<boolean> {
        const strId = id.toString();
        const deleted = this.activities.delete(strId);
        if (deleted) this.saveData();
        return deleted;
    }

    async updateUser(id: string | number, user: Partial<User>): Promise<User | undefined> {
        const strId = id.toString();
        const existing = this.users.get(strId);
        if (!existing) return undefined;
        const updated = { ...existing, ...user };
        this.users.set(strId, updated);
        this.saveData();
        return updated;
    }

    async getAllUsers(): Promise<User[]> {
        return Array.from(this.users.values());
    }

    async deleteUser(id: string | number): Promise<boolean> {
        const strId = id.toString();
        const deleted = this.users.delete(strId);
        if (deleted) this.saveData();
        return deleted;
    }

    async getAllActivities(): Promise<Activity[]> {
        return Array.from(this.activities.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
        const id = this.currentLogId++;
        const entry: AdminLog = { ...log, id: id.toString(), createdAt: new Date() };
        this.adminLogs.set(id.toString(), entry);
        this.saveData();
        return entry;
    }

    async getAdminLogs(): Promise<AdminLog[]> {
        return Array.from(this.adminLogs.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async getUserTasks(userId: string): Promise<Task[]> {
        return Array.from(this.tasks.values())
            .filter(t => t.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    async createTask(insertTask: InsertTask): Promise<Task> {
        const id = this.currentTaskId++;
        const task: Task = { ...insertTask, id: id.toString(), createdAt: new Date().toISOString() };
        this.tasks.set(id.toString(), task);
        this.saveData();
        return task;
    }

    async updateTask(id: string, data: Partial<Task>): Promise<Task | undefined> {
        const existing = this.tasks.get(id);
        if (!existing) return undefined;
        const updated = { ...existing, ...data };
        this.tasks.set(id, updated);
        this.saveData();
        return updated;
    }

    async deleteTask(id: string): Promise<boolean> {
        const deleted = this.tasks.delete(id);
        if (deleted) this.saveData();
        return deleted;
    }
}
