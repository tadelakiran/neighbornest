import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { fadeUpItem, staggerContainer } from '@/lib/motion';

/** Confetti palette — emerald/teal on dark. */
const CONFETTI_COLORS = ['#34d399', '#2dd4bf', '#a7f3d0', '#fbbf24', '#ffffff'];

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

/** Final step — celebratory checkmark with spring physics + falling confetti. */
export function StepSuccess() {
  const navigate = useNavigate();

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 24 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.4 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 140,
        rotate: (Math.random() - 0.5) * 720,
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

      {/* Spring checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-500/40"
      >
        <CheckCircle2 className="h-12 w-12 text-emerald-950" aria-hidden="true" />
      </motion.div>

      <motion.div variants={fadeUpItem} className="space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">You&apos;re all set!</h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
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
