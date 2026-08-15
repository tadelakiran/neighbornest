import { cn } from '@/lib/utils';
import type { NestStatus } from '@/types/nest.types';

interface NestStatusBadgeProps {
  status: NestStatus;
  className?: string;
}

const STATUS_META: Record<NestStatus, { style: string; dot: string; pulse?: boolean }> = {
  ACTIVE: {
    style: 'border-[var(--success)]/25 bg-[var(--success)]/10 text-[var(--success)] shadow-[0_0_16px_rgba(56,189,248,0.2)]',
    dot: 'bg-[var(--success)]',
    pulse: true,
  },
  VIBE_CHECK: {
    style: 'border-[var(--warning)]/25 bg-[var(--warning)]/10 text-[var(--warning)] shadow-[0_0_16px_rgba(96,165,250,0.2)]',
    dot: 'bg-[var(--warning)]',
    pulse: true,
  },
  RE_MATCHING: {
    style: 'border-royal-400/25 bg-royal-400/10 text-royal-300 shadow-[0_0_16px_rgba(96,165,250,0.2)]',
    dot: 'bg-royal-400',
    pulse: true,
  },
  GRADUATED: {
    style: 'border-accent-300/25 bg-accent-300/10 text-accent-300 shadow-[0_0_16px_rgba(56,189,248,0.2)]',
    dot: 'bg-accent-300',
  },
  FORMING: {
    style: 'border-[var(--color-border)] bg-[var(--color-raised)]/40 text-[var(--text-secondary)]',
    dot: 'bg-muted',
  },
  DISBANDED: {
    style: 'border-[var(--error)]/20 bg-[var(--error)]/10 text-[var(--error)]',
    dot: 'bg-[var(--error)]',
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