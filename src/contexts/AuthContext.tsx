import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, AuthResponse } from '../types/auth';
import { SessionManager } from '../utils/sessionManager';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

/** Normalize the API user shape → frontend User (maps username → name) */
function toUser(raw: AuthResponse['user']): User {
  return {
    id: raw.id,
    email: raw.email,
    name: (raw as any).name ?? raw.username ?? raw.email.split('@')[0],
    username: raw.username,
    role: raw.role,
    plan: raw.plan,
    aiUsageCount: (raw as any).aiUsageCount,
    aiUsageResetAt: (raw as any).aiUsageResetAt,
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = SessionManager.getUser();
    if (stored && SessionManager.getToken()) setUser(stored);
    setIsLoading(false);
  }, []);

  const login = (response: AuthResponse | User, token?: string) => {
    let u: User;
    let t: string;

    if ('token' in response && 'user' in response) {
      // New shape: { user, token }
      u = toUser((response as AuthResponse).user);
      t = (response as AuthResponse).token;
    } else {
      // Legacy bare User
      u = response as User;
      t = token ?? SessionManager.getToken() ?? '';
    }

    setUser(u);
    SessionManager.saveSession(u, t);
  };

  const logout = () => {
    setUser(null);
    SessionManager.clearSession();
    window.location.reload();
  };

  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      SessionManager.saveSession(updated, SessionManager.getToken() ?? '');
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
