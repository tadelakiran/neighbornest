import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ProtectedRoute } from '@/router/ProtectedRoute';
import { PageLoader } from '@/components/ui/PageLoader';
import { ROUTES } from '@/lib/constants';
import { useAuthStore } from '@/stores/authStore';

/**
 * Route guard for the admin Anchor review queue — only ADMIN users may view
 * it; everyone else is redirected to the dashboard.
 *
 * While the profile is still bootstrapping (`user` null — e.g. a page refresh
 * where the persisted session is being revalidated), nothing is decided yet:
 * rendering the page would fire admin API calls without a known role, and
 * redirecting would bounce a real admin off the page before their role
 * restores. So we wait with a loader until the role is known.
 */
export function AdminRoute() {
  const user = useAuthStore((state) => state.user);
  if (user === null) {
    return <PageLoader />;
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }
  return <AdminAnchorReviewsPage />;
}

/**
 * Route-level code splitting: every page is a lazy chunk that only loads when
 * its route is first visited. The shared layouts (AppLayout / PublicLayout) and
 * the router itself stay in the initial bundle so navigation feels instant.
 */
const AnchorApplicationForm = lazy(() =>
  import('@/components/profile/AnchorApplicationForm').then((m) => ({ default: m.AnchorApplicationForm }))
);
const AdminAnchorReviewsPage = lazy(() =>
  import('@/pages/AdminAnchorReviewsPage').then((m) => ({ default: m.AdminAnchorReviewsPage }))
);
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const DiscoverPage = lazy(() => import('@/pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage })));
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const MessagesPage = lazy(() => import('@/pages/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const NestsPage = lazy(() => import('@/pages/NestsPage').then((m) => ({ default: m.NestsPage })));
const NestHubPage = lazy(() => import('@/pages/NestHubPage').then((m) => ({ default: m.NestHubPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const ProposalsPage = lazy(() => import('@/pages/ProposalsPage').then((m) => ({ default: m.ProposalsPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));

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
 * - Every page is lazy-loaded; Suspense shows a branded loader while a chunk
 *   downloads (only happens once per route, after the initial load).
 */
export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.LANDING} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        </Route>

        {/* Private */}
        <Route element={<ProtectedRoute />}>
          {/* Onboarding is full-screen (no navbar/sidebar) */}
          <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

          <Route element={<AppLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.DISCOVER} element={<DiscoverPage />} />
            <Route path={ROUTES.PROPOSALS} element={<ProposalsPage />} />
            <Route path={ROUTES.MY_NEST} element={<NestsPage />} />
            <Route path={ROUTES.NEST_DETAIL} element={<NestHubPage />} />
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
            <Route path={ROUTES.ANCHOR_APPLY} element={<AnchorApplyRoute />} />
            <Route path={ROUTES.MESSAGES} element={<MessagesPage />} />
            <Route path={ROUTES.ADMIN_ANCHORS} element={<AdminRoute />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
