import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { pageEnter, pageExit } from '@/lib/motion';
import { ROUTES } from '@/lib/constants';

/**
 * Authenticated app shell — Blue Dynasty. Renders the navbar, sidebar
 * (drawer on mobile), and the routed page inside a keyed motion container so
 * every route change plays a slide/fade transition. Nested routes render via
 * <Outlet /> (this layout is used as a React Router layout route element).
 */
/** Maps a route path to its browser-tab title. */
const ROUTE_TITLES: Array<{ test: (pathname: string) => boolean; title: string }> = [
  { test: (p) => p === ROUTES.DASHBOARD, title: 'Dashboard' },
  { test: (p) => p.startsWith(ROUTES.DISCOVER),  title: 'Discover' },
  { test: (p) => p.startsWith(ROUTES.PROPOSALS), title: 'Proposals' },
  // Exact for the nest list, regex for the dynamic /nests/:nestId detail route.
  { test: (p) => p === ROUTES.MY_NEST, title: 'My Nest' },
  { test: (p) => /^\/nests\/\d+/.test(p), title: 'Nest' },
  { test: (p) => p.startsWith(ROUTES.PROFILE),   title: 'Profile' },
  { test: (p) => p.startsWith(ROUTES.MESSAGES),  title: 'Messages' },
];

/** Sets the document title from the current pathname. */
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
      {/* Ambient background lighting */}
      <div
        className="pointer-events-none absolute -top-32 left-1/4 h-[420px] w-[560px] rounded-full bg-accent-500/[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-accent-400/[0.05] blur-3xl"
        aria-hidden="true"
      />

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
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
