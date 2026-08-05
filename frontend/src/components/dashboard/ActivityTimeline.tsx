import { BadgeCheck, CalendarPlus, Home, MapPin, Sparkles, UserRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { UserProfile } from '@/types/user.types';

interface ActivityTimelineProps {
  profile: UserProfile;
}

export function ActivityTimeline({ profile }: ActivityTimelineProps) {
  const items: {
    icon:   typeof Sparkles;
    label:  string;
    detail: string;
    time:   string;
    iconBg: string;
  }[] = [];

  if (profile.createdAt) {
    items.push({
      icon:   Sparkles,
      label:  'Joined NeighborNest',
      detail: 'Welcome to the community!',
      time:   formatDate(profile.createdAt),
      iconBg: 'bg-accent-100 text-accent-600',
    });
  }

  if (profile.city) {
    items.push({
      icon:   MapPin,
      label:  `Profile created · ${profile.city}`,
      detail: profile.neighborhood ? `Based in ${profile.neighborhood}` : 'City added',
      time:   profile.updatedAt ? formatDate(profile.updatedAt) : '—',
      iconBg: 'bg-blue-100 text-blue-500',
    });
  }

  if (profile.isOnboarded) {
    items.push({
      icon:   BadgeCheck,
      label:  'Onboarding completed',
      detail: 'Your profile is ready for matching',
      time:   profile.updatedAt ? formatDate(profile.updatedAt) : '—',
      iconBg: 'bg-accent-100 text-accent-600',
    });
  }

  if (profile.role === 'ANCHOR') {
    items.push({
      icon:   Home,
      label:  'Became a local Anchor',
      detail: 'Helping newcomers feel at home',
      time:   '—',
      iconBg: 'bg-amber-100 text-amber-600',
    });
  }

  items.push({
    icon:   CalendarPlus,
    label:  'Nest matching — coming soon',
    detail: "We're pairing compatible neighbors in your city",
    time:   'Next',
    iconBg: 'bg-violet-100 text-violet-600',
  });

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <UserRound className="h-4 w-4 text-accent-500" aria-hidden="true" />
        <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Your journey
        </h3>
      </div>

      <ol className="relative space-y-6 border-l-2 border-[var(--color-border)] pl-6">
        {items.map(({ icon: Icon, label, detail, time, iconBg }) => (
          <li key={label} className="relative">
            <span
              className={`absolute -left-[37px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--color-bg)] shadow-sm ${iconBg}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
              <span className="text-xs text-[var(--text-muted)]">{time}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">{detail}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
