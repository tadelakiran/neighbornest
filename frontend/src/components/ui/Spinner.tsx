import { cn } from '@/lib/utils';

/** Available spinner sizes. */
type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  /** Extra classes — e.g. to override the color via `text-emerald-400`. */
  className?: string;
}

/** Pixel classes for each spinner size. */
const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

/**
 * SVG loading spinner with an emerald accent.
 *
 * @param size - sm | md | lg
 * @param className - optional additional classes (color overrides supported)
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-emerald-500', SIZE_CLASSES[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      data-testid="spinner"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
