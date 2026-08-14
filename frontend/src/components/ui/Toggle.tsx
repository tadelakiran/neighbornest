import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}

/**
 * Toggle switch — accent blue when on, neutral surface when off.
 * Spring-animated knob, works in both light and dark modes.
 */
export function Toggle({ checked, onChange, label, description, id, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between gap-4 py-3 text-left',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span>
        )}
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked
            ? 'bg-[var(--accent-500)]'
            : 'bg-[var(--color-surface-2)] border border-[var(--color-border)]'
        )}
      >
        <motion.span
          className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-[var(--shadow-sm)]"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </span>
    </button>
  );
}