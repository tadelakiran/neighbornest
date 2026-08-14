import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Sparkles, Users, Search } from 'lucide-react';
import { CompatibilityCard } from '@/components/matching/CompatibilityCard';
import { NestBuilderModal } from '@/components/matching/NestBuilderModal';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { IMAGES } from '@/lib/images';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { calculateCompatibility, getCompatibles, invalidateProposals } from '@/services/matchingService';
import type { CompatibleUserResponse } from '@/types/matching.types';

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
        <PageHeader
          title="Your Top Matches"
          description="We're analyzing compatibility across interests, schedules, and values."
        />
        <EmptyState
          icon={<Sparkles className="h-8 w-8 text-[var(--accent-300)]" aria-hidden="true" />}
          title="Finding your matches…"
          description="Check back soon or recalculate now to refresh your compatibility scores."
          image={IMAGES.coffee}
          imageAlt="People getting to know each other over coffee"
          action={
            <Button
              variant="primary"
              isLoading={calculating}
              leftIcon={!calculating ? <RefreshCw className="h-4 w-4" /> : undefined}
              onClick={() => void handleRecalculate()}
            >
              {calculating ? 'Calculating…' : 'Recalculate now'}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-6xl space-y-8 pb-32"
    >
      <PageHeader
        title="Your Top Matches"
        description="Based on your vibe, schedule, and values."
        actions={
          <>
            {selected.size > 0 && (
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-400)]/10 px-4 py-2 text-sm font-semibold text-[var(--accent-400)] ring-1 ring-[var(--accent-400)]/20"
              >
                <Users className="h-4 w-4" />
                {selected.size} invited
              </motion.span>
            )}
            <span className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              {compatibles.length} match{compatibles.length === 1 ? '' : 'es'}
            </span>
          </>
        }
      />
      
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

