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

function setTokenCookie(token: string, maxAge: number) {
  document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

function clearTokenCookie() {
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = getAuthToken();

    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    setToken(storedToken);

    fetch('/api/user/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) {
          clearTokenCookie();
          setToken(null);
          setUser(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setUser(data.data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const login = (newToken: string, userData?: User) => {
    setTokenCookie(newToken, 86400);
    setToken(newToken);
    if (userData) {
      setUser(userData);
    }
  };

  const logout = () => {
    clearTokenCookie();
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
