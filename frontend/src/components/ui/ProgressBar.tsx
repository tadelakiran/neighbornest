import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** Value from 0–100. */
  value: number;
  /** Height of the track in px. Default 6. */
  height?: number;
  /** Optional label rendered at the end of the track. */
  label?: string;
  className?: string;
  /** Delay before the fill animates (for staggered lists). */
  delay?: number;
}

/**
 * Thin horizontal progress bar with an animated blue-gradient fill.
 * The fill sweeps from 0 to `value` with an ease-out curve on mount.
 */
export function ProgressBar({ value, height = 6, label, className, delay = 0 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="flex-1 overflow-hidden rounded-full bg-[var(--text-primary)]/[0.06]"
        style={{ height }}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-[var(--grad-primary)] shadow-[0_0_10px_rgba(14,165,233,0.5)]"
        />
      </div>
      {label !== undefined && (
        <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-[var(--accent-300)]">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}