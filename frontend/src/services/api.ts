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
    // TEMP auth-debug logging — remove once the refresh-race investigation is done.
    console.debug('[auth] request', config.method?.toUpperCase(), config.url, accessToken ? 'token attached' : 'NO TOKEN');
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

/**
 * Shows an error toast with deduplication.
 *
 * On a page refresh (or a backend outage) several requests fail at once and
 * each would otherwise push the same toast — that spams the screen with
 * identical "no response from the server" popups. Identical messages shown
 * within the window are suppressed; the first one is enough.
 */
const ERROR_TOAST_DEDUPE_MS = 4000;
let lastErrorToast = { message: '', at: 0 };

function showErrorToast(message: string): void {
  const now = Date.now();
  if (lastErrorToast.message === message && now - lastErrorToast.at < ERROR_TOAST_DEDUPE_MS) {
    return;
  }
  lastErrorToast = { message, at: now };
  useToastStore.getState().addToast(message, 'error');
}

/** Clears the session and hard-redirects to the login page. */
function handleAuthFailure(): void {
  const { clearAuth } = useAuthStore.getState();
  clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

/**
 * One-shot retry for cold-start / first-call failures.
 *
 * Right after the backend boots, the first request can fail because the
 * services are still warming up (Hibernate bootstrap, DB pool, JIT) or the
 * gateway hasn't picked up a freshly registered instance yet. When the
 * request never got a response we retry it once — the client timeout (15s)
 * is easily exceeded on a cold call, and one retry fixes the vast majority
 * of these transient failures.
 *
 * Retry rules (kept conservative so a POST is never double-submitted):
 * - GET/HEAD: retry on any no-response failure (timeout or network).
 * - Other methods: retry ONLY on a connection-level refusal (ERR_NETWORK),
 *   where the server definitively never received the request.
 */
export function isRetryableNoResponse(method: string | undefined, code: string | undefined): boolean {
  const m = method?.toUpperCase() ?? 'GET';
  return m === 'GET' || m === 'HEAD' || code === 'ERR_NETWORK';
}

api.interceptors.response.use(
  (response) => {
    // The data services (user/matching/nest/chat) wrap every successful body in
    // a consistent { data, message, status } envelope. Unwrap it transparently
    // so existing typed calls keep receiving the payload directly. Responses
    // that are not envelopes (auth payloads, gateway fallbacks, raw Feign
    // paths) pass through untouched.
    const body = response.data;
    if (
      body &&
      typeof body === 'object' &&
      'data' in body &&
      'message' in body &&
      'status' in body
    ) {
      response.data = (body as { data: unknown }).data;
    }
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    // --- Retry once for requests that never reached a server response ---
    if (
      !error.response &&
      original &&
      !original._retry &&
      isRetryableNoResponse(original.method, error.code)
    ) {
      original._retry = true;
      // TEMP auth-debug logging — remove once the refresh-race investigation is done.
      console.warn('[auth] no response for', original.method?.toUpperCase(), original.url, '- retrying once');
      // Short delay lets a just-booted instance finish registering/warming up.
      await new Promise((resolve) => setTimeout(resolve, 800));
      return api(original);
    }

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
      // TEMP auth-debug logging — remove once the refresh-race investigation is done.
      console.warn('[auth] 401 on', original.method?.toUpperCase(), original.url, '- starting token refresh');
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
        // TEMP auth-debug logging — remove once the refresh-race investigation is done.
        console.info('[auth] token refreshed; retrying original request', original.url);
        useAuthStore.getState().setAuth(data);
        processQueue(null, data.access_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        // TEMP auth-debug logging — remove once the refresh-race investigation is done.
        console.error('[auth] token refresh FAILED for', original.url, '- signing out', refreshError);
        processQueue(refreshError, null);
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // --- 403 / 500 / network errors: surface a (deduped) toast ---
    if (status === 403) {
      // TEMP auth-debug logging — remove once the refresh-race investigation is done.
      console.warn('[auth] 403 on', original?.method?.toUpperCase(), original?.url, '-', error.response?.data?.message ?? 'no message in body');
      showErrorToast(error.response?.data?.message ?? 'You do not have permission to do that.');
    } else if (status === 500) {
      showErrorToast('Something went wrong on our end. Please try again.');
    } else if (!error.response) {
      showErrorToast('Network error — please check your connection.');
    }

    return Promise.reject(error);
  }
);