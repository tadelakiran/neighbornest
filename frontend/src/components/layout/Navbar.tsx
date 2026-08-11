import { useNavigate } from 'react-router-dom';
import { Bell, Compass, LogOut, Menu } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';

interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

/**
 * Top app bar — Blue Dynasty glass navbar. Shows the brand, a notifications
 * bell, theme toggle, the current user's avatar chip (links to Profile), and
 * a logout action. Mobile hamburger is visible below lg.
 */
export function Navbar({ onMenuClick, className = '' }: NavbarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Member';

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-void/70 backdrop-blur-xl ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        {/* Left: hamburger + brand */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-secondary transition-colors hover:text-primary lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="flex items-center gap-2.5"
            aria-label="Go to dashboard"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-gradient shadow-glow-sm">
              <Compass className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="hidden font-display text-base font-bold tracking-tight text-primary sm:block">
              Neighbor<span className="text-gradient">Nest</span>
            </span>
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-secondary transition-colors hover:text-primary"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(14,165,233,0.8)]" aria-hidden="true" />
          </button>

          <DarkModeToggle />

          {user ? (
            <div className="flex items-center gap-2 pl-2">
              <button
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 pl-1 pr-3 transition-colors hover:border-accent-400/30"
                aria-label={`Open profile of ${user.fullName}`}
              >
                <Avatar name={user.fullName} src={user.profilePhotoUrl} size="sm" />
                <span className="hidden text-left md:block">
                  <span className="block text-xs font-semibold leading-tight text-primary">{firstName}</span>
                  <span className="block text-[10px] capitalize leading-tight text-muted">
                    {user.role?.toLowerCase() ?? 'member'}
                  </span>
                </span>
              </button>

              <button
                onClick={() => void logout()}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-secondary transition-colors hover:border-rose-400/30 hover:text-rose-400"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          ) : (
            <span className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-secondary">
              Guest
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
