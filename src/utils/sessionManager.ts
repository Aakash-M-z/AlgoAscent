import { User } from '../types/auth';

const USER_KEY = 'pt_user';
const TOKEN_KEY = 'pt_token';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — matches JWT expiry

export class SessionManager {
    static saveSession(user: User, token: string): void {
        localStorage.setItem(USER_KEY, JSON.stringify({ user, ts: Date.now() }));
        localStorage.setItem(TOKEN_KEY, token);
    }

    /** @deprecated use saveSession */
    static saveUser(user: User): void {
        const token = this.getToken() ?? '';
        this.saveSession(user, token);
    }

    static getUser(): User | null {
        try {
            const raw = localStorage.getItem(USER_KEY);
            if (!raw) return null;
            const { user, ts } = JSON.parse(raw);
            if (Date.now() - ts > SESSION_TTL) { this.clearSession(); return null; }
            // Only clear if truly missing identity fields — role defaults to 'user' if absent
            // so stale sessions without role don't force a logout
            if (!user?.id || !user?.email) { this.clearSession(); return null; }
            // Backfill role if missing from old session (migration safety)
            if (!user.role) user.role = 'user';
            return user as User;
        } catch {
            this.clearSession();
            return null;
        }
    }

    static getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    static clearSession(): void {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        Object.keys(localStorage)
            .filter(k => k.startsWith('activities_'))
            .forEach(k => localStorage.removeItem(k));
    }

    static isSessionValid(): boolean {
        return !!this.getUser() && !!this.getToken();
    }
}
