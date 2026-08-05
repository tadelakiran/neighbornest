import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Public page shell (login / register).
 * Renders the animated gradient backdrop behind auth pages.
 */
export function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] theme-transition">
      <GradientBackground />
      <div className="relative">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
