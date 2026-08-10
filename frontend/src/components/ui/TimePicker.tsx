import { Select } from '@/components/ui/Select';
import { Clock } from 'lucide-react';

/** A time-of-day value (12-hour). */
export interface TimeValue {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
}

interface TimePickerProps {
  value: TimeValue;
  onChange: (time: TimeValue) => void;
  label?: string;
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: String(i + 1).padStart(2, '0'),
  value: String(i + 1),
}));

const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  label: String(i * 5).padStart(2, '0'),
  value: String(i * 5).padStart(2, '0'),
}));

const PERIOD_OPTIONS = [
  { label: 'AM', value: 'AM' },
  { label: 'PM', value: 'PM' },
];

/**
 * Time picker built from three styled dropdowns (hour / minute / AM-PM).
 * Uses the shared Select component so styling stays consistent app-wide.
 */
export function TimePicker({ value, onChange, label }: TimePickerProps) {
  return (
    <div>
      <span className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
        <Clock className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
        {label ?? 'Time'}
      </span>
      <div className="flex gap-2">
        <Select
          value={String(value.hour)}
          onChange={(v) => onChange({ ...value, hour: Number(v) })}
          options={HOUR_OPTIONS}
          ariaLabel="Hour"
        />
        <Select
          value={String(value.minute).padStart(2, '0')}
          onChange={(v) => onChange({ ...value, minute: Number(v) })}
          options={MINUTE_OPTIONS}
          ariaLabel="Minute"
        />
        <Select
          value={value.period}
          onChange={(v) => onChange({ ...value, period: v as TimeValue['period'] })}
          options={PERIOD_OPTIONS}
          ariaLabel="AM or PM"
        />
      </div>
    </div>
  );
}
