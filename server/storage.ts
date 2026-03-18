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
}

// Try MongoDB first; if it fails (no network, wrong URI, etc.) fall back to FileStorage
async function createStorage(): Promise<IStorage> {
  if (process.env.MONGODB_URI) {
    const ok = await connectMongo();
    if (ok) return new MongoStorage();
  }
  console.log('📁 Using file-based storage (local-data.json)');
  return new FileStorage();
}

// Export a promise that resolves to the correct storage instance
export const storageReady: Promise<IStorage> = createStorage();

// Synchronous proxy — delegates every call to whichever storage resolved
class StorageProxy implements IStorage {
  private _s: IStorage | null = null;
  private _fallback = new FileStorage();

  constructor() {
    storageReady.then(s => { this._s = s; });
  }

  private get s(): IStorage { return this._s ?? this._fallback; }

  getUser(id: string | number) { return this.s.getUser(id); }
  getUserByUsername(u: string) { return this.s.getUserByUsername(u); }
  getUserByEmail(e: string) { return this.s.getUserByEmail(e); }
  createUser(u: InsertUser) { return this.s.createUser(u); }
  getAllUsers() { return this.s.getAllUsers(); }
  deleteUser(id: string | number) { return this.s.deleteUser(id); }
  getUserActivities(id: string | number) { return this.s.getUserActivities(id); }
  getAllActivities() { return this.s.getAllActivities(); }
  createActivity(a: InsertActivity) { return this.s.createActivity(a); }
  updateActivity(id: string | number, a: Partial<Activity>) { return this.s.updateActivity(id, a); }
  deleteActivity(id: string | number) { return this.s.deleteActivity(id); }
  updateUser(id: string | number, u: Partial<User>) { return this.s.updateUser(id, u); }
  createAdminLog(l: InsertAdminLog) { return this.s.createAdminLog(l); }
  getAdminLogs() { return this.s.getAdminLogs(); }
  getUserTasks(userId: string) { return this.s.getUserTasks(userId); }
  createTask(t: InsertTask) { return this.s.createTask(t); }
  updateTask(id: string, d: Partial<Task>) { return this.s.updateTask(id, d); }
  deleteTask(id: string) { return this.s.deleteTask(id); }
}

export const storage: IStorage = new StorageProxy();
