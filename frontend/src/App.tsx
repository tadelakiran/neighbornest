import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { AppRouter } from '@/router/AppRouter';
import { useAuthStore } from '@/stores/authStore';

/**
 * Application root.
 *
 * - Bootstraps the session on mount: if a session was restored from
 *   localStorage, fetch the fresh user profile (the axios interceptor will
 *   transparently refresh the token if it expired).
 * - Wraps everything in a global error boundary and mounts the toast container.
 */
export default function App() {
  useEffect(() => {
    const { isAuthenticated, fetchUser } = useAuthStore.getState();
    if (isAuthenticated) {
      void fetchUser();
    }
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <ToastContainer />
    </ErrorBoundary>
  );
}
