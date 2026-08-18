import { useEffect } from 'react';

/**
 * Base URL of the API Gateway — mirrors `src/services/api.ts` so the
 * keep-alive ping targets the same backend without importing the shared
 * axios instance (and therefore without its auth interceptor or error toasts).
 */
const KEEP_ALIVE_API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Master switch for the frontend keep-alive.
 * Disabled by default — the browser-based ping is an OPTIONAL convenience and
 * must never be relied on to keep a sleeping backend awake on its own.
 */
const KEEP_ALIVE_ENABLED: boolean = import.meta.env.VITE_ENABLE_KEEP_ALIVE === 'true';

/** Fallback interval between pings: 10 minutes. */
const DEFAULT_KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Configurable ping interval. Falls back to 10 minutes when unset, empty, or
 * not a positive number.
 */
const KEEP_ALIVE_INTERVAL_MS: number =
  Number(import.meta.env.VITE_KEEP_ALIVE_INTERVAL_MS) > 0
    ? Number(import.meta.env.VITE_KEEP_ALIVE_INTERVAL_MS)
    : DEFAULT_KEEP_ALIVE_INTERVAL_MS;

/**
 * Sends a single lightweight GET /health probe.
 *
 * Uses a bare `fetch` instead of the shared `api` axios instance on purpose:
 * the shared instance would attach the auth token, run the refresh flow, and
 * surface error toasts — none of which belong to an invisible keep-alive.
 * Failures are swallowed silently so a sleeping backend never spams the UI.
 */
async function pingHealth(): Promise<void> {
  try {
    await fetch(`${KEEP_ALIVE_API_URL}/health`, {
      method: 'GET',
      cache: 'no-store',
    });
  } catch {
    // Intentionally ignored — a down backend must not disturb the UI.
  }
}

/**
 * Invisible, isolated keep-alive mechanism.
 *
 * When enabled via `VITE_ENABLE_KEEP_ALIVE=true`, fires a tiny
 * `GET /health` request to the backend every `VITE_KEEP_ALIVE_INTERVAL_MS`
 * (default 10 minutes). It renders nothing, touches no state, storage, router,
 * or WebSocket layer, and cleans up its timer on unmount.
 *
 * Disabled (the default) it does nothing at all.
 */
export function useKeepAlive(): void {
  useEffect(() => {
    if (!KEEP_ALIVE_ENABLED) {
      return;
    }

    const timerId = window.setInterval(() => {
      void pingHealth();
    }, KEEP_ALIVE_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, []);
}
