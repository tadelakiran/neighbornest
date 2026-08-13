import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, Users, Search } from 'lucide-react';
import { CompatibilityCard } from '@/components/matching/CompatibilityCard';
import { NestBuilderModal } from '@/components/matching/NestBuilderModal';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { IMAGES } from '@/lib/images';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { calculateCompatibility, getCompatibles, invalidateProposals } from '@/services/matchingService';
import type { CompatibleUserResponse } from '@/types/matching.types';

const FLOATERS = [
  { className: 'left-[10%] top-[20%] h-20 w-20 rounded-3xl', delay: 0, rotate: 12 },
  { className: 'right-[12%] top-[25%] h-14 w-14 rounded-full', delay: 0.8, rotate: -8 },
  { className: 'left-[20%] bottom-[18%] h-10 w-10 rotate-45 rounded-xl', delay: 1.4, rotate: 20 },
  { className: 'right-[22%] bottom-[16%] h-16 w-16 rounded-2xl', delay: 2.0, rotate: -15 },
  { className: 'left-[45%] top-[12%] h-8 w-8 rounded-lg', delay: 1.2, rotate: 30 },
];

const gridVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

export function DiscoverPage() {
  const { user } = useAuth();
  const toast = useToast();
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

  const handleInvite = (match: CompatibleUserResponse) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(match.userId)) {
        next.delete(match.userId);
        toast.info(`${match.fullName} removed`);
      } else {
        next.add(match.userId);
        toast.success(`${match.fullName} added`);
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

  if (compatibles === null) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-12 w-72 rounded-xl" />
          <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <Skeleton className="h-[380px] rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (compatibles.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto flex max-w-xl flex-col items-center overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] px-8 py-20 text-center"
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <LazyImage
              src={IMAGES.coffee}
              alt=""
              placeholder="shimmer"
              wrapperClassName="absolute inset-0"
              className="h-full w-full object-cover opacity-15"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--void)]/95 via-[var(--deep)]/70 to-[var(--void)]/95" />
          </div>
          
          {FLOATERS.map((f, i) => (
            <motion.span
              key={i}
              animate={{ 
                y: [0, -20, 0], 
                rotate: [0, f.rotate, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 6, 
                delay: f.delay, 
                ease: 'easeInOut' 
              }}
              className={`pointer-events-none absolute border border-accent-400/20 bg-accent-400/[0.05] backdrop-blur-sm ${f.className}`}
            />
          ))}
          
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-gradient shadow-glow"
          >
            <Sparkles className="h-10 w-10 text-white" />
          </motion.span>
          
          <h2 className="relative mt-8 font-display text-3xl font-bold text-[var(--text-primary)]">
            Finding your matches…
          </h2>
          <p className="relative mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
            We're analyzing compatibility across interests, schedules, and values. 
            Check back soon or recalculate now.
          </p>
          
          <Button
            variant="primary"
            className="relative mt-8 rounded-xl shadow-glow"
            isLoading={calculating}
            leftIcon={!calculating ? <RefreshCw className="h-4 w-4" /> : undefined}
            onClick={() => void handleRecalculate()}
          >
            {calculating ? 'Calculating…' : 'Recalculate now'}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl space-y-8 pb-32"
    >
      <PageHeader matchCount={compatibles.length} selectedCount={selected.size} />
      
      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
      >
        {compatibles.map((compatible) => (
          <motion.div key={compatible.userId} variants={cardVariants}>
            <CompatibilityCard
              user={compatible}
              invited={selected.has(compatible.userId)}
              onInvite={handleInvite}
              onSkip={handleSkip}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
          >
            <div className="flex items-center gap-4 rounded-2xl border border-accent-400/20 bg-[var(--surface)]/90 px-6 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl ring-1 ring-white/5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-400/10">
                <Users className="h-5 w-5 text-accent-400" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {selected.size + 1} people selected
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {selected.size + 1 >= 5 
                    ? 'Ready to form your Nest' 
                    : `Need ${5 - (selected.size + 1)} more to reach 5`
                  }
                </p>
              </div>
              <div className="h-8 w-px bg-[var(--border)]" />
              <Button
                variant="primary"
                size="sm"
                className="rounded-xl shadow-glow-sm"
                onClick={() => setShowBuilder(true)}
              >
                Review invites
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
          Your Top Matches
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Based on your vibe, schedule, and values.
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        {selectedCount !== undefined && selectedCount > 0 && (
          <motion.span 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-400/10 px-4 py-2 text-sm font-semibold text-accent-400 ring-1 ring-accent-400/20"
          >
            <Users className="h-4 w-4" />
            {selectedCount} invited
          </motion.span>
        )}
        {matchCount !== undefined && (
          <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
            <Search className="h-4 w-4 text-[var(--text-muted)]" />
            {matchCount} match{matchCount === 1 ? '' : 'es'}
          </span>
        )}
      </div>
    </motion.div>
  );
}