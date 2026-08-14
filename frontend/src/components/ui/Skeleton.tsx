import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

/**
 * Shimmer skeleton placeholder. Uses CSS-var surfaces so it looks correct
 * in both light (light blue tint) and dark (dark navy) modes.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-shimmer animate-pulse', className)}
    />
  );
}