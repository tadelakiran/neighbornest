import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { PageLoader } from '@/components/ui/PageLoader';
import { AppRouter } from '@/router/AppRouter';
import { useAuthStore } from '@/stores/authStore';

/**
 * Application root.
 *
 * - Bootstraps the session on mount. The access token lives only in memory,
 *   so after a page refresh it is gone even though `isAuthenticated` was
 *   restored from localStorage. Before anything can fire an API call we must
 *   exchange the stored refresh token for a fresh access token, otherwise
 *   every request would go out unauthenticated and fail.
 * - Rendering is held on a branded loader until the session is confirmed
 *   restored (or the user is confirmed signed out), so no component can fire
 *   a request before the token is present.
 * - Once a token exists, the profile is refreshed from the server (the axios
 *   interceptor transparently refreshes the token if it expired meanwhile).
 */
export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      void restoreSession();
    } else if (isAuthenticated && accessToken) {
      void fetchUser();
    }
  }, [isAuthenticated, accessToken, restoreSession, fetchUser]);

  // Hold rendering while the session is being restored — API calls must not
  // fire before the access token is confirmed present.
  if (isAuthenticated && !accessToken) {
    return (
      <ErrorBoundary>
        <PageLoader />
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ToastContainer />
    </ErrorBoundary>
  );
}
