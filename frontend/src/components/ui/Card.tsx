import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** When true (default), applies comfortable internal padding. */
  padded?: boolean;
}

/**
 * Base card container — dark slate surface with a subtle border and shadow.
 * Used for forms, dashboards, and content panels.
 */
export function Card({ padded = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-700/70 bg-slate-800/70 shadow-lg shadow-black/20',
        padded && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
