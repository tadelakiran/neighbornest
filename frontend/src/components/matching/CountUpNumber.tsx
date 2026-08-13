import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

interface CountUpNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  delayStart?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUpNumber({
  value,
  decimals = 0,
  duration = 1000,
  delayStart = 0,
  suffix,
  prefix,
  className,
}: CountUpNumberProps) {
  const display = useCountUp(value, { duration, delay: delayStart });

  return (
    <span className={cn('tabular-nums tracking-tight', className)}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}