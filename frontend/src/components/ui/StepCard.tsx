import { motion } from 'framer-motion';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  selected: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Large selectable card used for personality and work-type pickers.
 * Selected state: emerald border + glow shadow + animated checkmark.
 * Hover lifts the card; tapping scales it down slightly.
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
      transition={{ duration: 0.2 }}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative flex w-full flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-colors duration-200',
        selected
          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
          : 'border-slate-700 bg-slate-800/60 hover:border-slate-600',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 22 }}
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-emerald-950"
          aria-hidden="true"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      )}

      <span
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
          selected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-900 text-slate-400'
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <span>
        <span className={cn('block text-sm font-semibold', selected ? 'text-emerald-200' : 'text-slate-100')}>
          {title}
        </span>
        {description && <span className="mt-0.5 block text-xs text-slate-400">{description}</span>}
      </span>
    </motion.button>
  );
}
