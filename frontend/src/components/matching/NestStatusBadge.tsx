import { cn } from '@/lib/utils';
import type { NestStatus } from '@/types/nest.types';

interface NestStatusBadgeProps {
  status: NestStatus;
  className?: string;
}

const STATUS_STYLES: Record<NestStatus, string> = {
  ACTIVE:    'border-emerald-400/30 bg-emerald-400/10 text-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.25)]',
  VIBE_CHECK: 'border-amber-400/30 bg-amber-400/10 text-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.25)]',
  GRADUATED: 'border-accent-300/30 bg-accent-300/10 text-accent-300 shadow-[0_0_14px_rgba(56,189,248,0.25)]',
  FORMING:   'border-white/10 bg-white/[0.04] text-secondary',
  DISBANDED: 'border-rose-400/25 bg-rose-400/10 text-rose-300',
};

/**
 * Nest lifecycle badge with a per-status glow treatment
 * (emerald for ACTIVE, amber for VIBE_CHECK, blue for GRADUATED).
 */
export function NestStatusBadge({ status, className }: NestStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider',
        STATUS_STYLES[status] ?? STATUS_STYLES.FORMING,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status.replace('_', ' ')}
    </span>
  );
}
