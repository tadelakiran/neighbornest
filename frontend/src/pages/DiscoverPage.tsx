import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles } from 'lucide-react';
import { CompatibilityCard } from '@/components/matching/CompatibilityCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cardStagger, cardRise } from '@/lib/motion';
import { calculateCompatibility, getCompatibles } from '@/services/matchingService';
import type { CompatibleUserResponse } from '@/types/matching.types';

/** Floating geometric shapes for the empty state. */
const FLOATERS = [
  { className: 'left-[12%] top-[18%] h-16 w-16 rounded-2xl', delay: 0 },
  { className: 'right-[15%] top-[28%] h-10 w-10 rounded-full', delay: 0.6 },
  { className: 'left-[22%] bottom-[20%] h-8 w-8 rotate-45 rounded-lg', delay: 1.1 },
  { className: 'right-[24%] bottom-[14%] h-14 w-14 rounded-full', delay: 1.7 },
];

export function DiscoverPage() {
  const { user } = useAuth();
  const toast = useToast();
  const userId = user?.authUserId ?? user?.id;

  const [compatibles, setCompatibles] = useState<CompatibleUserResponse[] | null>(null);
  const [calculating, setCalculating] = useState(false);

  const load = useCallback(() => {
    if (!userId) {
      setCompatibles([]);
      return;
    }
    getCompatibles(userId)
      .then(setCompatibles)
      .catch(() => setCompatibles([]));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRecalculate = async () => {
    if (!userId || calculating) return;
    setCalculating(true);
    try {
      await calculateCompatibility(userId);
      load();
      toast.success('Matches refreshed!');
    } catch {
      toast.error('Could not recalculate right now. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const handleInvite = () => toast.info('Invitations open once your Nest is formed.');
  const handleSkip = (skipped: CompatibleUserResponse) => {
    setCompatibles((prev) => (prev ?? []).filter((c) => c.userId !== skipped.userId));
  };

  // ── Skeleton cards while loading ──
  if (compatibles === null) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-3 h-5 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[420px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──
  if (compatibles.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <div className="relative mx-auto flex max-w-xl flex-col items-center overflow-hidden rounded-3xl border border-white/[0.08] bg-deep/60 px-8 py-16 text-center">
          {FLOATERS.map((f, i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -18, 0], rotate: [0, i % 2 ? -8 : 8, 0] }}
              transition={{ repeat: Infinity, duration: 5, delay: f.delay, ease: 'easeInOut' }}
              className={`pointer-events-none absolute border border-accent-400/25 bg-accent-400/[0.07] backdrop-blur-sm ${f.className}`}
              aria-hidden="true"
            />
          ))}
          <motion.span
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow"
          >
            <Sparkles className="h-8 w-8 text-white" aria-hidden="true" />
          </motion.span>
          <h2 className="mt-6 font-display text-2xl font-bold text-primary">We're calculating your matches…</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">
            Check back soon! Once the calculation finishes, your top compatible neighbors will appear here.
          </p>
          <Button
            variant="primary"
            className="mt-6 shadow-glow"
            isLoading={calculating}
            leftIcon={!calculating ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : undefined}
            onClick={() => void handleRecalculate()}
          >
            {calculating ? 'Calculating…' : 'Recalculate now'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Matches grid ──
  return (
    <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-6">
      <PageHeader matchCount={compatibles.length} />
      <motion.div
        variants={cardStagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {compatibles.map((compatible) => (
          <CompatibilityCard
            key={compatible.userId}
            user={compatible}
            onInvite={handleInvite}
            onSkip={handleSkip}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

function PageHeader({ matchCount }: { matchCount?: number }) {
  return (
    <motion.div variants={cardRise}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">Your Top Matches</h1>
          <p className="mt-1 text-secondary">Based on your vibe, schedule, and values.</p>
        </div>
        {matchCount !== undefined && (
          <span className="rounded-full border border-accent-400/25 bg-accent-400/10 px-3 py-1.5 text-xs font-semibold text-accent-300">
            {matchCount} match{matchCount === 1 ? '' : 'es'}
          </span>
        )}
      </div>
    </motion.div>
  );
}
