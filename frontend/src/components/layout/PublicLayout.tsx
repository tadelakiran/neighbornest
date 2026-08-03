import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Minimal wrapper for public routes (login / register).
 * Provides a subtle page-level background so auth pages feel anchored,
 * while each page owns its own centered layout.
 */
export function PublicLayout() {
  return (
    <div className="relative min-h-screen bg-slate-900">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
