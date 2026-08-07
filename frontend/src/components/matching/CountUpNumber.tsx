import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface CountUpNumberProps {
  /** Target value to count up to. */
  value: number;
  /** Number of decimal places to show. Default 0. */
  decimals?: number;
  /** Animation duration in ms. Default 1000. */
  duration?: number;
  /** Delay before the count begins, in ms. Default 0. */
  delayStart?: number;
  /** Optional suffix, e.g. "%". */
  suffix?: string;
  className?: string;
}

/**
 * Animated number that counts up from 0 to `value` on mount, using an
 * ease-out curve. Used across dashboard stat cards and score rings.
 */
export function CountUpNumber({
  value,
  decimals = 0,
  duration = 1000,
  delayStart = 0,
  suffix,
  className,
}: CountUpNumberProps) {
  const display = useCountUp(value, { duration, delay: delayStart });

  return (
    <span className={cn('tabular-nums', className)}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
