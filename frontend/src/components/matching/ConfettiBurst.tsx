import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConfettiBurstProps {
  count?: number;
}

const COLORS = ['#38bdf8', '#0ea5e9', '#7dd3fc', '#60a5fa', '#93c5fd', '#f8fafc'];

export function ConfettiBurst({ count = 30 }: ConfettiBurstProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 520,
        y: -(Math.random() * 460 + 200),
        rotate: Math.random() * 720 - 360,
        scale: 0.5 + Math.random() * 0.9,
        color: COLORS[i % COLORS.length],
        width: 5 + Math.random() * 7,
        height: 8 + Math.random() * 10,
        delay: Math.random() * 0.2,
        duration: 0.9 + Math.random() * 0.8,
        shape: Math.random() > 0.7 ? 'rounded-full' : 'rounded-[2px]',
      })),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: piece.x,
            y: piece.y,
            rotate: piece.rotate,
            scale: piece.scale,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeOut',
          }}
          className={cn('absolute left-1/2 top-1/2', piece.shape)}
          style={{
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
            boxShadow: `0 0 ${4 + Math.random() * 6}px ${piece.color}`,
          }}
        />
      ))}
    </div>
  );
}

// Need cn for this component
function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}