import { cn } from '@/lib/utils';
import type { NestStatus } from '@/types/nest.types';

interface NestStatusBadgeProps {
  status: NestStatus;
  className?: string;
}

const STATUS_META: Record<NestStatus, { style: string; dot: string; pulse?: boolean }> = {
  ACTIVE: {
    style: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.2)]',
    dot: 'bg-emerald-400',
    pulse: true,
  },
  VIBE_CHECK: {
    style: 'border-amber-400/25 bg-amber-400/10 text-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.2)]',
    dot: 'bg-amber-400',
    pulse: true,
  },
  RE_MATCHING: {
    style: 'border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_16px_rgba(232,121,249,0.2)]',
    dot: 'bg-fuchsia-400',
    pulse: true,
  },
  GRADUATED: {
    style: 'border-accent-300/25 bg-accent-300/10 text-accent-300 shadow-[0_0_16px_rgba(56,189,248,0.2)]',
    dot: 'bg-accent-300',
  },
  FORMING: {
    style: 'border-white/10 bg-white/[0.04] text-secondary',
    dot: 'bg-muted',
  },
  DISBANDED: {
    style: 'border-rose-400/20 bg-rose-400/8 text-rose-300',
    dot: 'bg-rose-400',
  },
};

export function NestStatusBadge({ status, className }: NestStatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META.FORMING;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5',
        'text-[10px] font-bold uppercase tracking-[0.12em]',
        meta.style,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span
          className={cn(
            'absolute inset-0 rounded-full',
            meta.dot,
            meta.pulse && 'animate-ping opacity-60'
          )}
          aria-hidden="true"
        />
        <span className={cn('relative h-1.5 w-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      </span>
      {status.replace('_', ' ')}
    </span>
  );
}