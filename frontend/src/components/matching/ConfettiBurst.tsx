import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface ConfettiBurstProps {
  /** Number of particles. Default 30. */
  count?: number;
}

const COLORS = ['#38bdf8', '#0ea5e9', '#f8fafc', '#7dd3fc', '#ffffff'];

/**
 * One-shot confetti burst: ~30 small rectangles launched from the center of
 * the screen with randomized trajectories (Framer Motion physics). Renders
 * nothing once the animation completes.
 */
export function ConfettiBurst({ count = 30 }: ConfettiBurstProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 480,
        y: -(Math.random() * 420 + 180),
        rotate: Math.random() * 720 - 360,
        scale: 0.6 + Math.random() * 0.8,
        color: COLORS[i % COLORS.length],
        width: 6 + Math.random() * 6,
        height: 10 + Math.random() * 8,
        delay: Math.random() * 0.15,
        duration: 1 + Math.random() * 0.7,
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
          className="absolute left-1/2 top-1/2 rounded-[2px]"
          style={{
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
}
