import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ONBOARDING_STEP_LABELS } from '@/lib/onboarding';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  current: number;
}

/**
 * Onboarding stepper.
 * Desktop: vertical timeline with filled accent dots and a progressing line.
 * Mobile: slim top progress bar.
 * Works in both light and dark modes via CSS variables.
 */
export function StepIndicator({ current }: StepIndicatorProps) {
  const total    = ONBOARDING_STEP_LABELS.length;
  const progress = (current / (total - 1)) * 100;

  return (
    <div className="w-full">
      {/* ---- Mobile: top progress bar ---- */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)] md:hidden"
        aria-hidden="true"
      >
        <motion.div
          className="h-full rounded-full bg-accent-gradient"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 28 }}
        />
      </div>

      {/* ---- Desktop: vertical glowing timeline ---- */}
      <ol className="relative hidden md:block" aria-label="Onboarding steps">
        {/* Track line */}
        <div
          className="absolute bottom-3 left-[11px] top-3 w-px bg-[var(--color-border)]"
          aria-hidden="true"
        />
        {/* Filled progress line */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-3 left-[11px] top-3 w-px origin-top bg-accent-gradient"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: progress / 100 }}
          transition={{ type: 'spring', stiffness: 120, damping: 24 }}
        />

        {ONBOARDING_STEP_LABELS.map((label, index) => {
          const done   = index < current;
          const active = index === current;

          return (
            <li key={label} className="relative flex items-start gap-4 py-3.5 pl-0" aria-current={active ? 'step' : undefined}>
              {/* Step dot */}
              <span className="relative z-10 flex w-[23px] shrink-0 justify-center">
                <motion.span
                  animate={{ scale: active ? 1.25 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300',
                    done
                      ? 'bg-accent-500 text-white shadow-glow-sm'
                      : active
                        ? 'border-2 border-accent-500 bg-[var(--color-bg)] text-accent-600 shadow-glow-sm'
                        : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-subtle)]'
                  )}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
                </motion.span>
              </span>

              {/* Label */}
              <span className="flex flex-col gap-0.5 pt-0.5">
                <span className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  active
                    ? 'text-accent-600'
                    : done
                      ? 'text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                )}>
                  {label}
                </span>
                {active && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-[var(--text-subtle)]"
                  >
                    In progress
                  </motion.span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
