import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { SessionManager } from '../utils/sessionManager';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = SessionManager.getUser();
    if (stored && SessionManager.getToken()) setUser(stored);
    setIsLoading(false);
  }, []);

  /**
   * Call after a successful API login/register/google-auth.
   * Accepts either the new { user, token } shape or a bare User (legacy).
   */
  const login = (userOrResponse: User | { user: User; token: string }, token?: string) => {
    let u: User;
    let t: string;
    if ('token' in userOrResponse && 'user' in userOrResponse) {
      u = (userOrResponse as { user: User; token: string }).user;
      t = (userOrResponse as { user: User; token: string }).token;
    } else {
      u = userOrResponse as User;
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
