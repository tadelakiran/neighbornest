import { motion } from 'framer-motion';
import { Check, Star, X } from 'lucide-react';
import { MemberAvatarStack } from '@/components/matching/MemberAvatarStack';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { Button } from '@/components/ui/Button';
import { cardRise } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { MatchProposalResponse } from '@/types/matching.types';

interface ProposalCardProps {
  proposal: MatchProposalResponse;
  /** Fired when the user accepts the invitation. */
  onAccept?: (proposal: MatchProposalResponse) => void;
  /** Fired when the user declines the invitation. */
  onDecline?: (proposal: MatchProposalResponse) => void;
  /** Disables actions while an API call is in flight. */
  busy?: boolean;
  className?: string;
}

/**
 * Deterministic pseudo-match score per proposal (the proposals API does not
 * return a compatibility number). Stable per proposal id so it never flickers.
 */
function groupMatchScore(proposalId: number): number {
  return 70 + (proposalId % 26); // 70–95
}

/**
 * Nest invitation card. Shows who invited you, the group's members, the
 * anchor guiding it, a compatibility bar, and Accept/Decline actions.
 * Slides out left (x: -200) when removed via AnimatePresence layout.
 */
export function ProposalCard({ proposal, onAccept, onDecline, busy = false, className }: ProposalCardProps) {
  const anchor = proposal.members.find((m) => m.roleInNest === 'ANCHOR');
  const score = groupMatchScore(proposal.id);

  return (
    <motion.article
      variants={cardRise}
      layout
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-deep/70 p-6 backdrop-blur-xl',
        'shadow-lg transition-shadow duration-300 hover:shadow-card-hover',
        className
      )}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />

      {/* Invitation header */}
      <div className="relative flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-gradient shadow-glow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
              <path d="M8 22h8" /><path d="M12 15.5V20" /><path d="M12 15.5c-3-1-5.5-3.5-5.5-7V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v4.5c0 3.5-2.5 6-5.5 7Z" />
            </svg>
          </span>
          <div>
            <p className="font-display text-base font-bold text-primary">
              You've been invited to join a Nest
            </p>
            <p className="text-sm text-secondary">
              {proposal.members.length} people {anchor ? '— one of them is waiting for you' : 'are waiting for you'}
            </p>
          </div>
        </div>
        <CountdownTimer expiresAt={proposal.expiresAt} />
      </div>

      {/* Member preview + anchor */}
      <div className="relative mt-5 flex flex-wrap items-center justify-between gap-4">
        <MemberAvatarStack members={proposal.members} max={5} />
        {anchor && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            Guided by {anchor.fullName}
          </span>
        )}
      </div>

      {/* Compatibility */}
      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-secondary">You match this group</span>
          <span className="font-semibold text-accent-300">{score}%</span>
        </div>
        <ProgressBar value={score} height={6} />
      </div>

      {/* Actions */}
      <div className="relative mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Button
          variant="primary"
          fullWidth
          disabled={busy}
          leftIcon={<Check className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onAccept?.(proposal)}
          className="shadow-glow"
        >
          Accept Invitation
        </Button>
        <Button
          variant="outline"
          fullWidth
          disabled={busy}
          leftIcon={<X className="h-4 w-4" aria-hidden="true" />}
          onClick={() => onDecline?.(proposal)}
        >
          Decline
        </Button>
      </div>
    </motion.article>
  );
}
