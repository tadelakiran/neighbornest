import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Users, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function MyNestsPlaceholder() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'flex flex-col items-center gap-6 rounded-2xl border border-dashed border-white/[0.1]',
        'bg-deep/50 px-8 py-20 text-center backdrop-blur-sm',
        'shadow-lg shadow-black/10'
      )}
    >
      {/* Icon cluster */}
      <div className="relative">
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="flex h-20 w-20 items-center justify-center rounded-2xl border border-accent-400/20 bg-accent-400/10 shadow-glow-sm"
        >
          <Users className="h-9 w-9 text-accent-300" aria-hidden="true" />
        </motion.span>
        <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-deep shadow-lg">
          <MapPin className="h-5 w-5 text-secondary" aria-hidden="true" />
        </span>
        {/* Orbiting dot */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="absolute -inset-3"
        >
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent-400/60" />
        </motion.span>
      </div>

      <div className="max-w-sm space-y-2">
        <h3 className="font-display text-xl font-bold text-primary">
          No Nest yet
        </h3>
        <p className="text-sm leading-relaxed text-muted">
          Once we match you with compatible neighbors, your Nest and its members will appear here.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => navigate(ROUTES.DASHBOARD)}
        className="rounded-xl shadow-glow"
        leftIcon={<Compass className="h-4 w-4" aria-hidden="true" />}
        rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
      >
        Find your Nest
      </Button>
    </motion.div>
  );
}