import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';

/**
 * Route guard for private pages.
 *
 * - While the session/profile is bootstrapping: full-screen branded loader.
 * - Not authenticated: redirect to /login, remembering the intended URL
 *   in location state so the login page can return the user afterwards.
 * - Authenticated: render the nested routes via <Outlet />.
 */
export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  // Show the full-screen loader only on a true cold start (no cached user).
  // When a persisted session is being revalidated in the background, render
  // the app immediately with the cached profile instead of flashing a spinner
  // over an already-working page on every reload.
  if (isLoading && !user) {
    return (
      <div className="mesh-gradient flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow animate-pulse">
            <Compass className="h-7 w-7 text-white" aria-hidden="true" />
          </span>
          <p className="font-display text-sm font-semibold text-secondary">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
