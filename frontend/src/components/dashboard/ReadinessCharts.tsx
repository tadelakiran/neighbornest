import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { VALUE_QUESTIONS } from '@/lib/onboarding';
import type { UserProfile } from '@/types/user.types';

interface ReadinessChartsProps {
  profile:   UserProfile;
  readiness: number;
}

const R             = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function ReadinessCharts({ profile, readiness }: ReadinessChartsProps) {
  const answers = profile.onboardingAnswers ?? [];
  const valueAnswers = Object.fromEntries(
    answers
      .filter((a) => a.questionKey.startsWith('values_'))
      .map((a) => [a.questionKey, Number(a.answerValue) || 3])
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">

      {/* Readiness donut */}
      <Card className="flex flex-col items-center gap-4 p-6 text-center">
        <h3 className="self-start text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Nest readiness
        </h3>
        <div className="relative h-36 w-36" role="img" aria-label={`Profile readiness ${readiness}%`}>
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <defs>
              <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
            </defs>
            <circle
              cx="50" cy="50" r={R}
              fill="none" strokeWidth="10"
              style={{ stroke: 'var(--color-border)' }}
            />
            <motion.circle
              cx="50" cy="50" r={R}
              fill="none" strokeWidth="10" strokeLinecap="round"
              stroke="url(#rg)"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - readiness / 100) }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.4))' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-bold text-[var(--text-primary)]">{readiness}%</span>
            <span className="text-xs text-[var(--text-muted)]">complete</span>
          </div>
        </div>
        <p className="max-w-[220px] text-xs leading-relaxed text-[var(--text-muted)]">
          {readiness >= 100
            ? "Perfect \u2014 you're ready for matching!"
            : 'Fill in your profile details to boost your match quality.'}
        </p>
      </Card>

      {/* Values bars */}
      <Card className="p-6">
        <h3 className="mb-5 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          What shapes you
        </h3>
        <div className="space-y-5">
          {VALUE_QUESTIONS.map((q) => {
            const rating = valueAnswers[q.key] ?? 3;
            const pct    = (rating / 5) * 100;
            return (
              <div key={q.key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{q.label}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {rating}<span className="opacity-50">/5</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-[var(--text-muted)]">
          Your ratings feed the compatibility engine — the closer your answers, the better we can match you.
        </p>
      </Card>

    </div>
  );
}
