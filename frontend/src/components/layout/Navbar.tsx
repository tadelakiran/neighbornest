import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Bird, ChevronDown, LogOut, Menu, Settings, User as UserIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';

interface NavbarProps {
  /** Opens the mobile sidebar drawer. */
  onMenuClick: () => void;
}

/** Brand logo — icon tile + wordmark. */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to={ROUTES.DASHBOARD} className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
        <Bird className="h-5 w-5 text-emerald-950" aria-hidden="true" />
      </span>
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-white">
          Neighbor<span className="text-emerald-400">Nest</span>
        </span>
      )}
    </Link>
  );
}

/**
 * Top navigation bar: hamburger (mobile), brand logo, notification bell,
 * and a user avatar dropdown with Profile / Settings / Logout actions.
 */
export function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
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

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Notification bell */}
          <button
            type="button"
            onClick={() => toast.info('No new notifications.')}
            className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-800"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar name={userLabel} src={user?.profilePhotoUrl} size="sm" />
              <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-200 sm:block">
                {userLabel}
              </span>
              <ChevronDown
                className={`hidden h-4 w-4 text-slate-500 transition-transform sm:block ${
                  menuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="animate-slide-up absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl shadow-black/40"
              >
                <div className="border-b border-slate-700/70 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-white">{userLabel}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email ?? '—'}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(ROUTES.PROFILE);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-700/60"
                >
                  <UserIcon className="h-4 w-4 text-slate-400" /> Profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSettings}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-700/60"
                >
                  <Settings className="h-4 w-4 text-slate-400" /> Settings
                </button>
                <div className="border-t border-slate-700/70 p-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    leftIcon={<LogOut className="h-4 w-4 text-rose-400" />}
                    onClick={handleLogout}
                    className="justify-start text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
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
}
