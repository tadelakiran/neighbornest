import { cn } from '@/lib/utils';

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const SIZE_MAP: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border-[1.5px]',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
};

/**
 * Minimal circular spinner using CSS border animation.
 * Uses accent-400 as the active arc — works in both light and dark modes.
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full',
        'border-[var(--color-raised)] border-t-[var(--accent-400)]',
        SIZE_MAP[size],
        className
      )}
    />
  );
}