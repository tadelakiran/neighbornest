import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { fadeUpItem, staggerContainer } from '@/lib/motion';

/** Confetti palette — blue/cyan/white on dark. */
const CONFETTI_COLORS = ['#38bdf8', '#60a5fa', '#93c5fd', '#e0f2fe', '#7dd3fc'];

/** One confetti particle's random config (generated once per mount). */
interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  color: string;
}

/**
 * Final step — the geometric nest mark draws itself via SVG stroke-dashoffset,
 * then pulses with a blue glow while confetti bursts from the center.
 */
export function StepSuccess() {
  const navigate = useNavigate();

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 28 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.6 + Math.random() * 1.2,
        drift: (Math.random() - 0.5) * 160,
        rotate: (Math.random() - 0.5) * 760,
        color: CONFETTI_COLORS[id % CONFETTI_COLORS.length],
      })),
    []
  );

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center space-y-6 py-8 text-center"
    >
      {/* Confetti layer */}
      <div className="pointer-events-none relative h-28 w-full overflow-hidden" aria-hidden="true">
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute top-0 h-2.5 w-2.5 rounded-sm"
            style={{ left: `${particle.left}%`, backgroundColor: particle.color }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: 140, opacity: [0, 1, 1, 0], rotate: particle.rotate, x: particle.drift }}
            transition={{ delay: particle.delay, duration: particle.duration, repeat: Infinity, repeatDelay: 1.2, ease: 'easeIn' }}
          />
        ))}
      </div>

      {/* Self-drawing nest mark + glow pulse */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
        className="relative flex h-28 w-28 items-center justify-center"
      >
        {/* Glow pulse */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-accent-400/20 blur-xl"
          animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Geometric nest — strokes draw themselves */}
        <svg viewBox="0 0 64 64" fill="none" className="relative h-20 w-20 text-accent-500 drop-shadow-[0_0_12px_rgba(14,165,233,0.5)]">
          <motion.path
            d="M32 12 L56 52 H8 Z"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
          />
          <motion.path
            d="M32 28 L44 52 H20 Z"
            fill="currentColor"
            opacity="0.35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 1.0 }}
          />
          <motion.circle
            cx="32"
            cy="12"
            r="3"
            fill="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.1, type: 'spring', stiffness: 400, damping: 15 }}
          />
        </svg>
      </motion.div>

      <motion.div variants={fadeUpItem} className="space-y-2">
        <h2 className="font-display text-3xl font-bold tracking-tight text-primary">
          You&apos;re all set!
        </h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-secondary">
          Your profile is live. We&apos;re now matching you with neighbors who
          share your vibe — keep an eye on your dashboard.
        </p>
      </motion.div>

      <motion.div variants={fadeUpItem}>
        <Button
          size="lg"
          onClick={() => navigate(ROUTES.DASHBOARD, { replace: true })}
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          Go to dashboard
        </Button>
      </motion.div>
    </motion.div>
  );
}
