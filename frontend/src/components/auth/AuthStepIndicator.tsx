import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthStepIndicatorProps {
  steps: readonly string[];
  /** Zero-based index of the active step. */
  current: number;
}

/**
 * Compact horizontal step indicator for the multi-step auth flows
 * (registration with email verification, password reset).
 * Completed steps show a check; the active step is accent-highlighted.
 */
export function AuthStepIndicator({ steps, current }: AuthStepIndicatorProps) {
  return (
    <ol className="mb-8 flex items-center justify-center gap-2" aria-label="Progress">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300',
                  active && 'bg-accent-gradient text-white shadow-glow-sm',
                  done && 'border border-[var(--success)]/40 bg-[var(--success)]/15 text-[var(--success)]',
                  !active && !done && 'border border-[var(--color-border)] text-[var(--text-muted)]'
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs font-semibold transition-colors duration-300',
                  active ? 'text-[var(--text-primary)]' : done ? 'text-[var(--success)]/80' : 'text-[var(--text-muted)]'
                )}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && <span aria-hidden="true" className="mx-1 h-px w-6 bg-[var(--color-border)] sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}

export default AuthStepIndicator;
