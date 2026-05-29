import axios from "axios";
import { clearAuthStorage, getAuthStorage, updateAccessToken } from "./storage";

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

    const session = getAuthStorage();
    if (!session?.refreshToken) {
      clearAuthStorage();
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshClient
        .post("/auth/refresh", {
          refreshToken: session.refreshToken
        })
        .then((response) => {
          const newAccessToken = response.data.accessToken as string;
          updateAccessToken(newAccessToken);
          return newAccessToken;
        })
        .catch(() => {
          clearAuthStorage();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    const newAccessToken = await refreshPromise;
    if (!newAccessToken) {
      throw error;
    }

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(originalRequest);
  }
);
