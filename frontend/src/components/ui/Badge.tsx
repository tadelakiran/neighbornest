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
    'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)] shadow-[var(--success-glow)]',
  info:
    'border-[var(--accent-400)]/30 bg-[var(--accent-400)]/10 text-[var(--accent-600)] shadow-[var(--shadow-glow-sm)]',
  warning:
    'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)] shadow-[var(--warning-glow)]',
  danger:
    'border-[var(--error)]/30 bg-[var(--error)]/10 text-[var(--error)] shadow-[var(--error-glow)]',
  neutral:
    'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-secondary)]',
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