import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { cn } from '@/lib/utils';

interface CustomSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * A 1–10 slider used by the vibe check. The live number is a Framer Motion
 * spring that eases toward the thumb value — it never snaps to zero while
 * dragging, so the counter feels continuous rather than restarting.
 */
export function CustomSlider({ label, value, onChange, min = 1, max = 10, className }: CustomSliderProps) {
  const raw = useMotionValue(value);
  const spring = useSpring(raw, { stiffness: 420, damping: 38 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    raw.set(value);
  }, [value, raw]);

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-sm font-medium text-primary">{label}</span>
        <span className="flex items-baseline gap-1">
          <motion.span className="font-display text-3xl font-bold leading-none tabular-nums text-primary">
            {display}
          </motion.span>
          <span className="text-xs font-semibold text-muted">/ {max}</span>
        </span>
      </div>
      <RangeSlider value={value} min={min} max={max} step={1} onChange={onChange} ariaLabel={label} />
    </div>
  );
}
