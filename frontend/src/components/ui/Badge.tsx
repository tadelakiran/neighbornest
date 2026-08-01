import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Semantic badge variants. */
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** Variant-specific classes. */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  danger: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  neutral: 'border-slate-600 bg-slate-700/40 text-slate-300',
};

/**
 * Small status pill used for roles, states, and tags.
 *
 * @param variant - success | warning | danger | info | neutral
 */
export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
