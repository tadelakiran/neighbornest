import { motion } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Home,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/lib/constants';
import { EASE_OUT_EXPO } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Overview', icon: LayoutDashboard, end: true },
  { to: ROUTES.MY_NEST, label: 'My Nest', icon: Home },
  { to: ROUTES.DISCOVER, label: 'Discover', icon: Compass },
  { to: ROUTES.PROPOSALS, label: 'Invitations', icon: Inbox },
  { to: ROUTES.MESSAGES, label: 'Messages', icon: MessageSquare },
  { to: ROUTES.PROFILE, label: 'Profile', icon: UserRound },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

/**
 * Dashboard sidebar — a proper navigation menu for the dashboard workspace:
 * brand header, hairline divider, primary destinations, and a footer CTA.
 *
 * The sidebar runs the FULL height of the viewport (from just below the
 * navbar to the bottom of the screen) so there is never a dead gap below it.
 * The nav column flexes, the CTA pins to the bottom, and the menu scrolls
 * internally on short screens. Visible from `md+` up to `lg` (tablet widths
 * where the app's global sidebar is a hidden drawer); on `lg+` the global
 * sidebar is the permanent nav, and phones use the bottom tab bar.
 */
export function DashboardSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sticky top-[4.5rem] z-10 hidden h-[calc(100dvh-4.5rem)] w-64 shrink-0 self-start md:block lg:hidden">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-deep)]/60 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl"
      >
        {/* Header */}
        <motion.div variants={item} className="flex items-center gap-3 px-2 pt-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-gradient shadow-glow-sm">
            <Compass className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold tracking-tight text-primary">Navigation</p>
            <p className="truncate text-[10px] font-medium uppercase tracking-widest text-muted">
              Your workspace
            </p>
          </div>
        </motion.div>

        {/* Divider */}
        <motion.div variants={item} className="my-3 h-px bg-[var(--color-border)]" aria-hidden="true" />

        {/* Nav — flexes so the footer CTA pins to the bottom; scrolls on short screens */}
        <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar" aria-label="Sidebar navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <motion.div key={to} variants={item}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-200',
                    isActive
                      ? 'text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="dash-sidebar-active"
                        className="absolute inset-0 rounded-xl bg-accent-gradient shadow-glow"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        aria-hidden="true"
                      />
                    )}
                    <Icon
                      className={cn(
                        'relative z-10 h-5 w-5 shrink-0 transition-transform duration-200',
                        !isActive && 'group-hover:scale-110 group-hover:text-[var(--accent-400)]'
                      )}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 truncate">{label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="dash-sidebar-dot"
                        className="relative z-10 ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Footer CTA */}
        <motion.div
          variants={item}
          className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gradient shadow-glow-sm">
            <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <p className="mt-3 text-sm font-semibold text-primary">New in town?</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Run a match and find your Nest in the city.
          </p>
          <button
            onClick={() => navigate(ROUTES.DISCOVER)}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-gradient px-3 py-2 text-xs font-bold text-white shadow-glow transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Find your Nest
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </motion.div>
      </motion.div>
    </aside>
  );
}
