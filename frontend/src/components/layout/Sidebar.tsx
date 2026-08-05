import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, MessageSquare, User as UserIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  to:    string;
  icon:  typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'My Nest',   to: ROUTES.MY_NEST,   icon: Home            },
  { label: 'Messages',  to: ROUTES.MESSAGES,  icon: MessageSquare   },
  { label: 'Profile',   to: ROUTES.PROFILE,   icon: UserIcon        },
];

interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}

/**
 * Left sidebar — white/light surface in light mode, dark navy in dark mode.
 * Desktop: static. Mobile: slide-over drawer with backdrop.
 */
export const Sidebar = memo(function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col',
          'bg-[var(--color-bg)] border-r border-[var(--color-border)]',
          'shadow-lg lg:shadow-none',
          'transition-transform duration-300 lg:translate-x-0 lg:pt-16',
          'theme-transition',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Primary navigation"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--text-primary)]"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent-50 text-accent-700 border border-accent-200 shadow-sm [data-theme="dark"]:bg-accent-900/20 [data-theme="dark"]:text-accent-300 [data-theme="dark"]:border-accent-700/30'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--text-primary)] hover:translate-x-0.5'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors',
                    isActive
                      ? 'bg-accent-500 text-white shadow-sm'
                      : 'bg-[var(--color-surface)] text-[var(--text-muted)] group-hover:bg-accent-100 group-hover:text-accent-600'
                  )}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {label}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-500" aria-hidden="true" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Mini user card */}
        <div className="border-t border-[var(--color-border)] p-4">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <span className="rounded-full ring-2 ring-accent-300/50">
              <Avatar name={user?.fullName ?? 'Guest'} src={user?.profilePhotoUrl} size="sm" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {user?.fullName ?? 'Guest'}
              </p>
              <p className="truncate text-xs capitalize text-[var(--text-muted)]">
                {user?.role?.toLowerCase() ?? 'newcomer'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});
