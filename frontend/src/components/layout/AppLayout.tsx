import { Suspense, useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Authenticated application shell: fixed Navbar on top, Sidebar on the left,
 * and a centered max-w-7xl content area rendered via <Outlet />.
 * The sidebar collapses into a drawer on mobile (controlled by the navbar hamburger).
 */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stable callbacks keep the memoized Navbar/Sidebar from re-rendering on
  // every route change.
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar onMenuClick={openSidebar} />
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <main className="pt-16 lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Local Suspense keeps the navbar/sidebar visible while a lazy page
              chunk downloads on its first visit. */}
          <Suspense
            fallback={
              <div className="flex min-h-[55vh] items-center justify-center">
                <Spinner size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
