import { User } from "../types/api";

const AUTH_KEY = "inkflow-auth";

export type AuthStorage = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export function getAuthStorage(): AuthStorage | null {
  const value = localStorage.getItem(AUTH_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthStorage;
  } catch {
    return null;
  }
}

export function setAuthStorage(value: AuthStorage) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(value));
}

export function clearAuthStorage() {
  localStorage.removeItem(AUTH_KEY);
}

export function updateAccessToken(accessToken: string) {
  const existing = getAuthStorage();
  if (!existing) {
    return;
  }

  setAuthStorage({ ...existing, accessToken });
}

export function updateAuthTokens(accessToken: string, refreshToken?: string) {
  const existing = getAuthStorage();
  if (!existing) {
    return;
  }

  setAuthStorage({
    ...existing,
    accessToken,
    refreshToken: refreshToken ?? existing.refreshToken
  });
}
