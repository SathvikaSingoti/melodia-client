"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  _id: string;
  username: string;
  email: string;
  onboardingCompleted?: boolean;
  avatarUrl?: string;
  favoriteGenres?: string[];
  favoriteArtists?: string[];
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage for token and user on mount
    const storedToken = localStorage.getItem("melodia_token");
    const storedUser = localStorage.getItem("melodia_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser._id && parsedUser.id) {
          parsedUser._id = parsedUser.id;
        }
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    
    // Set up axios interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem("melodia_token");
        if (currentToken && config.headers) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    setIsLoading(false);

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  const login = React.useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("melodia_token", newToken);
    localStorage.setItem("melodia_user", JSON.stringify(newUser));
  }, []);

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("melodia_token");
    localStorage.removeItem("melodia_user");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
