import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  /** Selected date as `YYYY-MM-DD`, or null. */
  value: string | null;
  onChange: (date: string) => void;
  label?: string;
  /** Earliest selectable date (defaults to today). */
  minDate?: Date;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Formats a Date as a `YYYY-MM-DD` string (local time, no TZ shift). */
function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Compares two dates by calendar day. */
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Custom calendar date picker. Renders a month grid on a navy surface
 * with accent-highlighted selection, raised hover states, and past days disabled.
 */
export function DatePicker({
  value,
  onChange,
  label,
  minDate = new Date(),
  className,
}: DatePickerProps) {
  const selected = value ? new Date(`${value}T00:00:00`) : null;
  const [view, setView] = useState(() => {
    const base = selected ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  // ✅ FIXED: use minDate (the prop), not min (the variable being declared)
  const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  const firstWeekday = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const canGoBack = view > new Date(min.getFullYear(), min.getMonth(), 1);
  const today = new Date();

  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1)
    ),
  ];

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <span className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          <Calendar className="h-3.5 w-3.5 text-[var(--accent-400)]" aria-hidden="true" />
          {label}
        </span>
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-sm)]">
        {/* Month header */}
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {MONTHS[view.getMonth()]}{' '}
            <span className="text-[var(--text-muted)]">{view.getFullYear()}</span>
          </p>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Weekday header */}
        <div className="mb-1 grid grid-cols-7 text-center">
          {WEEKDAYS.map((day) => (
            <span
              key={day}
              className="py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
            >
              {day}
            </span>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <span key={`blank-${i}`} aria-hidden="true" />;
            const isPast = date < min;
            const isSelected = selected !== null && sameDay(date, selected);
            const isToday = sameDay(date, today);

            return (
              <motion.button
                key={date.toISOString()}
                type="button"
                disabled={isPast}
                whileTap={!isPast ? { scale: 0.9 } : undefined}
                onClick={() => onChange(toISODate(date))}
                aria-pressed={isSelected}
                aria-label={date.toLocaleDateString(undefined, { dateStyle: 'full' })}
                className={cn(
                  'flex h-9 items-center justify-center rounded-lg text-sm transition-all duration-150',
                  isPast && 'cursor-not-allowed text-[var(--text-subtle)]/40',
                  !isPast &&
                    !isSelected &&
                    'text-[var(--text-secondary)] hover:bg-[var(--color-raised)] hover:text-[var(--text-primary)]',
                  isSelected &&
                    'bg-[var(--accent-500)] font-semibold text-white shadow-glow-sm',
                  isToday && !isSelected && 'ring-1 ring-inset ring-[var(--accent-400)]/60'
                )}
              >
                {date.getDate()}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}