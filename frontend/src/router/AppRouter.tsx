import { Navigate, Route, Routes } from 'react-router-dom';
import { AnchorApplicationForm } from '@/components/profile/AnchorApplicationForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { ComingSoonPage } from '@/pages/ComingSoonPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

/**
 * Route guard for the anchor application — only NEWCOMERs may apply.
 * Anchors/Admins bounce back to the profile page.
 */
function AnchorApplyRoute() {
  const role = useAuthStore((state) => state.user?.role);
  if (role && role !== 'NEWCOMER') {
    return <Navigate to={ROUTES.PROFILE} replace />;
  }
  return <AnchorApplicationForm />;
}

/**
 * Central route table.
 *
 * - Public routes render inside PublicLayout (no shell).
 * - Private routes are wrapped in ProtectedRoute; `/onboarding` is standalone
 *   (full-screen) while everything else renders inside AppLayout.
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
        {/* Onboarding is full-screen (no navbar/sidebar) */}
        <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

        <Route element={<AppLayout />}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
          <Route path={ROUTES.ANCHOR_APPLY} element={<AnchorApplyRoute />} />
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
