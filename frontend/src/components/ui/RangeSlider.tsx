import { useId } from 'react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  /** Current value. */
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Custom styled range input: a navy track whose fill is a blue gradient, and a
 * glowing thumb that scales while dragging. The dynamic fill position is the
 * only inline style (Tailwind cannot express a percentage gradient stop).
 */
export function RangeSlider({
  value,
  min = 1,
  max = 10,
  step = 1,
  onChange,
  label,
  ariaLabel,
  className,
}: RangeSliderProps) {
  const id = useId();
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel ?? label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="range-slider"
        style={{
          background: `linear-gradient(to right, #0284c7 0%, #38bdf8 ${pct}%, #162044 ${pct}%, #162044 100%)`,
        }}
      />
    </div>
  );
}
