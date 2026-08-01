import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { getStoredRefreshToken } from '@/stores/authStore';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import type { LoginRequest, RegisterRequest } from '@/types/auth.types';

/** Result of an auth action, letting forms decide how to respond. */
interface AuthActionResult {
  success: boolean;
  /** Human-readable error message when `success` is false. */
  error?: string;
}

/** Location state used to remember the URL the user tried to visit. */
interface LocationState {
  from?: { pathname: string };
}

/**
 * Composes the auth store, auth service, toasts, and navigation into a single
 * hook used by forms, the navbar, and pages.
 *
 * @returns the current session state plus login/register/logout actions
 */
export function useAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  /** The URL the user intended to visit before being redirected to login. */
  const intendedPath = (location.state as LocationState | null)?.from?.pathname ?? ROUTES.DASHBOARD;

  /**
   * Logs the user in: stores tokens, fetches the profile, and redirects.
   *
   * @param payload - email + password
   * @returns the action result (success or error message)
   */
  const login = useCallback(
    async (payload: LoginRequest): Promise<AuthActionResult> => {
      try {
        const authResponse = await authService.login(payload);
        setAuth(authResponse);
        void fetchUser();
        navigate(intendedPath, { replace: true });
        toast.success('Welcome back to NeighborNest!');
        return { success: true };
      } catch (error) {
        const message = getErrorMessage(error, 'Invalid email or password.');
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [navigate, intendedPath, setAuth, fetchUser, toast]
  );

  /**
   * Registers a new account. The backend returns no tokens from register,
   * so the user is redirected to the login page with a success toast.
   *
   * @param payload - full name, email, and password
   * @returns the action result (success or error message)
   */
  const register = useCallback(
    async (payload: RegisterRequest): Promise<AuthActionResult> => {
      try {
        await authService.register(payload);
        toast.success('Account created! Please sign in to continue.');
        navigate(ROUTES.LOGIN, { replace: true });
        return { success: true };
      } catch (error) {
        const message = getErrorMessage(error, 'Registration failed. Please try again.');
        toast.error(message);
        return { success: false, error: message };
      }
    },
    [navigate, toast]
  );

  /**
   * Logs the user out: invalidates the refresh token server-side (best effort),
   * clears the local session, and redirects to the login page.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout({ refreshToken: getStoredRefreshToken() ?? undefined });
    } catch {
      // Ignore server errors — the local session must still be cleared.
    } finally {
      clearAuth();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [navigate, clearAuth]);

  return { user, isAuthenticated, isLoading, login, register, logout };
}
