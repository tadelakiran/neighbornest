import { CalendarDays, MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { UserRole } from '@/types/auth.types';
import type { UserProfile } from '@/types/user.types';

const ROLE_BADGE: Record<UserRole, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
  NEWCOMER: { variant: 'neutral',  label: 'Newcomer' },
  ANCHOR:   { variant: 'success',  label: 'Anchor'   },
  ADMIN:    { variant: 'warning',  label: 'Admin'    },
};

interface ProfileHeaderProps {
  profile: UserProfile;
}

/**
 * Sticky profile identity card.
 * Blue gradient cover → overlapping avatar → name, badges, details.
 * Works in both light and dark modes via CSS var tokens.
 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { variant, label } = ROLE_BADGE[profile.role];

  return (
    <Card flat className="sticky top-24 overflow-visible pb-5">
      {/* Cover gradient */}
      <div className="relative -mx-6 -mt-6 mb-0 h-28 overflow-hidden rounded-t-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400" />
        <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at 70% 20%, rgba(219,234,254,0.5) 0%, transparent 55%)' }} />
      </div>

      {/* Overlapping avatar */}
      <div className="-mt-12 flex justify-center">
        <span className="rounded-full p-1.5 bg-[var(--color-bg)] shadow-md">
          <Avatar
            name={profile.fullName}
            src={profile.profilePhotoUrl}
            size="xl"
            className="ring-4 ring-white shadow-lg"
          />
        </span>
      </div>

      <div className="mt-3 text-center">
        <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">{profile.fullName}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge variant={variant}>{label}</Badge>
          {profile.isOnboarded && <Badge variant="success">Onboarded ✓</Badge>}
        </div>
      </div>

      <dl className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-4 text-left">
        <DetailRow
          icon={<MapPin className="h-4 w-4 text-accent-500" />}
          label="City"
          value={profile.city || '—'}
        />
        <DetailRow
          icon={<CalendarDays className="h-4 w-4 text-accent-500" />}
          label="Member since"
          value={formatDate(profile.createdAt)}
        />
      </dl>
    </Card>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}
