import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Inbox, PartyPopper } from 'lucide-react';
import { ProposalCard } from '@/components/matching/ProposalCard';
import { ConfettiBurst } from '@/components/matching/ConfettiBurst';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { IMAGES } from '@/lib/images';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cardStagger } from '@/lib/motion';
import { invalidateProposals, getPendingProposals, respondToProposal } from '@/services/matchingService';
import { invalidateMyNests } from '@/services/nestService';
import { ROUTES } from '@/lib/constants';
import type { MatchProposalResponse } from '@/types/matching.types';

export function ProposalsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
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
      <PageHeader
        title={
          <>
            Nest Invitations
            {count > 0 && (
              <span className="ml-3 inline-flex translate-y-[-4px] items-center rounded-full bg-[var(--grad-primary)] px-3 py-1 align-middle text-xs font-bold text-white shadow-glow-sm">
                {count} pending
              </span>
            )}
          </>
        }
        description={
          count > 0
            ? 'Neighbors want you in their Nest — accept before the invitation expires.'
            : 'No pending invitations right now.'
        }
      />

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
        <EmptyState
          icon={<Inbox className="h-8 w-8 text-[var(--accent-300)]" aria-hidden="true" />}
          title="Your inbox is clear"
          description="When a Nest invites you, the invitation will appear here with a compatibility score and expiry timer."
          image={IMAGES.dinner}
          imageAlt="Friends sharing a meal together"
          action={
            <Button variant="outline" onClick={() => navigate(ROUTES.DISCOVER)}>
              Explore matches
            </Button>
          }
        />
      )}

      {/* ── Accept success overlay ── */}
      <AnimatePresence>
        {accepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[var(--color-bg)]/80 p-6 backdrop-blur-md"
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
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)] bg-[var(--grad-primary)] shadow-[var(--shadow-glow)]"
              >
                <PartyPopper className="h-10 w-10 text-white" aria-hidden="true" />
              </motion.span>
              <h2 className="mt-6 font-['Space_Grotesk'] text-2xl font-bold text-[var(--text-primary)]">
                Welcome to your Nest!
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {accepted.members.length} people are thrilled to have you. Your Nest hub is ready.
              </p>
              <Button
                variant="primary"
                size="lg"
                className="mt-7 w-full shadow-[var(--shadow-glow)]"
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