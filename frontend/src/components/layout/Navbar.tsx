import { useNavigate } from 'react-router-dom';
import { Compass, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Navbar({ onMenuClick, className = '' }: NavbarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Member';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        'border-b border-[var(--color-border)]',
        'bg-[var(--color-bg)]/70 backdrop-blur-2xl',
        'supports-[backdrop-filter]:bg-[var(--color-bg)]/60',
        className
      )}
    >
      {/* Subtle top glow line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-400/30 to-transparent" aria-hidden="true" />

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-8">
        {/* Left */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onMenuClick}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-400)]/30 hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
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
          </motion.button>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          {user ? <NotificationPanel /> : null}

          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 pl-1 pr-3 transition-all duration-200 hover:border-[var(--accent-400)]/25 hover:shadow-[var(--shadow-card-hover)]"
                aria-label={`Open profile of ${user.fullName}`}
              >
                <Avatar name={user.fullName} src={user.profilePhotoUrl} size="sm" />
                <span className="hidden text-left md:block">
                  <span className="block text-xs font-semibold leading-tight text-primary">
                    {firstName}
                  </span>
                  <span className="block text-[10px] capitalize leading-tight text-muted">
                    {user.role?.toLowerCase() ?? 'member'}
                  </span>
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => void logout()}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--error)]/30 hover:bg-[var(--error)]/10 hover:text-[var(--error)]"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </motion.button>
            </div>
          ) : (
            <span className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
              Guest
            </span>
          )}
        </div>
      </div>
    </header>
  );
}