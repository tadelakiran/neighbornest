import { useMemo, useState } from 'react';
import { Crown, Users, Shield, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { cn, getErrorMessage } from '@/lib/utils';
import { createProposal, respondToProposal } from '@/services/matchingService';
import type { CompatibleUserResponse } from '@/types/matching.types';

const MIN_TOTAL = 5;
const MAX_TOTAL = 8;
const MIN_ANCHORS = 1;
const MAX_ANCHORS = 2;

interface NestBuilderModalProps {
  open: boolean;
  onClose: () => void;
  matches: CompatibleUserResponse[];
  currentUserId: number;
  currentUserName: string;
  onCreated: () => void;
}

export function NestBuilderModal({
  open,
  onClose,
  matches,
  currentUserId,
  currentUserName,
  onCreated,
}: NestBuilderModalProps) {
  const toast = useToast();
  const [selfAnchor, setSelfAnchor] = useState(false);
  const [anchorIds, setAnchorIds] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const memberIds = useMemo(
    () => [currentUserId, ...matches.map((m) => m.userId)],
    [currentUserId, matches]
  );
  const total = memberIds.length;
  const anchorCount = (selfAnchor ? 1 : 0) + matches.filter((m) => anchorIds[m.userId]).length;
  const canSubmit = total >= MIN_TOTAL && total <= MAX_TOTAL && anchorCount >= MIN_ANCHORS && anchorCount <= MAX_ANCHORS;

  const toggleAnchor = (userId: number) => {
    setAnchorIds((prev) => {
      const next = { ...prev, [userId]: !prev[userId] };
      const count = (selfAnchor ? 1 : 0) + Object.values(next).filter(Boolean).length;
      if (count > MAX_ANCHORS) return prev;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const anchorList = [
      ...(selfAnchor ? [currentUserId] : []),
      ...matches.filter((m) => anchorIds[m.userId]).map((m) => m.userId),
    ];
    try {
      const proposal = await createProposal(memberIds, anchorList);
      await respondToProposal(proposal.id, 'ACCEPTED');
      toast.success(`Invitations sent to ${total - 1} people!`);
      onCreated();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not send the invitations.'));
    } finally {
      setSubmitting(false);
    }
  };

  const missingToMin = Math.max(0, MIN_TOTAL - total);
  const anchorHint =
    anchorCount < MIN_ANCHORS
      ? `Pick ${MIN_ANCHORS - anchorCount} more Anchor${MIN_ANCHORS - anchorCount === 1 ? '' : 's'}`
      : anchorCount > MAX_ANCHORS
        ? `At most ${MAX_ANCHORS} Anchors`
        : null;

  return (
    <Modal open={open} onClose={onClose} title="Form your Nest" maxWidth="max-w-lg">
      <div className="space-y-5">
        {/* Rules banner */}
        <div className="flex items-start gap-3 rounded-xl border border-accent-400/15 bg-accent-400/[0.05] px-4 py-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-secondary">
            Every Nest needs{' '}
            <strong className="text-primary">{MIN_TOTAL}–{MAX_TOTAL} people</strong> with{' '}
            <strong className="text-primary">{MIN_ANCHORS}–{MAX_ANCHORS} Anchors</strong> to guide the journey.
          </p>
        </div>

        {/* Members list */}
        <div className="max-h-80 space-y-2 overflow-y-auto pr-1 no-scrollbar">
          <MemberRow
            name={`${currentUserName} (you)`}
            isAnchor={selfAnchor}
            onToggleAnchor={() => setSelfAnchor((v) => (anchorCount >= MAX_ANCHORS ? v : !v))}
          />

          <AnimatePresence initial={false}>
            {matches.map((m) => (
              <motion.div
                key={m.userId}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <MemberRow
                  name={m.fullName}
                  score={m.overallScore}
                  isAnchor={anchorIds[m.userId]}
                  onToggleAnchor={() => toggleAnchor(m.userId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Status footer */}
        <div className="space-y-3 rounded-xl border border-white/[0.07] bg-surface/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted" />
              <span className="text-secondary">
                <span className={cn('font-bold', total >= MIN_TOTAL ? 'text-primary' : 'text-amber-400')}>
                  {total}
                </span>
                <span className="text-muted"> / {MAX_TOTAL}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Crown className={cn('h-4 w-4', anchorCount >= MIN_ANCHORS ? 'text-amber-400' : 'text-muted')} />
              <span className={cn('font-bold', anchorCount >= MIN_ANCHORS ? 'text-primary' : 'text-amber-400')}>
                {anchorCount}
              </span>
              <span className="text-muted"> Anchor{anchorCount === 1 ? '' : 's'}</span>
            </div>
          </div>

          {/* Hint line */}
          <AnimatePresence mode="wait">
            {missingToMin > 0 ? (
              <motion.p
                key="missing"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-center gap-1.5 text-xs text-amber-400"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Invite {missingToMin} more from Discover to reach {MIN_TOTAL}.
              </motion.p>
            ) : anchorHint ? (
              <motion.p
                key="anchor"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-center gap-1.5 text-xs text-amber-400"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {anchorHint}.
              </motion.p>
            ) : (
              <motion.p
                key="ready"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="flex items-center gap-1.5 text-xs text-emerald-400"
              >
                <Check className="h-3.5 w-3.5" />
                Ready — everyone will get an invitation.
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            fullWidth
            isLoading={submitting}
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
            className={cn(
              'h-11 rounded-xl transition-all duration-300',
              canSubmit ? 'shadow-glow hover:shadow-[0_0_24px_rgba(14,165,233,0.35)]' : 'opacity-60'
            )}
          >
            {submitting ? 'Sending invitations…' : `Send ${total} invitations`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MemberRow({
  name,
  score,
  isAnchor,
  onToggleAnchor,
}: {
  name: string;
  score?: number;
  isAnchor: boolean;
  onToggleAnchor: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-all duration-200',
        isAnchor
          ? 'border-amber-400/30 bg-amber-400/[0.08] shadow-[0_0_12px_rgba(251,191,36,0.08)]'
          : 'border-white/[0.06] bg-surface/40 hover:bg-surface/70'
      )}
    >
      <Avatar name={name} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-primary">{name}</span>
        {score !== undefined && (
          <span className="block text-[11px] text-muted">{Math.round(score)}% compatibility</span>
        )}
      </span>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleAnchor}
        aria-pressed={isAnchor}
        aria-label={`Make ${name} an Anchor`}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200',
          isAnchor
            ? 'border-amber-400/40 bg-amber-400/15 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.15)]'
            : 'border-white/10 text-muted hover:border-amber-400/25 hover:text-secondary'
        )}
      >
        <Crown className={cn('h-3.5 w-3.5 transition-colors', isAnchor && 'fill-amber-400 text-amber-400')} />
        {isAnchor ? 'Anchor' : 'Anchor?'}
      </motion.button>
    </div>
  );
}

// Need these for the modal above
import { Check } from 'lucide-react';