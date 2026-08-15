import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STRENGTH_CHECKS = [
  { label: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Number', test: (v: string) => /\d/.test(v) },
  { label: 'Special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
  { label: '8+ characters', test: (v: string) => v.length >= 8 },
];

const STRENGTH_CONFIG = {
  weak: { label: 'Weak', text: 'text-royal-400', bar: 'bg-royal-400', glow: 'shadow-[0_0_8px_rgba(96,165,250,0.4)]' },
  good: { label: 'Good', text: 'text-sky-400', bar: 'bg-sky-400', glow: 'shadow-[0_0_8px_rgba(56,189,248,0.4)]' },
  strong: { label: 'Strong', text: 'text-sky-300', bar: 'bg-sky-300', glow: 'shadow-[0_0_8px_rgba(125,211,252,0.4)]' },
};

interface PasswordStrengthMeterProps {
  password: string;
}

/**
 * Live password strength feedback: a five-segment bar plus the individual
 * rule checklist. Shared by the registration and password-reset flows so the
 * password guidance is identical everywhere.
 */
export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = useMemo(
    () => STRENGTH_CHECKS.filter((c) => c.test(password)).length,
    [password]
  );
  const currentStrength =
    strength <= 2 ? STRENGTH_CONFIG.weak : strength <= 4 ? STRENGTH_CONFIG.good : STRENGTH_CONFIG.strong;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-raised)]/40 px-3.5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Password strength</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={currentStrength.label}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className={cn('text-[11px] font-bold uppercase tracking-wider', currentStrength.text)}
          >
            {currentStrength.label}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="mb-2.5 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{
              backgroundColor: i < strength ? undefined : 'rgba(255,255,255,0.08)',
              scale: i < strength ? [1, 1.15, 1] : 1,
            }}
            transition={{ duration: 0.3 }}
            className={cn('h-1.5 flex-1 rounded-full', i < strength ? currentStrength.bar : 'bg-[var(--color-border)]', i < strength ? currentStrength.glow : '')}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {STRENGTH_CHECKS.map(({ label, test }) => {
          const passed = test(password);
          return (
            <div key={label} className="flex items-center gap-1.5">
              <span
                className={cn(
                  'flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-all duration-200',
                  passed ? 'border-sky-400/40 bg-sky-400/15' : 'border-[var(--color-border)] bg-transparent'
                )}
              >
                <Check className={cn('h-2.5 w-2.5 transition-all duration-200', passed ? 'text-sky-400 opacity-100' : 'opacity-0')} />
              </span>
              <span className={cn('text-[11px] transition-colors duration-200', passed ? 'text-sky-400/80' : 'text-muted')}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PasswordStrengthMeter;
