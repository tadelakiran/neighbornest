import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Extra sizing/rounding classes, e.g. "h-4 w-24" or "rounded-full". */
  className?: string;
}

/**
 * Shimmering placeholder block used in loading skeletons so content areas
 * never flash a bare spinner. Compose several with size classes.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-slate-800/80', className)}
      aria-hidden="true"
      {...props}
    />
  );
}
