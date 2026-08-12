import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, PartyPopper } from 'lucide-react';
import { ProposalCard } from '@/components/matching/ProposalCard';
import { ConfettiBurst } from '@/components/matching/ConfettiBurst';
import { Button } from '@/components/ui/Button';
import { LazyImage } from '@/components/ui/LazyImage';
import { Skeleton } from '@/components/ui/Skeleton';
import { IMAGES } from '@/lib/images';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cardStagger, cardRise } from '@/lib/motion';
import { invalidateProposals, getPendingProposals, respondToProposal } from '@/services/matchingService';
import { invalidateMyNests } from '@/services/nestService';
import { ROUTES } from '@/lib/constants';
import type { MatchProposalResponse } from '@/types/matching.types';

export function ProposalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  // Pending-proposals are keyed by the PROFILE id (never the auth id).
  const userId = user?.id;

  const [proposals, setProposals] = useState<MatchProposalResponse[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [accepted, setAccepted] = useState<MatchProposalResponse | null>(null);

  const load = useCallback(() => {
    if (!userId) {
      setProposals([]);
      return;
    }
    getPendingProposals(userId)
      .then(setProposals)
      .catch(() => setProposals([]));
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (proposal: MatchProposalResponse) => {
    if (busyId !== null) return;
    setBusyId(proposal.id);
    try {
      await respondToProposal(proposal.id, 'ACCEPTED');
      if (userId) invalidateProposals(userId);
      invalidateMyNests();
      setAccepted(proposal);
      setProposals((prev) => (prev ?? []).filter((p) => p.id !== proposal.id));
    } catch {
      toast.error('Could not accept the invitation. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (proposal: MatchProposalResponse) => {
    if (busyId !== null) return;
    setBusyId(proposal.id);
    // Remove immediately for the slide-out, then persist.
    setProposals((prev) => (prev ?? []).filter((p) => p.id !== proposal.id));
    try {
      await respondToProposal(proposal.id, 'DECLINED');
      if (userId) invalidateProposals(userId);
      toast.info('Invitation declined.');
    } catch {
      toast.error('Could not decline right now. Please try again.');
      load();
    } finally {
      setBusyId(null);
    }
  };

  const count = proposals?.length ?? 0;

  return (
    <motion.div variants={cardStagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={cardRise}>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Nest Invitations
          </h1>
          {count > 0 && (
            <span className="rounded-full bg-accent-gradient px-3 py-1 text-xs font-bold text-white shadow-glow-sm">
              {count} pending
            </span>
          )}
        </div>
        <p className="mt-1 text-secondary">
          {count > 0
            ? 'Neighbors want you in their Nest — accept before the invitation expires.'
            : 'No pending invitations right now.'}
        </p>
      </motion.div>

      {/* Loading skeletons */}
      {proposals === null && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      {/* List */}
      {proposals !== null && count > 0 && (
        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                busy={busyId === proposal.id}
                onAccept={(p) => void handleAccept(p)}
                onDecline={(p) => void handleDecline(p)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty state */}
      {proposals !== null && count === 0 && (
        <motion.div
          variants={cardRise}
          className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-[var(--color-border)] bg-deep/60 px-8 py-16 text-center"
        >
          {/* Premium photography backdrop */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <LazyImage
              src={IMAGES.dinner}
              alt=""
              placeholder="shimmer"
              wrapperClassName="absolute inset-0"
              className="h-full w-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-deep)]/90 via-[var(--color-deep)]/60 to-[var(--color-deep)]/95" />
          </div>
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-400/25 bg-accent-400/10">
            <Inbox className="h-8 w-8 text-accent-300" aria-hidden="true" />
          </span>
          <h2 className="relative mt-6 font-display text-xl font-bold text-primary">Your inbox is clear</h2>
          <p className="relative mt-2 max-w-sm text-sm text-secondary">
            When a Nest invites you, the invitation will appear here with a compatibility score and expiry timer.
          </p>
          <Button variant="outline" className="relative mt-6" onClick={() => navigate(ROUTES.DISCOVER)}>
            Explore matches
          </Button>
        </motion.div>
      )}

      {/* ── Accept success overlay ── */}
      <AnimatePresence>
        {accepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-void/80 p-6 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to your Nest"
          >
            <ConfettiBurst />
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="glass relative z-10 w-full max-w-md p-10 text-center"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.15, 1] }}
                transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-gradient shadow-glow"
              >
                <PartyPopper className="h-10 w-10 text-white" aria-hidden="true" />
              </motion.span>
              <h2 className="mt-6 font-display text-2xl font-bold text-primary">Welcome to your Nest!</h2>
              <p className="mt-2 text-sm text-secondary">
                {accepted.members.length} people are thrilled to have you. Your Nest hub is ready.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="mt-7 w-full shadow-glow"
                onClick={() => navigate(ROUTES.MY_NEST)}
              >
                Open My Nest
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
