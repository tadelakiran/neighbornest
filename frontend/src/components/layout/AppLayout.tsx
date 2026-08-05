import { Suspense, useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Authenticated app shell: fixed Navbar + Sidebar, animated mesh gradient
 * background, and smooth page transitions via Framer Motion.
 */
export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const openSidebar  = useCallback(() => setSidebarOpen(true),  []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="relative min-h-screen bg-[var(--color-bg)] theme-transition">
      <GradientBackground />
      <Navbar onMenuClick={openSidebar} />
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <main className="relative pt-16 lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="flex min-h-[55vh] items-center justify-center">
                <Spinner size="lg" />
              </div>
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>
    </div>
  );
}
