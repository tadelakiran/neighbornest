import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { VALUE_QUESTIONS } from '@/lib/onboarding';
import type { UserProfile } from '@/types/user.types';

interface ReadinessChartsProps {
  profile: UserProfile;
  readiness: number;
}

/** Radius/geometry for the donut. */
const R = 42;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Dashboard charts — pure SVG, zero chart dependencies:
 * a "Nest readiness" donut plus per-value rating bars from onboarding answers.
 */
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
        <h3 className="self-start text-sm font-semibold uppercase tracking-wide text-slate-300">
          Nest readiness
        </h3>
        <div className="relative h-36 w-36" role="img" aria-label={`Profile readiness ${readiness}%`}>
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" strokeWidth="10" className="stroke-slate-800" />
            <motion.circle
              cx="50"
              cy="50"
              r={R}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className="stroke-emerald-500"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - readiness / 100) }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-white">{readiness}%</span>
            <span className="text-xs text-slate-500">complete</span>
          </div>
        </div>
        <p className="max-w-[220px] text-xs leading-relaxed text-slate-500">
          {readiness >= 100
            ? 'Perfect — you’re ready for matching!'
            : 'Fill in your profile details to boost your match quality.'}
        </p>
      </Card>

      {/* Values bars */}
      <Card className="p-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wide text-slate-300">
          What shapes you
        </h3>
        <div className="space-y-5">
          {VALUE_QUESTIONS.map((q) => {
            const rating = valueAnswers[q.key] ?? 3;
            const pct = (rating / 5) * 100;
            return (
              <div key={q.key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <span className="text-sm font-medium text-slate-200">{q.label}</span>
                  <span className="text-xs text-slate-500">
                    {rating}<span className="text-slate-600">/5</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          Your ratings feed the compatibility engine — the closer your answers,
          the better we can match you.
        </p>
      </Card>
    </div>
  );
}
