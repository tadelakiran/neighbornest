import { useId } from 'react';
import { motion } from 'framer-motion';
import { CountUpNumber } from '@/components/matching/CountUpNumber';
import { cn } from '@/lib/utils';

interface CircularScoreProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export function CircularScore({
  value,
  size = 120,
  strokeWidth = 9,
  label,
  className,
}: CircularScoreProps) {
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      {/* Ambient glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute rounded-full bg-accent-400/15 blur-2xl"
        style={{ inset: strokeWidth * 0.4 }}
        aria-hidden="true"
      />

      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={`${clamped}% compatibility`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(14,165,233,0.4))' }}
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <CountUpNumber
          value={clamped}
          suffix="%"
          duration={1200}
          className="font-display text-3xl font-bold text-primary"
        />
        {label && (
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}