import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutDashboard, MessageSquare, User as UserIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/hooks/useAuth';

/** A single sidebar navigation entry. */
interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
}

/** Primary navigation items shown in the sidebar. */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'My Nest', to: ROUTES.MY_NEST, icon: Home },
  { label: 'Messages', to: ROUTES.MESSAGES, icon: MessageSquare },
  { label: 'Profile', to: ROUTES.PROFILE, icon: UserIcon },
];

interface SidebarProps {
  /** Controls the mobile drawer visibility. */
  open: boolean;
  /** Closes the mobile drawer. */
  onClose: () => void;
}

/**
 * Left navigation sidebar.
 * - Desktop: static, pinned below the navbar (main content offsets with lg:pl-64).
 * - Mobile: slide-over drawer with a backdrop overlay.
 * Memoized: with stable props it skips re-renders on route changes.
 */
export const Sidebar = memo(function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="animate-fade-in fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-300 lg:translate-x-0 lg:pt-16',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Primary navigation"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between px-4 pt-4 lg:hidden">
          <span className="text-sm font-semibold text-slate-400">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'border-l-2 border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-l-2 border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mini user card */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-900 p-3">
            <Avatar name={user?.fullName ?? 'Guest'} src={user?.profilePhotoUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-200">
                {user?.fullName ?? 'Guest'}
              </p>
              <p className="truncate text-xs capitalize text-slate-500">
                {user?.role.toLowerCase() ?? 'Newcomer'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
});
