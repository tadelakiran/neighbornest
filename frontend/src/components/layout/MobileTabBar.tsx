import { NavLink } from 'react-router-dom';
import {
  Compass,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TabItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const TABS: TabItem[] = [
  { to: ROUTES.DASHBOARD, label: 'Home', icon: LayoutDashboard, end: true },
  { to: ROUTES.DISCOVER, label: 'Discover', icon: Compass },
  { to: ROUTES.PROPOSALS, label: 'Invites', icon: Inbox },
  { to: ROUTES.MESSAGES, label: 'Chat', icon: MessageSquare },
  { to: ROUTES.PROFILE, label: 'Profile', icon: UserRound },
];

/**
 * Mobile bottom tab bar — primary destinations always one thumb-tap away on
 * phones. Hidden on `md+` where the sidebar takes over.
 */
export function MobileTabBar() {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-deep)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors duration-200',
                isActive
                  ? 'text-[var(--accent-400)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200',
                    isActive && 'bg-[var(--accent-400)]/12'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
