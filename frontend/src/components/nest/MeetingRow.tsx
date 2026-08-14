import { motion } from 'framer-motion';
import { MapPin, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { MeetingResponse } from '@/types/nest.types';

interface MeetingRowProps {
  meeting: MeetingResponse;
  index?: number;
  /** Marks a scheduled meeting complete (members). */
  onComplete?: (meetingId: number) => void;
  /** Cancels a scheduled meeting (members). */
  onCancel?: (meetingId: number) => void;
}

const STATUS_DOT: Record<MeetingResponse['status'], string> = {
  SCHEDULED: 'bg-accent-400 shadow-[0_0_8px_rgba(14,165,233,0.8)]',
  COMPLETED: 'bg-emerald-400',
  CANCELLED: 'bg-rose-400',
};

/**
 * A single meeting row: date block, venue + activity badge, and the time with
 * a status dot. Slides in from the left on mount; scheduled rows reveal
 * Complete/Cancel actions on hover.
 */
export function MeetingRow({ meeting, index = 0, onComplete, onCancel }: MeetingRowProps) {
  const date = new Date(meeting.scheduledAt);
  const isScheduled = meeting.status === 'SCHEDULED';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center gap-4 rounded-xl px-3 py-3 transition-colors duration-200 hover:bg-white/5"
    >
      {/* Date block */}
      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="font-display text-lg font-bold leading-none text-primary">{date.getDate()}</span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          {date.toLocaleString('en', { month: 'short' })}
        </span>
      </span>

      {/* Venue + activity */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-primary">{meeting.venueName || 'Neighborhood Meetup'}</p>
          {meeting.activityType && (
            <span className="rounded-full bg-accent-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-300">
              {meeting.activityType}
            </span>
          )}
        </div>
        {meeting.venueAddress && (
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
            <MapPin className="h-3 w-3 shrink-0 text-accent-400/70" aria-hidden="true" />
            {meeting.venueAddress}
          </p>
        )}
      </div>

      {/* Time + status */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="flex items-center gap-2 text-sm font-semibold tabular-nums text-secondary">
          <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', STATUS_DOT[meeting.status])} />
          {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </span>
        {!isScheduled && (
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider',
              meeting.status === 'COMPLETED' ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {meeting.status}
          </span>
        )}
        {isScheduled && (onComplete || onCancel) && (
          <span className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {onComplete && (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => onComplete(meeting.id)}>
                <Check className="h-3 w-3" aria-hidden="true" />
                Done
              </Button>
            )}
            {onCancel && (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => onCancel(meeting.id)}>
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            )}
          </span>
        )}
      </div>
    </motion.div>
  );
}
