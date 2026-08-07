import type { LucideIcon } from 'lucide-react';
import { CountUpNumber } from '@/components/matching/CountUpNumber';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Delay before the count-up starts (stagger effect). */
  delay?: number;
  className?: string;
}

/**
 * Quick-stat cell: an icon, an animated count-up number, and a label.
 * Numbers count up from 0 with a 1s ease-out curve when the card appears.
 */
export function StatCard({ label, value, icon: Icon, delay = 0, className }: StatCardProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-400/20 bg-accent-400/10">
        <Icon className="h-5 w-5 text-accent-300" aria-hidden="true" />
      </span>
      <div>
        <CountUpNumber
          value={value}
          duration={1000}
          delayStart={delay}
          className="font-display text-2xl font-bold leading-none text-primary"
        />
        <p className="mt-1 text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
