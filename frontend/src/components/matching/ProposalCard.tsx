import { motion } from 'framer-motion';
import { Check, Star, X, Bell } from 'lucide-react';
import { MemberAvatarStack } from '@/components/matching/MemberAvatarStack';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Button } from '@/components/ui/Button';
import { cardRise } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { MatchProposalResponse } from '@/types/matching.types';

interface ProposalCardProps {
  proposal: MatchProposalResponse;
  onAccept?: (proposal: MatchProposalResponse) => void;
  onDecline?: (proposal: MatchProposalResponse) => void;
  busy?: boolean;
  className?: string;
}

function groupMatchScore(proposalId: number): number {
  return 70 + (proposalId % 26);
}

export function ProposalCard({ proposal, onAccept, onDecline, busy = false, className }: ProposalCardProps) {
  const anchor = proposal.members.find((m) => m.roleInNest === 'ANCHOR');
  const score = groupMatchScore(proposal.id);

  return (
    <motion.article
      variants={cardRise}
      layout
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-deep/70 p-6 backdrop-blur-xl',
        'shadow-lg shadow-black/20 transition-all duration-300',
        'hover:border-accent-400/20 hover:shadow-xl hover:shadow-black/30',
        className
      )}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent-500/10 blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      {/* Inner top wash */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-accent-500/8 to-transparent"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-gradient shadow-glow-sm">
            <Bell className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <div>
            <p className="font-display text-base font-bold text-primary">
              Nest Invitation
            </p>
            <p className="mt-0.5 text-sm text-secondary">
              {proposal.members.length} people waiting for you
            </p>
          </div>
        </div>
        <CountdownTimer expiresAt={proposal.expiresAt} />
      </div>

      {/* Members + Anchor */}
      <div className="relative mt-6 flex flex-wrap items-center justify-between gap-4">
        <MemberAvatarStack members={proposal.members} max={5} size="md" />
        {anchor && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {anchor.fullName || 'Anchor'}
          </span>
        )}
      </div>

      {/* Compatibility */}
      <div className="relative mt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-secondary">Group compatibility</span>
          <span className="font-bold text-accent-300">{score}%</span>
        </div>
        <ProgressBar value={score} height={6} className="rounded-full" />
      </div>

      {/* Actions */}
      <div className="relative mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Button
          variant="primary"
          fullWidth
          disabled={busy}
          leftIcon={<Check className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onAccept?.(proposal)}
          className="h-11 rounded-xl shadow-glow hover:shadow-[0_0_24px_rgba(14,165,233,0.35)]"
        >
          Accept Invitation
        </Button>
        <Button
          variant="outline"
          fullWidth
          disabled={busy}
          leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onDecline?.(proposal)}
          className="h-11 rounded-xl border-white/[0.1] text-secondary hover:border-rose-400/30 hover:bg-rose-400/10 hover:text-rose-400"
        >
          Decline
        </Button>
      </div>
    </motion.article>
  );
}