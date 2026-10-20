import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, displayName: string) => Promise<void>;
  sendVerificationCode: (email: string) => Promise<{ message: string; devCode?: string }>;
  verifyCodeAndLogin: (email: string, code: string, displayName?: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'pelihuone_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, displayName: string) => {
    const loggedInUser = await api.login(email, displayName);
    setUser(loggedInUser);
  };

  const sendVerificationCode = async (email: string) => {
    return await api.sendVerificationCode(email);
  };

  const verifyCodeAndLogin = async (email: string, code: string, displayName?: string) => {
    const loggedInUser = await api.verifyCodeAndLogin(email, code, displayName);
    setUser(loggedInUser);
  };

  const logout = () => {
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isAdmin = user?.role === 'Admin' || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        sendVerificationCode,
        verifyCodeAndLogin,
        logout,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
