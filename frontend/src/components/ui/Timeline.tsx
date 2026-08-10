import { motion } from 'framer-motion';
import { Check, Circle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A single timeline step. */
export interface TimelineStep {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
  icon?: LucideIcon;
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

/**
 * Reusable vertical timeline. Completed steps show a check in an accent circle
 * with a glowing connecting line that draws itself (scaleY) on mount; the
 * current step pulses; future steps use muted dashed connectors.
 */
export function Timeline({ steps, className }: TimelineProps) {
  return (
    <ol className={cn('w-full', className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const Icon = step.icon ?? Circle;
        return (
          <li key={step.id} className="relative flex gap-3.5 pb-7 last:pb-0">
            {/* Connector — draws top-down once the page loads */}
            {!isLast && (
              <motion.div
                aria-hidden="true"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'top' }}
                className={cn(
                  'absolute left-[17px] top-10 h-[calc(100%-2.5rem)] w-0.5 rounded-full',
                  step.status === 'completed'
                    ? 'bg-accent-gradient shadow-[0_0_8px_rgba(14,165,233,0.5)]'
                    : 'border-l-2 border-dashed border-white/10'
                )}
              />
            )}

            {/* Node */}
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={cn(
                'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors',
                step.status === 'completed' && 'border-accent-400/40 bg-accent-500/15 text-accent-300 shadow-glow-sm',
                step.status === 'current' && 'border-accent-400/60 bg-accent-500/25 text-accent-200 shadow-glow',
                step.status === 'upcoming' && 'border-white/10 bg-deep text-muted'
              )}
            >
              {step.status === 'completed' ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Icon className="h-4 w-4" aria-hidden="true" />
              )}
              {step.status === 'current' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -m-1.5 animate-ping rounded-full bg-accent-400/20"
                  style={{ animationDuration: '2s' }}
                />
              )}
            </motion.span>

            {/* Copy */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.1, duration: 0.3 }}
              className="min-w-0 pt-1"
            >
              <p
                className={cn(
                  'text-sm font-semibold transition-colors',
                  step.status === 'completed' && 'text-accent-300',
                  step.status === 'current' && 'text-primary',
                  step.status === 'upcoming' && 'text-muted'
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="mt-0.5 text-xs text-muted">{step.description}</p>
              )}
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}
