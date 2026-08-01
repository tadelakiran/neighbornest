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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <Outlet />;
}
