import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';
import { pageEnter, pageExit } from '@/lib/motion';
import { ROUTES } from '@/lib/constants';

const ROUTE_TITLES: Array<{ test: (pathname: string) => boolean; title: string }> = [
  { test: (p) => p === ROUTES.DASHBOARD, title: 'Dashboard' },
  { test: (p) => p.startsWith(ROUTES.DISCOVER), title: 'Discover' },
  { test: (p) => p.startsWith(ROUTES.PROPOSALS), title: 'Proposals' },
  { test: (p) => p === ROUTES.MY_NEST, title: 'My Nest' },
  { test: (p) => /^\/nests\/\d+/.test(p), title: 'Nest' },
  { test: (p) => p.startsWith(ROUTES.PROFILE), title: 'Profile' },
  { test: (p) => p.startsWith(ROUTES.MESSAGES), title: 'Messages' },
];

function useRouteTitle(pathname: string): void {
  useEffect(() => {
    const match = ROUTE_TITLES.find(({ test }) => test(pathname));
    document.title = match ? `${match.title} · NeighborNest` : 'NeighborNest';
  }, [pathname]);
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  useRouteTitle(pathname);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-void text-primary">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 left-[15%] h-[500px] w-[600px] rounded-full bg-accent-500/[0.06] blur-[100px]" />
        <div className="absolute right-[10%] top-[20%] h-[400px] w-[500px] rounded-full bg-accent-400/[0.04] blur-[90px]" />
        <div className="absolute bottom-[-10%] left-[40%] h-[400px] w-[400px] rounded-full bg-sky-400/[0.06] blur-[80px]" />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="relative flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            variants={{ ...pageEnter, ...pageExit }}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 md:px-8 md:py-8 md:pb-10"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>

      <MobileTabBar />
    </div>
  );
}