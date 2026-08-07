import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MeetingPreviewData {
  id: string;
  title: string;
  /** ISO timestamp of the meeting start. */
  date: string;
  venue: string;
}

interface MeetingPreviewProps {
  meeting: MeetingPreviewData;
  className?: string;
}

/** Computes a live "in X days / Xh Ym" label for the meeting date. */
function relativeTime(dateIso: string): string {
  const diff = new Date(dateIso).getTime() - Date.now();
  if (Number.isNaN(diff)) return '—';
  if (diff <= 0) return 'Today';
  const days = Math.floor(diff / 86_400_000);
  if (days > 0) return `in ${days} day${days === 1 ? '' : 's'}`;
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  if (hours > 0) return `in ${hours}h`;
  const minutes = Math.max(1, Math.floor((diff % 3_600_000) / 60_000));
  return `in ${minutes}m`;
}

/**
 * A single upcoming-meeting row: title, date badge, venue, and a live
 * countdown label. Rows lift slightly on hover.
 */
export function MeetingPreview({ meeting, className }: MeetingPreviewProps) {
  const dateLabel = new Date(meeting.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface/60 p-3',
        'transition-colors duration-200 hover:border-accent-400/25 hover:bg-surface',
        className
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-400/10">
        <CalendarDays className="h-5 w-5 text-accent-300" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary">{meeting.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          <span className="truncate">{meeting.venue}</span>
          <span className="mx-1 text-white/10">•</span>
          <span className="shrink-0">{dateLabel}</span>
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-accent-400/20 bg-accent-400/10 px-2.5 py-1 text-[11px] font-semibold text-accent-300">
        {relativeTime(meeting.date)}
      </span>
    </motion.div>
  );
}
