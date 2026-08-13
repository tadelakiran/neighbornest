import { useNavigate } from 'react-router-dom';
import { Compass, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { DarkModeToggle } from '@/components/ui/DarkModeToggle';
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
        'border-b border-white/[0.06]',
        'bg-void/60 backdrop-blur-2xl',
        'supports-[backdrop-filter]:bg-void/50',
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
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-surface-2 text-secondary transition-colors hover:border-accent-400/30 hover:text-primary lg:hidden"
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
          <DarkModeToggle />

          {user ? (
            <div className="flex items-center gap-2 pl-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-surface-2 py-1 pl-1 pr-3 transition-all duration-200 hover:border-accent-400/25 hover:shadow-[0_0_16px_rgba(14,165,233,0.08)]"
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-surface-2 text-secondary transition-all duration-200 hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-400"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </motion.button>
            </div>
          ) : (
            <span className="rounded-xl border border-white/[0.08] bg-surface-2 px-3 py-1.5 text-xs font-medium text-secondary">
              Guest
            </span>
          )}
        </div>
      </div>
    </header>
  );
}