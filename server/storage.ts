import { User, InsertUser, Activity, InsertActivity, AdminLog, InsertAdminLog, Task, InsertTask } from "../shared/schema.js";
import { FileStorage } from "./file-storage.js";
import { MongoStorage, connectMongo } from "./mongo-storage.js";

export interface IStorage {
  getUser(id: string | number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string | number): Promise<boolean>;
  getUserActivities(userId: string | number): Promise<Activity[]>;
  getAllActivities(): Promise<Activity[]>;
  createActivity(insertActivity: InsertActivity): Promise<Activity>;
  updateActivity(id: string | number, activity: Partial<Activity>): Promise<Activity | undefined>;
  deleteActivity(id: string | number): Promise<boolean>;
  updateUser(id: string | number, user: Partial<User>): Promise<User | undefined>;
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(): Promise<AdminLog[]>;
  // Tasks
  getUserTasks(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  // AI usage tracking
  incrementAiUsage(userId: string | number): Promise<User | undefined>;
}

// Try MongoDB first; if it fails (no network, wrong URI, etc.) fall back to FileStorage
async function createStorage(): Promise<IStorage> {
  if (process.env.MONGODB_URI) {
    try {
      const ok = await connectMongo();
      if (ok) {
        console.log('📦 Using MongoDB storage');
        return new MongoStorage();
      }
    } catch (err: any) {
      console.warn('⚠️  MongoDB connect threw:', err?.message);
    }
  }
  console.log('📁 Using file-based storage (local-data.json)');
  return new FileStorage();
}

// Resolves once the correct backend is confirmed — awaited in server/index.ts
// so no request is served before storage is ready.
export const storageReady: Promise<IStorage> = createStorage();

// Async proxy — every method awaits storageReady before delegating.
// This eliminates the race condition where early requests hit an empty FileStorage.
class StorageProxy implements IStorage {
  private async s(): Promise<IStorage> { return storageReady; }

  async getUser(id: string | number) { return (await this.s()).getUser(id); }
  async getUserByUsername(u: string) { return (await this.s()).getUserByUsername(u); }
  async getUserByEmail(e: string) { return (await this.s()).getUserByEmail(e); }
  async createUser(u: InsertUser) { return (await this.s()).createUser(u); }
  async getAllUsers() { return (await this.s()).getAllUsers(); }
  async deleteUser(id: string | number) { return (await this.s()).deleteUser(id); }
  async getUserActivities(id: string | number) { return (await this.s()).getUserActivities(id); }
  async getAllActivities() { return (await this.s()).getAllActivities(); }
  async createActivity(a: InsertActivity) { return (await this.s()).createActivity(a); }
  async updateActivity(id: string | number, a: Partial<Activity>) { return (await this.s()).updateActivity(id, a); }
  async deleteActivity(id: string | number) { return (await this.s()).deleteActivity(id); }
  async updateUser(id: string | number, u: Partial<User>) { return (await this.s()).updateUser(id, u); }
  async createAdminLog(l: InsertAdminLog) { return (await this.s()).createAdminLog(l); }
  async getAdminLogs() { return (await this.s()).getAdminLogs(); }
  async getUserTasks(userId: string) { return (await this.s()).getUserTasks(userId); }
  async createTask(t: InsertTask) { return (await this.s()).createTask(t); }
  async updateTask(id: string, d: Partial<Task>) { return (await this.s()).updateTask(id, d); }
  async deleteTask(id: string) { return (await this.s()).deleteTask(id); }
  async incrementAiUsage(userId: string | number) { return (await this.s()).incrementAiUsage(userId); }
}

export const storage: IStorage = new StorageProxy();
