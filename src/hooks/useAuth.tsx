import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { authApi, type AuthUser } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.roles?.includes('admin') ?? false;
  const isSupport = user?.roles?.includes('support') ?? false;

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
      // Verify token is still valid
      authApi.me().then(u => {
        setUser(u);
        localStorage.setItem('auth_user', JSON.stringify(u));
      }).catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
      }).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { token, user } = await authApi.signIn(email, password);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setUser(user);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Login failed') };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const { token, user } = await authApi.signUp(email, password, fullName);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setUser(user);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Registration failed') };
    }
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, isSupport, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
