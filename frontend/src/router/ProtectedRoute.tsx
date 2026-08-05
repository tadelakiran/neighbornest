import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';

/**
 * Route guard for private pages.
 *
 * - While the session/profile is bootstrapping: full-screen spinner.
 * - Not authenticated: redirect to /login, remembering the intended URL
 *   in location state so the login page can return the user afterwards.
 * - Authenticated: render the nested routes via <Outlet />.
 */
export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  // Show the full-screen spinner only on a true cold start (no cached user).
  // When a persisted session is being revalidated in the background, render
  // the app immediately with the cached profile instead of flashing a spinner
  // over an already-working page on every reload.
  if (isLoading && !user) {
    return (
      <div className="mesh-gradient flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
