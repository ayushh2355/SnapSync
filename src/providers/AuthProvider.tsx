'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = getAuthToken();
    if (storedToken && !user) {
      setToken(storedToken);
      fetch('/api/user/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
      .then(res => {
        if (!res.ok) {
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          setToken(null);
          setUser(null);
          return null; // Return null instead of throwing to prevent Next.js dev error overlay
        }
        return res.json();
      })
      .then(data => {
        if (data && data.success) setUser(data.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, userData?: User) => {
    document.cookie = `token=${newToken}; path=/; max-age=86400; SameSite=Strict`;
    setToken(newToken);
    if (userData) {
      setUser(userData);
    }
  };

  const logout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
