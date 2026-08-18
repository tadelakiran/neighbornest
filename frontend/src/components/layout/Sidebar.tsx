import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

const NAV_ITEMS: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }> = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.DISCOVER,  label: 'Discover',  icon: Compass },
  { to: ROUTES.PROPOSALS, label: 'Proposals', icon: Inbox },
  { to: ROUTES.MY_NEST,    label: 'My Nest',   icon: Home },
  { to: ROUTES.MESSAGES,   label: 'Messages',  icon: MessageSquare },
  { to: ROUTES.PROFILE,    label: 'Profile',   icon: UserRound },
];

const ADMIN_ITEMS: Array<{ to: string; label: string; icon: LucideIcon }> = [
  { to: ROUTES.ADMIN_ANCHORS, label: 'Anchor Reviews', icon: ShieldCheck },
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const sidebarVariants = {
  closed: { x: '-100%' },
  open: { x: 0, transition: { type: 'spring', damping: 28, stiffness: 280 } },
};

export function Sidebar({ isOpen, onClose, className = '' }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);

  // On lg+ the sidebar is a permanent, static column — it must NOT be slid
  // off-screen by the mobile drawer animation. Framer Motion applies its
  // transform as an inline style, which a `lg:transform-none` class cannot
  // override, so we drive the animation from a media query instead: desktop
  // always animates to the open (x: 0) state.
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-void/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        variants={sidebarVariants}
        initial={false}
        animate={isDesktop || isOpen ? 'open' : 'closed'}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col',
          'border-r border-[var(--color-border)] bg-[var(--color-deep)]/95 backdrop-blur-2xl',
          // Desktop: pin the sidebar below the sticky navbar so only the main
          // content column scrolls — profile, logout and the nav stay put.
          // (position: sticky can't be used here: the app shell's root has
          // overflow-x-hidden, which makes sticky resolve to a non-scrolling
          // container and the sidebar would scroll away with the page.)
          'lg:top-16 lg:bottom-0',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-2 pt-6">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="flex items-center gap-2.5"
            aria-label="Go to dashboard"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient shadow-glow-sm">
              <Compass className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-primary">
              Neighbor<span className="text-gradient">Nest</span>
            </span>
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-3 no-scrollbar" aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-accent-gradient text-white shadow-glow'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-transform duration-200',
                      !isActive && 'group-hover:scale-110'
                    )}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                      aria-hidden="true"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Admin section */}
          {user?.role === 'ADMIN' && (
            <>
              <div className="mx-3 my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-[var(--color-border)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Admin</span>
                <div className="h-px flex-1 bg-[var(--color-border)]" />
              </div>
              {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-accent-gradient text-white shadow-glow'
                        : 'text-secondary hover:bg-raised hover:text-primary'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-transform duration-200',
                          !isActive && 'group-hover:scale-110'
                        )}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="sidebar-active-pill"
                          className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                          aria-hidden="true"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-[var(--color-border)] p-4">
          {user ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
              <Avatar name={user.fullName} src={user.profilePhotoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user.fullName}</p>
                <p className="truncate text-[11px] capitalize text-[var(--text-muted)]">
                  {user.role?.toLowerCase() ?? 'member'}
                  {user.city ? ` · ${user.city}` : ''}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => void logout()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            </div>
          ) : (
            <p className="px-2 py-1 text-xs text-[var(--text-muted)]">Signing in…</p>
          )}
        </div>
      </motion.aside>
    </>
  );
}