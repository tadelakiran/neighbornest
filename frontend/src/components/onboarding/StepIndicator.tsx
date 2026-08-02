import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ONBOARDING_STEP_LABELS } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  current: number;
}

/**
 * Onboarding stepper: an animated emerald progress bar plus one dot per step.
 * Completed steps show a checkmark, the current step is highlighted, and
 * labels collapse into dots on mobile.
 */
export function StepIndicator({ current }: StepIndicatorProps) {
  const total = ONBOARDING_STEP_LABELS.length;
  const progress = (current / (total - 1)) * 100;

  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800" aria-hidden="true">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        />
      </div>

      {/* Step dots + labels */}
      <ol className="mt-4 flex items-center justify-between">
        {ONBOARDING_STEP_LABELS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
              <motion.span
                animate={{ scale: active ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors duration-200',
                  done
                    ? 'bg-emerald-500 text-emerald-950'
                    : active
                      ? 'border-2 border-emerald-400 bg-slate-800 text-emerald-300'
                      : 'border border-slate-700 bg-slate-800 text-slate-500'
                )}
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
              </motion.span>
              <span
                className={cn(
                  'hidden text-[11px] font-medium sm:block',
                  active ? 'text-emerald-300' : done ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
