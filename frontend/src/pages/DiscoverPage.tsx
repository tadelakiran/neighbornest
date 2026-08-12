import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Sparkles, Users } from 'lucide-react';
import { CompatibilityCard } from '@/components/matching/CompatibilityCard';
import { NestBuilderModal } from '@/components/matching/NestBuilderModal';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { IMAGES } from '@/lib/images';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cardStagger, cardRise } from '@/lib/motion';
import { calculateCompatibility, getCompatibles, invalidateProposals } from '@/services/matchingService';
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
  // Matching endpoints are keyed by the PROFILE id (never the auth id).
  const userId = user?.id;

  const [compatibles, setCompatibles] = useState<CompatibleUserResponse[] | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showBuilder, setShowBuilder] = useState(false);

  const selectedMatches = useMemo(
    () => (compatibles ?? []).filter((c) => selected.has(c.userId)),
    [compatibles, selected]
  );

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

  /** Toggles a match in/out of the Nest invitation selection. */
  const handleInvite = (match: CompatibleUserResponse) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(match.userId)) {
        next.delete(match.userId);
        toast.info(`${match.fullName} removed from the invite.`);
      } else {
        next.add(match.userId);
        toast.success(`${match.fullName} added — ${next.size + 1} people so far.`);
      }
      return next;
    });
  };

  const handleSkip = (skipped: CompatibleUserResponse) => {
    setCompatibles((prev) => (prev ?? []).filter((c) => c.userId !== skipped.userId));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(skipped.userId);
      return next;
    });
  };

  const handleCreated = () => {
    setSelected(new Set());
    if (userId) invalidateProposals(userId);
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
        <div className="relative mx-auto flex max-w-xl flex-col items-center overflow-hidden rounded-3xl border border-[var(--color-border)] bg-deep/60 px-8 py-16 text-center">
          {/* Premium photography backdrop */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <LazyImage
              src={IMAGES.coffee}
              alt=""
              placeholder="shimmer"
              wrapperClassName="absolute inset-0"
              className="h-full w-full object-cover opacity-20"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-deep)]/90 via-[var(--color-deep)]/60 to-[var(--color-deep)]/95" />
          </div>
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
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow"
          >
            <Sparkles className="h-8 w-8 text-white" aria-hidden="true" />
          </motion.span>
          <h2 className="relative mt-6 font-display text-2xl font-bold text-primary">We're calculating your matches…</h2>
          <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-secondary">
            Check back soon! Once the calculation finishes, your top compatible neighbors will appear here.
          </p>
          <Button
            variant="primary"
            className="relative mt-6 shadow-glow"
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
    <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-6 pb-24">
      <PageHeader matchCount={compatibles.length} selectedCount={selected.size} />
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
            invited={selected.has(compatible.userId)}
            onInvite={handleInvite}
            onSkip={handleSkip}
          />
        ))}
      </motion.div>

      {/* Floating Nest-invite bar */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-accent-400/25 bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-400/15">
              <Users className="h-4 w-4 text-accent-300" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-primary">
                {selected.size + 1} people selected
              </p>
              <p className="text-[11px] text-muted">
                {selected.size + 1 >= 5 ? 'Ready to form your Nest — pick Anchors next.' : `Need ${5 - (selected.size + 1)} more to reach 5.`}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="ml-1 shrink-0 shadow-glow"
              onClick={() => setShowBuilder(true)}
            >
              Review & send invites
            </Button>
          </div>
        </motion.div>
      )}

      <NestBuilderModal
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        matches={selectedMatches}
        currentUserId={userId ?? 0}
        currentUserName={user?.fullName ?? 'You'}
        onCreated={handleCreated}
      />
    </motion.div>
  );
}

function PageHeader({ matchCount, selectedCount }: { matchCount?: number; selectedCount?: number }) {
  return (
    <motion.div variants={cardRise}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">Your Top Matches</h1>
          <p className="mt-1 text-secondary">Based on your vibe, schedule, and values.</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount !== undefined && selectedCount > 0 && (
            <span className="rounded-full border border-accent-400/30 bg-accent-400/10 px-3 py-1.5 text-xs font-semibold text-accent-300">
              {selectedCount} invited
            </span>
          )}
          {matchCount !== undefined && (
            <span className="rounded-full border border-accent-400/25 bg-accent-400/10 px-3 py-1.5 text-xs font-semibold text-accent-300">
              {matchCount} match{matchCount === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
