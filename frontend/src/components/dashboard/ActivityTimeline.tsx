import { BadgeCheck, CalendarPlus, Home, MapPin, Sparkles, UserRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import type { UserProfile } from '@/types/user.types';

interface ActivityTimelineProps {
  profile: UserProfile;
}

/**
 * Activity timeline: derived from real profile milestones (joined, profile
 * created, onboarding completed) plus upcoming module events.
 */
export function ActivityTimeline({ profile }: ActivityTimelineProps) {
  const items: { icon: typeof Sparkles; label: string; detail: string; time: string; accent: string }[] = [];

  if (profile.createdAt) {
    items.push({
      icon: Sparkles,
      label: 'Joined NeighborNest',
      detail: 'Welcome to the community!',
      time: formatDate(profile.createdAt),
      accent: 'bg-emerald-500/15 text-emerald-400',
    });
  }

  if (profile.city) {
    items.push({
      icon: MapPin,
      label: `Profile created · ${profile.city}`,
      detail: profile.neighborhood ? `Based in ${profile.neighborhood}` : 'City added',
      time: profile.updatedAt ? formatDate(profile.updatedAt) : '—',
      accent: 'bg-sky-500/15 text-sky-400',
    });
  }

  if (profile.isOnboarded) {
    items.push({
      icon: BadgeCheck,
      label: 'Onboarding completed',
      detail: 'Your profile is ready for matching',
      time: profile.updatedAt ? formatDate(profile.updatedAt) : '—',
      accent: 'bg-emerald-500/15 text-emerald-400',
    });
  }

  if (profile.role === 'ANCHOR') {
    items.push({
      icon: Home,
      label: 'Became a local Anchor',
      detail: 'Helping newcomers feel at home',
      time: '—',
      accent: 'bg-amber-500/15 text-amber-400',
    });
  }

  // Upcoming module previews keep the timeline alive before Modules 3-5 land.
  items.push({
    icon: CalendarPlus,
    label: 'Nest matching — coming soon',
    detail: 'We’re pairing compatible neighbors in your city',
    time: 'Next',
    accent: 'bg-violet-500/15 text-violet-400',
  });

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <UserRound className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Your journey</h3>
      </div>

      <ol className="relative space-y-6 border-l border-slate-800 pl-6">
        {items.map(({ icon: Icon, label, detail, time, accent }) => (
          <li key={label} className="relative">
            <span
              className={`absolute -left-[38px] flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 ${accent}`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-sm font-semibold text-slate-100">{label}</p>
              <span className="text-xs text-slate-500">{time}</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{detail}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
