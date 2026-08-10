import { useState } from 'react';
import { AlertTriangle, Copy, Flag, LogOut, Trophy, type LucideIcon } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LeaveNestModal } from '@/components/nest/LeaveNestModal';
import { useToast } from '@/hooks/useToast';
import { weekOf } from '@/lib/nest';
import { nestDetailPath } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { NestResponse } from '@/types/nest.types';

interface NestActionsProps {
  nest: NestResponse;
  isAnchor: boolean;
  onLeave: () => void;
  onGraduate: () => void;
  onDisband: () => void;
}

interface ActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'gold' | 'danger';
}

/** One full-width action row inside the card. */
function ActionRow({ icon: Icon, label, onClick, tone = 'default' }: ActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
        tone === 'default' && 'text-secondary hover:bg-white/[0.04] hover:text-primary',
        tone === 'gold' && 'text-amber-300 hover:bg-amber-400/10',
        tone === 'danger' && 'text-rose-400 hover:bg-rose-500/10'
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border',
          tone === 'default' && 'border-white/[0.06] bg-white/[0.03]',
          tone === 'gold' && 'border-amber-400/30 bg-amber-400/10',
          tone === 'danger' && 'border-rose-500/25 bg-rose-500/10'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

/**
 * Nest Actions card: share the Nest link, report an issue, leave the Nest,
 * and (anchors only) graduate or disband once the journey is over.
 */
export function NestActions({ nest, isAnchor, onLeave, onGraduate, onDisband }: NestActionsProps) {
  const toast = useToast();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [confirm, setConfirm] = useState<null | 'leave' | 'graduate' | 'disband'>(null);

  const canGraduate = weekOf(nest.startDate) >= 6;
  const ended = nest.status === 'GRADUATED' || nest.status === 'DISBANDED';

  const handleShare = async () => {
    const url = `${window.location.origin}${nestDetailPath(nest.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Nest link copied to clipboard!');
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  const handleReport = () => {
    setReportOpen(false);
    setReportText('');
    toast.info('Thanks — your report has been logged.');
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-deep/60 p-6 backdrop-blur-xl">
      <h2 className="mb-3 font-display text-lg font-bold text-primary">Nest Actions</h2>
      <div className="space-y-1">
        <ActionRow icon={Copy} label="Share Nest Link" onClick={() => void handleShare()} />
        <ActionRow icon={Flag} label="Report Issue" onClick={() => setReportOpen(true)} />
        <ActionRow icon={LogOut} label="Leave Nest" tone="danger" onClick={() => setConfirm('leave')} />
        {isAnchor && !ended && canGraduate && (
          <ActionRow icon={Trophy} label="Initiate Graduation" tone="gold" onClick={() => setConfirm('graduate')} />
        )}
        {isAnchor && !ended && (
          <ActionRow icon={AlertTriangle} label="Disband Nest" tone="danger" onClick={() => setConfirm('disband')} />
        )}
        {isAnchor && !ended && !canGraduate && (
          <p className="px-3 pb-1 pt-2 text-xs text-muted">
            Graduation unlocks after Week 6 — your Nest is currently in Week {weekOf(nest.startDate)}.
          </p>
        )}
      </div>

      {/* Report issue */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report an Issue" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-xs text-secondary">Tell us what went wrong — the NeighborNest team will look into it.</p>
          <Textarea
            rows={4}
            placeholder="Describe the issue…"
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
          />
          <Button fullWidth disabled={!reportText.trim()} onClick={handleReport}>
            Submit Report
          </Button>
        </div>
      </Modal>

      {/* Confirmations */}
      <LeaveNestModal
        open={confirm === 'leave'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          onLeave();
        }}
      />
      <ConfirmationModal
        open={confirm === 'graduate'}
        onClose={() => setConfirm(null)}
        title="Initiate Graduation?"
        description="Graduate the Nest and celebrate everything you've built together over these six weeks."
        confirmLabel="Graduate Nest"
        confirmVariant="primary"
        icon={Trophy}
        accent="info"
        onConfirm={() => {
          setConfirm(null);
          onGraduate();
        }}
      />
      <ConfirmationModal
        open={confirm === 'disband'}
        onClose={() => setConfirm(null)}
        title="Disband this Nest?"
        description="This permanently ends the Nest for every member. This action cannot be undone."
        confirmLabel="Disband Nest"
        icon={AlertTriangle}
        onConfirm={() => {
          setConfirm(null);
          onDisband();
        }}
      />
    </section>
  );
}
