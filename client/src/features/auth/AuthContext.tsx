import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { clearAuthStorage, getAuthStorage, setAuthStorage } from "../../lib/storage";
import { AuthResponse, User } from "../../types/api";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  reloadMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const applySession = useCallback((session: AuthResponse) => {
    setUser(session.user);
    setAccessToken(session.accessToken);
    setAuthStorage({
      user: session.user,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    clearAuthStorage();
  }, []);

  const reloadMe = useCallback(async () => {
    const session = getAuthStorage();
    if (!session) {
      logout();
      return;
    }

    setAccessToken(session.accessToken);

    try {
      const response = await api.get<{ user: User }>("/auth/me");
      const nextUser = response.data.user;
      setUser(nextUser);
      setAuthStorage({ ...session, user: nextUser });
    } catch {
      logout();
    }
  }, [logout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<AuthResponse>("/auth/login", { email, password });
      applySession(response.data);
    },
    [applySession]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const response = await api.post<AuthResponse>("/auth/register", {
        email,
        password,
        displayName
      });
      applySession(response.data);
    },
    [applySession]
  );

  useEffect(() => {
    const session = getAuthStorage();
    if (!session) {
      setIsBootstrapping(false);
      return;
    }

    setUser(session.user);
    setAccessToken(session.accessToken);

    reloadMe().finally(() => setIsBootstrapping(false));
  }, [reloadMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isBootstrapping,
      login,
      register,
      logout,
      reloadMe
    }),
    [user, accessToken, isBootstrapping, login, logout, register, reloadMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
