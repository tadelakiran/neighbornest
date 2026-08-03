import { Building2, MapPin, Sparkles, Tag, UserRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { UserProfile } from '@/types/user.types';

interface StatCardsProps {
  profile: UserProfile;
  readiness: number;
}

/**
 * Computes the profile "readiness" score (0-100) used by the dashboard charts.
 * Each completed dimension adds points — honest numbers, not placeholders.
 */
export function computeReadiness(profile: UserProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.fullName) score += 15;
  if (profile.city) score += 20;
  if (profile.neighborhood) score += 10;
  if (profile.personalityType) score += 15;
  const interests = (profile.onboardingAnswers ?? []).filter((a) => a.questionKey.startsWith('interest_'));
  if (interests.length > 0) score += 15;
  if (profile.workType && profile.schedulePreference && profile.socialGoal && profile.budgetLevel) score += 15;
  if (profile.isOnboarded) score += 10;
  return Math.min(100, score);
}

/** Four stat tiles with real values derived from the profile. */
export function StatCards({ profile, readiness }: StatCardsProps) {
  const interests = (profile.onboardingAnswers ?? []).filter((a) => a.questionKey.startsWith('interest_'));
  const stats = [
    {
      icon: Sparkles,
      label: 'Nest readiness',
      value: `${readiness}%`,
      hint: readiness >= 100 ? 'Ready to match' : `${100 - readiness}% to go`,
      accent: 'from-emerald-400/20 to-teal-500/10 text-emerald-400',
    },
    {
      icon: MapPin,
      label: 'Your city',
      value: profile.city || '—',
      hint: profile.neighborhood || 'Add a neighborhood',
      accent: 'from-sky-400/20 to-blue-500/10 text-sky-400',
    },
    {
      icon: Tag,
      label: 'Interests',
      value: String(interests.length),
      hint: interests.length ? 'shared hobbies' : 'Tag some interests',
      accent: 'from-amber-400/20 to-orange-500/10 text-amber-400',
    },
    {
      icon: profile.role === 'ANCHOR' ? Building2 : UserRound,
      label: 'Your role',
      value: profile.role === 'ANCHOR' ? 'Anchor' : profile.role === 'ADMIN' ? 'Admin' : 'Newcomer',
      hint: profile.isOnboarded ? 'Onboarded' : 'Onboarding pending',
      accent: 'from-violet-400/20 to-purple-500/10 text-violet-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ icon: Icon, label, value, hint, accent }) => (
        <Card key={label} className="group flex items-center gap-4 p-5 transition-colors hover:border-slate-600">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} transition-transform duration-200 group-hover:scale-105`}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-400">{label}</p>
            <p className="truncate text-xl font-bold text-white">{value}</p>
            <p className="truncate text-xs text-slate-500">{hint}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

