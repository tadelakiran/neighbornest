import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
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
        // Pass `null` so a previous session's persisted profile is dropped —
        // otherwise pages briefly read the old user's id while fetchUser()
        // resolves, querying APIs with the wrong profile and rendering blank.
        setAuth(authResponse, null);
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
   * Registers a new account and signs the user straight in.
   *
   * The backend returns no tokens from register, so the account is created
   * first and then logged in with the same credentials — one seamless flow
   * that lands the user on the dashboard instead of a second login screen.
   *
   * A minimal user-service profile is provisioned right after login so the
   * new person is immediately visible in the profiles database and on
   * Discover; the onboarding wizard later fills in city, neighborhood, etc.
   *
   * @param payload - full name, email, and password
   * @returns the action result (success or error message)
   */
  const register = useCallback(
    async (payload: RegisterRequest): Promise<AuthActionResult> => {
      // Step 1: create the account. Any failure here means no account exists.
      try {
        await authService.register(payload);
      } catch (error) {
        const message = getErrorMessage(error, 'Registration failed. Please try again.');
        toast.error(message);
        return { success: false, error: message };
      }

      // Step 2: sign the new account straight in (no second login screen).
      try {
        const authResponse = await authService.login({
          email: payload.email,
          password: payload.password,
        });
        // Drop any persisted profile from a previous session before the new
        // user's profile is fetched (see login above).
        setAuth(authResponse, null);
        // Step 3: provision the user-service profile (best-effort).
        // 409 = profile already exists; any other 4xx just means the onboarding
        // wizard will create it later. Never block the session on this call.
        try {
          await userService.createProfile({ fullName: payload.fullName });
        } catch {
          // Best-effort — see above.
        }
        void fetchUser();
        toast.success('Welcome to NeighborNest! Your account is ready.');
        navigate(ROUTES.DASHBOARD, { replace: true });
        return { success: true };
      } catch {
        // Registration succeeded but auto-login hiccuped (rare). Never report
        // "registration failed" — the account exists. Send them to sign-in with
        // the email prefilled instead of stranding them on a 409 loop.
        toast.success('Account created! Please sign in to continue.');
        navigate(ROUTES.LOGIN, { replace: true, state: { registeredEmail: payload.email } });
        return { success: true };
      }
    },
    [navigate, setAuth, fetchUser, toast]
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
