import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ROUTES } from '@/lib/constants';

/**
 * Central route table.
 *
 * - Public routes render inside PublicLayout (no shell).
 * - Private routes are wrapped in ProtectedRoute + AppLayout.
 * - `/my-nest` and `/messages` resolve to ComingSoon placeholders until their
 *   modules land.
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      </Route>

      {/* Private */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route
            path={ROUTES.MY_NEST}
            element={
              <ComingSoonPage
                title="My Nest"
                description="See your Nest's members, meetings, and shared moments here once matching goes live (Module 3)."
              />
            }
          />
          <Route
            path={ROUTES.MESSAGES}
            element={
              <ComingSoonPage
                title="Messages"
                description="Chat with your Nest members and Anchor right here once messaging goes live."
              />
            }
          />
        </Route>
      </Route>

      {/* Root + fallback */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
