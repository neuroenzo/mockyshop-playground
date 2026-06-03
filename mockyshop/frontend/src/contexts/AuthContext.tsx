"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types/api";
import { login as loginApi } from "@/lib/queries/auth";
import { getToken, setToken, removeToken } from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isRole: (...roles: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const t = getToken();
    if (!t) {
      setUser(null);
      setTokenState(null);
      return;
    }
    try {
      const { getMyProfile } = await import("@/lib/queries/auth");
      const u = await getMyProfile();
      setUser(u);
      setTokenState(t);
    } catch {
      removeToken();
      setUser(null);
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    const t = getToken();
    if (t) {
      const payload = decodeTokenPayload(t);
      if (payload && payload.exp && Number(payload.exp) * 1000 < Date.now()) {
        removeToken();
        setLoading(false);
        return;
      }
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await loginApi({ username, password });
    setToken(res.access_token);
    setTokenState(res.access_token);
    const { getMyProfile } = await import("@/lib/queries/auth");
    const u = await getMyProfile();
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    setTokenState(null);
    router.push("/");
  }, [router]);

  const isRole = useCallback(
    (...roles: string[]) => !!user && roles.includes(user.role),
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
