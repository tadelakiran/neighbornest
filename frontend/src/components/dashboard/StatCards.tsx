import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';
import { Building2, MapPin, Sparkles, Tag, UserRound } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { UserProfile } from '@/types/user.types';

interface StatCardsProps {
  profile:   UserProfile;
  readiness: number;
}

export function computeReadiness(profile: UserProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.fullName)        score += 15;
  if (profile.city)            score += 20;
  if (profile.neighborhood)    score += 10;
  if (profile.personalityType) score += 15;
  const interests = (profile.onboardingAnswers ?? []).filter((a) =>
    a.questionKey.startsWith('interest_')
  );
  if (interests.length > 0)   score += 15;
  if (
    profile.workType &&
    profile.schedulePreference &&
    profile.socialGoal &&
    profile.budgetLevel
  ) score += 15;
  if (profile.isOnboarded)    score += 10;
  return Math.min(100, score);
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref    = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix]);

  return <span ref={ref}>{value}{suffix}</span>;
}

export function StatCards({ profile, readiness }: StatCardsProps) {
  const interests = (profile.onboardingAnswers ?? []).filter((a) =>
    a.questionKey.startsWith('interest_')
  );

  const stats = [
    {
      icon:     Sparkles,
      label:    'Nest readiness',
      numeric:  readiness,
      suffix:   '%',
      fallback: '',
      hint:     readiness >= 100 ? 'Ready to match' : `${100 - readiness}% to go`,
      iconBg:   'bg-accent-100 text-accent-600',
    },
    {
      icon:     MapPin,
      label:    'Your city',
      numeric:  null as null,
      suffix:   '',
      fallback: profile.city || '—',
      hint:     profile.neighborhood || 'Add a neighborhood',
      iconBg:   'bg-blue-100 text-blue-600',
    },
    {
      icon:     Tag,
      label:    'Interests',
      numeric:  interests.length,
      suffix:   '',
      fallback: '',
      hint:     interests.length ? 'shared hobbies' : 'Tag some interests',
      iconBg:   'bg-amber-100 text-amber-600',
    },
    {
      icon:     profile.role === 'ANCHOR' ? Building2 : UserRound,
      label:    'Your role',
      numeric:  null as null,
      suffix:   '',
      fallback: profile.role === 'ANCHOR' ? 'Anchor' : profile.role === 'ADMIN' ? 'Admin' : 'Newcomer',
      hint:     profile.isOnboarded ? 'Onboarded ✓' : 'Onboarding pending',
      iconBg:   'bg-violet-100 text-violet-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ icon: Icon, label, numeric, suffix, fallback, hint, iconBg }) => (
        <Card key={label} className="flex items-center gap-4 p-5">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg} shadow-sm transition-transform duration-200 group-hover/card:scale-105`}>
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-[var(--text-muted)]">{label}</p>
            <p className="truncate font-display text-xl font-bold text-[var(--text-primary)]">
              {numeric !== null
                ? <AnimatedNumber value={numeric} suffix={suffix} />
                : fallback}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">{hint}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
