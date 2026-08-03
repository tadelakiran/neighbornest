import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, getStoredRefreshToken } from '@/stores/authStore';
import { useToastStore } from '@/stores/toastStore';
import type { ApiError, AuthResponse } from '@/types/auth.types';

/**
 * Base URL of the API Gateway.
 * Defaults to http://localhost:8080; set `VITE_API_URL` in `.env` to override,
 * or set it to an empty string to route through the Vite dev proxy.
 */
const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Shared axios instance for the NeighborNest API.
 *
 * - Request interceptor attaches `Authorization: Bearer <accessToken>` from the
 *   auth store (in-memory token).
 * - Response interceptor transparently refreshes expired access tokens on 401
 *   (queuing concurrent requests) and surfaces 403/500/network errors as toasts.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ---------------------------------------------------------------------------
// Request interceptor: attach the in-memory access token
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Lightweight GET cache: dedupes in-flight requests and reuses identical
// GET responses for a short TTL. Cuts duplicate /api/users/me calls across
// the app shell, dashboard, profile page, and onboarding resume.
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

/**
 * GETs a URL with short-lived caching + in-flight deduplication.
 *
 * @param url - the path (relative to baseURL)
 * @param ttlMs - how long the cached value stays fresh (default 30s)
 * @returns the parsed response body
 */
export async function cachedGet<T>(url: string, ttlMs = 30_000): Promise<T> {
  const entry = responseCache.get(url);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }

  const existing = inflight.get(url);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = api
    .get<T>(url)
    .then(({ data }) => {
      responseCache.set(url, { data, expiresAt: Date.now() + ttlMs });
      inflight.delete(url);
      return data;
    })
    .catch((error: unknown) => {
      inflight.delete(url);
      throw error;
    });

  inflight.set(url, promise);
  return promise;
}

/** Drops a cached entry (call after mutating requests like PUT/POST). */
export function invalidateCache(url: string): void {
  responseCache.delete(url);
}

/**
 * Empties the entire response cache.
 * Call on logout / login so a fresh session never reads another user's data.
 */
export function clearCache(): void {
  responseCache.clear();
}

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor: auto-refresh on 401 + error toasts
// ---------------------------------------------------------------------------

/** Extends the axios config with a retry guard for the refresh flow. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/** Requests that must never trigger the refresh flow themselves. */
function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/api/auth/login') || url.includes('/api/auth/refresh');
}

/** Whether a refresh request is already in flight. */
let isRefreshing = false;

/** Callbacks for requests that 401'd while a refresh was in flight. */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/** Resolves or rejects every queued request once the refresh completes. */
function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token ?? '');
  });
  failedQueue = [];
}

/** Clears the session and hard-redirects to the login page. */
function handleAuthFailure(): void {
  const { clearAuth } = useAuthStore.getState();
  clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    // --- 401: attempt a token refresh, then retry the original request ---
    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      if (isRefreshing) {
        // Another request is already refreshing — queue and wait for the token.
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((queuedError: unknown) => Promise.reject(queuedError));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        processQueue(new Error('No refresh token available'), null);
        handleAuthFailure();
        return Promise.reject(error);
      }

      try {
        const { data } = await api.post<AuthResponse>('/api/auth/refresh', {
          refreshToken,
        });
        useAuthStore.getState().setAuth(data);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // --- 403 / 500 / network errors: surface a toast ---
    if (status === 403) {
      useToastStore
        .getState()
        .addToast(error.response?.data?.message ?? 'You do not have permission to do that.', 'error');
    } else if (status === 500) {
      useToastStore.getState().addToast('Something went wrong on our end. Please try again.', 'error');
    } else if (!error.response) {
      useToastStore.getState().addToast('Network error — please check your connection.', 'error');
    }

    return Promise.reject(error);
  }
);