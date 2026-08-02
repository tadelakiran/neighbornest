import { CalendarDays, MapPin } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { UserRole } from '@/types/auth.types';
import type { UserProfile } from '@/types/user.types';

/** Role badge styling — color-coded per the design spec. */
const ROLE_BADGE: Record<UserRole, { variant: 'success' | 'warning' | 'neutral'; label: string }> = {
  NEWCOMER: { variant: 'neutral', label: 'Newcomer' },
  ANCHOR: { variant: 'success', label: 'Anchor' },
  ADMIN: { variant: 'warning', label: 'Admin' },
};

interface ProfileHeaderProps {
  profile: UserProfile;
}

/**
 * Left-column sticky identity card: large avatar, name, color-coded role badge,
 * city, and member-since date.
 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { variant, label } = ROLE_BADGE[profile.role];

  return (
    <Card className="sticky top-24 flex flex-col items-center gap-4 p-6 text-center">
      <Avatar
        name={profile.fullName}
        src={profile.profilePhotoUrl}
        size="lg"
        className="h-24 w-24 text-3xl"
      />
      <div>
        <h2 className="text-xl font-bold text-white">{profile.fullName}</h2>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge variant={variant}>{label}</Badge>
          {profile.isOnboarded && <Badge variant="success">Onboarded</Badge>}
        </div>
      </div>

      <dl className="w-full space-y-3 border-t border-slate-700/60 pt-4 text-left">
        <DetailRow icon={<MapPin className="h-4 w-4 text-emerald-400" />} label="City" value={profile.city || '—'} />
        <DetailRow icon={<CalendarDays className="h-4 w-4 text-emerald-400" />} label="Member since" value={formatDate(profile.createdAt)} />
      </dl>
    </Card>
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

/** Small icon + label/value pair inside the header card. */
function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="truncate text-sm font-medium text-slate-200">{value}</p>
      </div>
    </div>
  );
}
