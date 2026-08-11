import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { IMAGES } from '@/lib/images';
import { ROUTES } from '@/lib/constants';

/**
 * Friendly empty state shown when the user has no active Nest — CTA leads to
 * Discover so they can start matching and get placed into one.
 */
export function NestEmptyState() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-[var(--color-border)] bg-deep/60 px-8 py-16 text-center backdrop-blur-xl"
    >
      {/* Premium photography backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <LazyImage
          src={IMAGES.park}
          alt=""
          placeholder="shimmer"
          wrapperClassName="absolute inset-0"
          className="h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-deep)]/90 via-[var(--color-deep)]/60 to-[var(--color-deep)]/95" />
      </div>

      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow transition-transform duration-300 group-hover:-translate-y-1">
        <Home className="h-8 w-8 text-white" aria-hidden="true" />
      </span>
      <h1 className="relative mt-6 font-display text-2xl font-bold text-primary">You have no active Nest</h1>
      <p className="relative mt-2 max-w-sm text-sm text-secondary">
        Nests form after your matches accept — head to Discover to find compatible neighbors and get placed into a curated group.
      </p>
      <Button
        variant="primary"
        className="relative mt-6 shadow-glow"
        rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        onClick={() => navigate(ROUTES.DISCOVER)}
      >
        Go to Discover
      </Button>
    </motion.div>
  );
}
