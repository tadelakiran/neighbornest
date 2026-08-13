import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const VARIANTS: Record<BadgeVariant, string> = {
  primary:
    'bg-accent-gradient text-white border-transparent shadow-glow-sm',
  success:
    'border-emerald-400/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.1)]',
  info:
    'border-accent-400/25 bg-accent-400/10 text-accent-300 shadow-[0_0_12px_rgba(14,165,233,0.1)]',
  warning:
    'border-amber-400/25 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.1)]',
  danger:
    'border-rose-400/25 bg-rose-400/10 text-rose-300 shadow-[0_0_12px_rgba(251,113,133,0.1)]',
  neutral:
    'border-white/[0.08] bg-surface-2 text-secondary',
};

export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}