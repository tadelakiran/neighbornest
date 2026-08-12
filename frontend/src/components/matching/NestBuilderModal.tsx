import { useMemo, useState } from 'react';
import { Crown, Users } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/hooks/useToast';
import { cn, getErrorMessage } from '@/lib/utils';
import { createProposal, respondToProposal } from '@/services/matchingService';
import type { CompatibleUserResponse } from '@/types/matching.types';

/** Product rules — mirror the matching-service validation. */
const MIN_TOTAL = 5;
const MAX_TOTAL = 8;
const MIN_ANCHORS = 1;
const MAX_ANCHORS = 2;

interface NestBuilderModalProps {
  open: boolean;
  onClose: () => void;
  /** The compatible matches the user selected on the Discover page. */
  matches: CompatibleUserResponse[];
  /** Profile id of the current user (always a member of the proposal). */
  currentUserId: number;
  /** Display name of the current user. */
  currentUserName: string;
  /** Fired after the proposal is created (and the creator auto-accepts). */
  onCreated: () => void;
}

/**
 * Nest formation modal — turns selected Discover matches into a real Nest
 * proposal. The current user is always a member; 5–8 people total with 1–2
 * Anchors per the product guidelines. Anchors are picked with the crown
 * toggle on any member (including yourself).
 */
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
      if (count > MAX_ANCHORS) {
        // Reject the toggle to keep anchors within the 1–2 limit.
        return prev;
      }
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
      // The creator is a member too — accept immediately so their invitation
      // never lingers in their own Proposals inbox.
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
      <div className="space-y-4">
        {/* Rules banner */}
        <div className="flex items-center gap-3 rounded-xl border border-accent-400/20 bg-accent-400/[0.06] px-3.5 py-2.5">
          <Users className="h-5 w-5 shrink-0 text-accent-300" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-secondary">
            Every Nest needs <strong className="text-primary">{MIN_TOTAL}–{MAX_TOTAL} people</strong> and{' '}
            <strong className="text-primary">{MIN_ANCHORS}–{MAX_ANCHORS} Anchors</strong> to guide the 6-week journey.
          </p>
        </div>

        {/* Members */}
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {/* Self (always included) */}
          <MemberRow
            name={`${currentUserName} (you)`}
            isAnchor={selfAnchor}
            onToggleAnchor={() => setSelfAnchor((v) => (anchorCount >= MAX_ANCHORS ? v : !v))}
          />

          {matches.map((m) => (
            <MemberRow
              key={m.userId}
              name={m.fullName}
              score={m.overallScore}
              isAnchor={anchorIds[m.userId]}
              onToggleAnchor={() => toggleAnchor(m.userId)}
            />
          ))}
        </div>

        {/* Status + submit */}
        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-surface/60 p-3.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">
              {total}/{MAX_TOTAL} people
            </span>
            <span className="text-secondary">
              {anchorCount} Anchor{anchorCount === 1 ? '' : 's'}
            </span>
          </div>
          {missingToMin > 0 ? (
            <p className="text-xs text-muted">
              Invite {missingToMin} more match{missingToMin === 1 ? '' : 'es'} from Discover to reach {MIN_TOTAL} people.
            </p>
          ) : anchorHint ? (
            <p className="text-xs text-amber-400">{anchorHint}.</p>
          ) : (
            <p className="text-xs text-emerald-400">Ready — everyone will get an invitation.</p>
          )}
          <Button fullWidth isLoading={submitting} disabled={!canSubmit} onClick={() => void handleSubmit()} className="shadow-glow">
            {submitting ? 'Sending invitations…' : `Send ${total} invitations`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/** A single member row with an Anchor crown toggle. */
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
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
        isAnchor ? 'border-amber-400/40 bg-amber-400/[0.07]' : 'border-white/[0.06] bg-surface/50'
      )}
    >
      <Avatar name={name} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-primary">{name}</span>
        {score !== undefined && (
          <span className="block text-[11px] text-muted">{Math.round(score)}% compatibility</span>
        )}
      </span>
      <button
        onClick={onToggleAnchor}
        aria-pressed={isAnchor}
        aria-label={`Make ${name} an Anchor`}
        title="Toggle Anchor"
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors',
          isAnchor
            ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
            : 'border-white/10 text-muted hover:text-secondary'
        )}
      >
        <Crown className={cn('h-3.5 w-3.5', isAnchor && 'fill-amber-400 text-amber-400')} aria-hidden="true" />
        {isAnchor ? 'Anchor' : 'Anchor?'}
      </button>
    </div>
  );
}
