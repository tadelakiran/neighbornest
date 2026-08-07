import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  /** ISO 8601 timestamp the countdown counts down to. */
  expiresAt: string;
  /** Prefix label, e.g. "Expires in". Default "Expires in". */
  prefix?: string;
  className?: string;
}

interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
}

/** Computes the remaining time parts from an ISO timestamp. */
function getTimeParts(expiresAt: string): TimeParts {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    expired: false,
  };
}

/**
 * Auto-updating countdown — "Expires in 3 days". Re-renders every 60 seconds
 * and flips to "Expired" once the deadline passes.
 */
export function CountdownTimer({ expiresAt, prefix = 'Expires in', className }: CountdownTimerProps) {
  const [parts, setParts] = useState<TimeParts>(() => getTimeParts(expiresAt));

  useEffect(() => {
    setParts(getTimeParts(expiresAt));
    const id = window.setInterval(() => setParts(getTimeParts(expiresAt)), 60_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  const { days, hours, minutes, expired } = parts;

  const label = expired
    ? 'Expired'
    : days > 0
      ? `${days} day${days === 1 ? '' : 's'}`
      : hours > 0
        ? `${hours}h ${minutes}m`
        : `${minutes}m`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-muted',
        expired && 'text-rose-400',
        className
      )}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {prefix} {label}
    </span>
  );
}
