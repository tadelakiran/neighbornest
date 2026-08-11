import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
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
  { to: ROUTES.DISCOVER, label: 'Discover',   icon: Compass },
  { to: ROUTES.PROPOSALS, label: 'Proposals', icon: Inbox },
  { to: ROUTES.MY_NEST, label: 'My Nest',     icon: Home },
  { to: ROUTES.MESSAGES, label: 'Messages',   icon: MessageSquare },
  { to: ROUTES.PROFILE, label: 'Profile',     icon: UserRound },
];

/**
 * Blue Dynasty side navigation. Fixed drawer on desktop, slide-over with
 * backdrop on mobile. Nav items highlight the active route with an accent
 * gradient; the footer shows the current user + logout.
 */
export function Sidebar({ isOpen, onClose, className = '' }: SidebarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-void/70 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col',
          'border-r border-[var(--color-border)] bg-deep/90 backdrop-blur-2xl',
          'transition-transform duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
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
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:text-primary lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-4" aria-label="Main navigation">
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
                    : 'text-secondary hover:bg-[var(--color-raised)] hover:text-primary'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('h-5 w-5 transition-transform duration-200', !isActive && 'group-hover:scale-110')}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-dot"
                      className="absolute right-3 h-1.5 w-1.5 rounded-full bg-white/90"
                      aria-hidden="true"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-[var(--color-border)] p-4">
          {user ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
              <Avatar name={user.fullName} src={user.profilePhotoUrl} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-primary">{user.fullName}</p>
                <p className="truncate text-[11px] capitalize text-muted">
                  {user.role?.toLowerCase() ?? 'member'}
                  {user.city ? ` · ${user.city}` : ''}
                </p>
              </div>
              <button
                onClick={() => void logout()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-rose-400/10 hover:text-rose-400"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <p className="px-2 py-1 text-xs text-muted">Signing in…</p>
          )}
        </div>
      </aside>
    </>
  );
}
