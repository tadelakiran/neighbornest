import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Shield, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/auth.types';
import type { UserProfile } from '@/types/user.types';

const ROLE_META: Record<UserRole, { variant: 'success' | 'warning' | 'neutral'; label: string; icon: LucideIcon; accent: string }> = {
  NEWCOMER: { variant: 'neutral', label: 'Newcomer', icon: MapPin, accent: 'text-muted' },
  ANCHOR:   { variant: 'success', label: 'Anchor',   icon: Shield, accent: 'text-emerald-400' },
  ADMIN:    { variant: 'warning', label: 'Admin',    icon: Shield, accent: 'text-amber-400' },
};

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const meta = ROLE_META[profile.role];

  return (
    <Card flat className="sticky top-24 overflow-visible pb-6">
      {/* Cover gradient */}
      <div className="relative -mx-6 -mt-6 mb-0 h-32 overflow-hidden rounded-t-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400" />
        <div
          className="absolute inset-0 opacity-50"
          style={{ background: 'radial-gradient(circle at 75% 15%, rgba(125,211,252,0.4) 0%, transparent 60%)' }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at 20% 80%, rgba(251,191,36,0.3) 0%, transparent 50%)' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-deep to-transparent" />
      </div>

      {/* Avatar */}
      <div className="-mt-14 flex justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative rounded-full p-[3px] bg-deep shadow-2xl"
        >
          <div className="absolute -inset-1 rounded-full bg-accent-400/20 blur-lg" aria-hidden="true" />
          <Avatar
  name={profile.fullName}
  src={profile.profilePhotoUrl}
  size="xl"
  className="relative h-20 w-20 ring-[3px] ring-deep"
/>
          {profile.role === 'ANCHOR' && (
            <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-deep bg-emerald-500 shadow-lg">
              <Shield className="h-3.5 w-3.5 text-white" aria-hidden="true" />
            </span>
          )}
        </motion.div>
      </div>

      {/* Identity */}
      <div className="mt-4 text-center">
        <h2 className="font-display text-xl font-bold tracking-tight text-primary">
          {profile.fullName}
        </h2>
        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
          <Badge
            variant={meta.variant}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider',
              profile.role === 'ANCHOR' && 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]',
              profile.role === 'ADMIN' && 'border-amber-400/25 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
            )}
          >
            <meta.icon className={cn('h-3 w-3', meta.accent)} aria-hidden="true" />
            {meta.label}
          </Badge>
          {profile.isOnboarded && (
            <Badge
              variant="success"
              className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            >
              Onboarded
            </Badge>
          )}
        </div>
      </div>

      {/* Details */}
      <dl className="mt-6 space-y-2.5 border-t border-white/[0.06] pt-5 text-left">
        <DetailRow
          icon={<MapPin className="h-4 w-4 text-accent-400" />}
          label="City"
          value={profile.city || '—'}
        />
        <DetailRow
          icon={<CalendarDays className="h-4 w-4 text-accent-400" />}
          label="Member since"
          value={formatDate(profile.createdAt)}
        />
      </dl>
    </Card>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.03]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-surface/60">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-primary">{value}</p>
      </div>
    </div>
  );
}