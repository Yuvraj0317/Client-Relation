import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemoRole: (role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUserSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response: any = await api.get('/auth/me');
        if (response.success) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out');
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();
  }, [token]);

  const login = async (email: string, password: string) => {
    const response: any = await api.post('/auth/login', { email, password });
    if (response.success) {
      const { token: newToken, user: newUser } = response.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  const loginAsDemoRole = async (role: Role) => {
    const demoCredentials: Record<Role, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@fundsroom.com', pass: 'Password123!' },
      SALES: { email: 'sales@fundsroom.com', pass: 'Password123!' },
      WAREHOUSE: { email: 'warehouse@fundsroom.com', pass: 'Password123!' },
      ACCOUNTS: { email: 'accounts@fundsroom.com', pass: 'Password123!' },
    };

    const cred = demoCredentials[role];
    await login(cred.email, cred.pass);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        loginAsDemoRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
