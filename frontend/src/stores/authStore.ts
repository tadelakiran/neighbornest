import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, mapProfileToUser } from '@/services/authService';
import { REFRESH_TOKEN_STORAGE_KEY } from '@/lib/constants';
import { useToastStore } from '@/stores/toastStore';
import { getErrorMessage } from '@/lib/utils';
import type { AuthResponse, User } from '@/types/auth.types';

/*
 * Security model:
 *  - The ACCESS token lives only in memory (Zustand state) and is never persisted.
 *  - The REFRESH token is stored in localStorage so the axios interceptor can
 *    transparently refresh the session after a page reload.
 *  - Only `user` and `isAuthenticated` are persisted via the zustand `persist`
 *    middleware (see `partialize` below).
 *
 * NOTE: this module imports authService (which imports api), and api.ts imports
 * this store. That cycle is intentional and safe — every cross-module binding is
 * dereferenced at runtime only (inside actions/interceptors), never at module
 * evaluation time. Keep it that way when editing.
 */

/** Reads the refresh token from localStorage. */
export function getStoredRefreshToken(): string | null {
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

/** Persists (or clears) the refresh token in localStorage. */
export function setStoredRefreshToken(token: string | null): void {
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }
}

interface AuthState {
  /** The current user profile, or null when signed out / not yet loaded. */
  user: User | null;
  /** In-memory access token (never persisted). */
  accessToken: string | null;
  /** Whether the user has a valid session. */
  isAuthenticated: boolean;
  /** True while the session/profile is being bootstrapped or refreshed. */
  isLoading: boolean;
  /** Stores tokens from a login/refresh response and marks the session active. */
  setAuth: (response: AuthResponse, user?: User | null) => void;
  /** Clears the session entirely (state + refresh token). */
  clearAuth: () => void;
  /** Fetches the current user profile from `GET /api/users/me`. */
  fetchUser: () => Promise<void>;
}

/**
 * Authentication store — source of truth for the user session.
 *
 * - `setAuth` is called after login and after every successful token refresh.
 * - `fetchUser` populates `user`; a 404 (profile not created yet, Module 2)
 *   is tolerated silently so the shell still works after registration.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (response, user) => {
        setStoredRefreshToken(response.refresh_token);
        set({
          accessToken: response.access_token,
          isAuthenticated: true,
          user: user ?? get().user,
        });
      },

      clearAuth: () => {
        setStoredRefreshToken(null);
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      },

      fetchUser: async () => {
        set({ isLoading: true });
        try {
          const profile = await authService.getMe();
          set({ user: mapProfileToUser(profile), isLoading: false });
        } catch (error) {
          // 404 = profile not created yet (Module 2) — keep whatever user we have.
          const status = (error as { response?: { status?: number } }).response?.status;
          if (status !== 404) {
            useToastStore.getState().addToast(getErrorMessage(error), 'error');
          }
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'neighbornest.auth',
      // Persist ONLY user + isAuthenticated — tokens never touch localStorage.
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
