import { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MeetingRow } from '@/components/nest/MeetingRow';
import type { MeetingResponse } from '@/types/nest.types';

interface MeetingListProps {
  meetings: MeetingResponse[];
  onSchedule: () => void;
  /** Marks a scheduled meeting complete (members). */
  onComplete?: (meetingId: number) => void;
  /** Cancels a scheduled meeting (members). */
  onCancel?: (meetingId: number) => void;
}

/**
 * Glassmorphism meetings card: scheduled meetings first (soonest first),
 * then past ones, with an empty state and a magnetic Schedule CTA.
 */
export function MeetingList({ meetings, onSchedule, onComplete, onCancel }: MeetingListProps) {
  const sorted = useMemo(() => {
    const upcoming = meetings
      .filter((m) => m.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    const past = meetings
      .filter((m) => m.status !== 'SCHEDULED')
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    return [...upcoming, ...past];
  }, [meetings]);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-deep)]/60 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-primary">Upcoming Meetings</h2>
        <Button variant="primary" size="sm" leftIcon={<CalendarPlus className="h-4 w-4" aria-hidden="true" />} onClick={onSchedule}>
          Schedule
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-raised)]/40">
            <CalendarDays className="h-7 w-7 text-muted" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">No meetings scheduled</p>
            <p className="mt-1 text-xs text-muted">Plan your first meetup and bring the Nest together.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onSchedule}>
            Plan your first meetup
          </Button>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {sorted.map((meeting, i) => (
              <MeetingRow
                key={meeting.id}
                meeting={meeting}
                index={i}
                onComplete={onComplete}
                onCancel={onCancel}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
