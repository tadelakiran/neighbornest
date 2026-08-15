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
      className="group relative overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] text-center shadow-[var(--shadow-card)]"
    >
      {/* Park photo as its own banner — separate from the content below */}
      <div className="relative h-44 overflow-hidden">
        <LazyImage
          src={IMAGES.park}
          alt=""
          placeholder="shimmer"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] to-transparent" />
      </div>

      <div className="flex flex-col items-center px-8 pb-12 pt-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow transition-transform duration-300 group-hover:-translate-y-1">
          <Home className="h-8 w-8 text-white" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold text-primary">You have no active Nest</h1>
        <p className="mt-2 max-w-sm text-sm text-secondary">
          Nests form after your matches accept — head to Discover to find compatible neighbors and get placed into a curated group.
        </p>
        <Button
          variant="primary"
          className="mt-6 shadow-glow"
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
          onClick={() => navigate(ROUTES.DISCOVER)}
        >
          Go to Discover
        </Button>
      </div>
    </motion.div>
  );
}
