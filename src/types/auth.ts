export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: 'admin' | 'user';
  plan: 'free' | 'premium';
  aiUsageCount?: number;
  aiUsageResetAt?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}