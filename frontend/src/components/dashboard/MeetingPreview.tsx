import { motion } from 'framer-motion';
import { CalendarDays, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MeetingPreviewData {
  id: string;
  title: string;
  date: string;
  venue: string;
}

interface MeetingPreviewProps {
  meeting: MeetingPreviewData;
  className?: string;
}

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

export function MeetingPreview({ meeting, className }: MeetingPreviewProps) {
  const dateLabel = new Date(meeting.date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-3',
        'border-[var(--color-border)] bg-[var(--color-surface)]/60',
        'transition-all duration-200',
        'hover:border-accent-400/25 hover:bg-surface hover:shadow-md',
        className
      )}
    >
      {/* Left accent bar */}
      <div className="h-10 w-1 shrink-0 rounded-full bg-accent-400/20 transition-colors group-hover:bg-accent-400/40" />
      
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-400/10 transition-colors group-hover:bg-accent-400/15">
        <CalendarDays className="h-5 w-5 text-accent-300" aria-hidden="true" />
      </span>
      
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary">{meeting.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
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