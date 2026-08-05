import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LayoutDashboard, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface NavbarProps {
  onMenuClick: () => void;
}

/** Geometric nest mark */
export function NestMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative inline-flex items-center justify-center', className)}>
      <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
        <path d="M16 5 L27 25 H5 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 13 L23 25 H9 Z" fill="currentColor" opacity="0.3" />
        <path d="M16 19 L19 25 H13 Z" fill="currentColor" />
        <circle cx="16" cy="5" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Brand wordmark + logo */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to={ROUTES.DASHBOARD} className="group flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-500 text-white shadow-md transition-all duration-200 group-hover:bg-accent-600 group-hover:shadow-glow">
        <NestMark className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">
          Neighbor<span className="text-accent-600">Nest</span>
        </span>
      )}
    </Link>
  );
}

const PILL_LINKS = [
  { label: 'Dashboard', to: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'My Nest',   to: ROUTES.MY_NEST },
  { label: 'Messages',  to: ROUTES.MESSAGES },
];

/**
 * Top navigation bar — white/light in light mode, dark navy in dark mode.
 * Includes: brand logo, pill nav (desktop), notification bell, dark mode toggle, user dropdown.
 */
export const Navbar = memo(function Navbar({ onMenuClick }: NavbarProps) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const toast     = useToast();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  const handleLogout = useCallback(() => {
    setMenuOpen(false);
    void logout();
  }, [logout]);

  const handleSettings = useCallback(() => {
    setMenuOpen(false);
    navigate(`${ROUTES.PROFILE}?tab=settings`);
  }, [navigate]);

  const userLabel = user?.fullName ?? 'My Account';
  const isActive  = (to: string) => location.pathname === to;

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-xl theme-transition shadow-sm">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--text-primary)] lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <BrandLogo />
        </div>

        {/* Center: pill nav (desktop) */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] p-1 lg:flex"
        >
          {PILL_LINKS.map(({ label, to }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--text-primary)]'
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right: bell + dark mode + avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">

          {/* Notification bell */}
          <button
            type="button"
            onClick={() => toast.info('No new notifications.')}
            className="relative rounded-md p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--text-primary)]"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500 ring-2 ring-[var(--color-bg)]" />
            </span>
          </button>

          {/* Dark mode toggle */}
          <DarkModeToggle variant="icon" />

          {/* User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full p-1 pr-2 transition-all duration-200 hover:bg-[var(--color-surface)]"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="rounded-full ring-2 ring-accent-400/60 shadow-sm">
                <Avatar name={userLabel} src={user?.profilePhotoUrl} size="sm" />
              </span>
              <span className="hidden max-w-[8rem] truncate text-sm font-medium text-[var(--text-primary)] sm:block">
                {userLabel}
              </span>
              <ChevronDown
                className={cn(
                  'hidden h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 sm:block',
                  menuOpen && 'rotate-180'
                )}
                aria-hidden="true"
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="animate-scale-in absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg"
              >
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{userLabel}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{user?.email ?? '—'}</p>
                </div>
                {[
                  { icon: UserIcon, label: 'Profile',  action: () => { setMenuOpen(false); navigate(ROUTES.PROFILE); } },
                  { icon: Settings, label: 'Settings', action: handleSettings },
                ].map(({ icon: Icon, label, action }) => (
                  <button
                    key={label}
                    type="button"
                    role="menuitem"
                    onClick={action}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--text-primary)]"
                  >
                    <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                    {label}
                  </button>
                ))}
                <div className="border-t border-[var(--color-border)] p-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    leftIcon={<LogOut className="h-4 w-4 text-rose-500" />}
                    onClick={handleLogout}
                    className="justify-start text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Log out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
