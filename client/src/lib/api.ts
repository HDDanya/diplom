import axios from "axios";
import { clearAuthStorage, getAuthStorage, updateAuthTokens } from "./storage";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  timeout: 10000
});

const refreshClient = axios.create({
  baseURL,
  timeout: 10000
});

let refreshPromise: Promise<string | null> | null = null;

function expireSession() {
  clearAuthStorage();
  window.dispatchEvent(new CustomEvent("inkflow:auth-expired"));
}

export async function refreshAccessToken() {
  const session = getAuthStorage();
  if (!session?.refreshToken) {
    expireSession();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string; refreshToken?: string }>("/auth/refresh", {
        refreshToken: session.refreshToken
      })
      .then((response) => {
        const newAccessToken = response.data.accessToken;
        updateAuthTokens(newAccessToken, response.data.refreshToken);
        return newAccessToken;
      })
      .catch(() => {
        expireSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const session = getAuthStorage();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      throw error;
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      throw error;
    }

    originalRequest._retry = true;
    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) {
      throw error;
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  }
);
