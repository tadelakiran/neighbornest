import type { LucideIcon } from 'lucide-react';
import { CountUpNumber } from '@/components/matching/CountUpNumber';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  delay?: number;
  className?: string;
}

/**
 * One metric cell for the Quick Stats row — icon on top, count below, caption
 * under that. Designed to sit in a 3-up `divide-x` grid on the dashboard.
 */
export function StatCard({ label, value, icon: Icon, delay = 0, className }: StatCardProps) {
  return (
    <div className={cn('group flex flex-col items-center justify-center gap-2 py-4 text-center', className)}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-400/15 bg-accent-400/10 transition-colors group-hover:border-accent-400/25 group-hover:bg-accent-400/15">
        <Icon className="h-5 w-5 text-accent-300" aria-hidden="true" />
        {/* Subtle glow behind icon */}
        <div className="absolute inset-0 rounded-xl bg-accent-400/10 opacity-0 blur-md transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </span>
      <CountUpNumber
        value={value}
        duration={1000}
        delayStart={delay}
        className="font-display text-2xl font-bold leading-none text-primary"
      />
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}