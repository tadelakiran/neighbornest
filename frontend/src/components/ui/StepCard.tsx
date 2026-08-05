import { motion } from 'framer-motion';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepCardProps {
  icon:         LucideIcon;
  title:        string;
  description?: string;
  selected:     boolean;
  onClick?:     () => void;
  disabled?:    boolean;
  className?:   string;
}

/**
 * Large selectable card for personality/work-type pickers.
 * Selected: accent border + soft blue fill.
 * Unselected: surface card with hover lift.
 * Works in both light (white surface) and dark (navy surface) modes.
 */
export function StepCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
  disabled,
  className,
}: StepCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex w-full flex-col items-center gap-3 rounded-lg border p-5 text-center transition-all duration-300',
        selected
          ? 'border-accent-500 bg-accent-50 shadow-glow-sm [data-theme="dark"]:bg-accent-900/20'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-accent-300 hover:shadow-md',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white shadow-sm"
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      )}

      <motion.span
        animate={{ scale: selected ? 1.12 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-md transition-colors duration-300',
          selected
            ? 'bg-accent-100 text-accent-600'
            : 'bg-[var(--color-surface-2)] text-[var(--text-muted)]'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </motion.span>

      <span className="flex flex-col items-center">
        <span className={cn(
          'block text-sm font-semibold',
          selected ? 'text-accent-700' : 'text-[var(--text-primary)]'
        )}>
          {title}
        </span>
        {description && (
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{description}</span>
        )}
      </span>
    </motion.button>
  );
}
