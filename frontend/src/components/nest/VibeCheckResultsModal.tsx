import { Modal } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CircularScore } from '@/components/matching/CircularScore';
import { Quote, Users } from 'lucide-react';
import type { VibeCheckStatusResponse } from '@/types/nest.types';

interface VibeCheckResultsModalProps {
  open: boolean;
  onClose: () => void;
  status: VibeCheckStatusResponse | null;
  totalMembers: number;
}

/**
 * Vibe-check results modal (anchors). Shows animated average rings for
 * connection and comfort, submission progress, anonymous individual score
 * pairs, and feedback quotes.
 */
export function VibeCheckResultsModal({ open, onClose, status, totalMembers }: VibeCheckResultsModalProps) {
  const submissions = status?.submissions ?? [];
  const connection = status?.averageConnection ?? 0;
  const comfort = status?.averageComfort ?? 0;
  const count = status?.submissionCount ?? 0;
  const quotes = submissions.map((s) => s.feedback).filter((f): f is string => Boolean(f?.trim()));

  return (
    <Modal open={open} onClose={onClose} title="Vibe Check Results" maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Averages */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-1.5">
            <CircularScore value={connection * 10} size={128} label="connection" />
            <p className="text-xs text-muted">{connection.toFixed(1)} / 10</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <CircularScore value={comfort * 10} size={128} label="comfort" />
            <p className="text-xs text-muted">{comfort.toFixed(1)} / 10</p>
          </div>
        </div>

        {/* Participation */}
        <div className="rounded-xl border border-white/[0.06] bg-surface/60 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted">
            <Users className="h-3.5 w-3.5 text-accent-400" aria-hidden="true" />
            {count} of {Math.max(totalMembers, count)} members checked in
          </p>
          <ProgressBar value={totalMembers > 0 ? (count / totalMembers) * 100 : 0} />
        </div>

        {/* Anonymous individual responses */}
        {submissions.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Individual responses</h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {submissions.map((s) => (
                <div key={s.userId} className="rounded-xl border border-white/[0.06] bg-surface/60 p-3 text-center">
                  <p className="font-display text-xl font-bold text-primary">{s.connectionScore}<span className="text-xs text-muted">/{s.comfortScore}</span></p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">connection / comfort</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback quotes */}
        {quotes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted">What members shared</h4>
            {quotes.map((quote, i) => (
              <blockquote key={i} className="rounded-xl border-l-2 border-accent-400/50 bg-white/[0.03] px-4 py-3 text-sm italic leading-relaxed text-secondary">
                <Quote className="mb-1 inline h-3.5 w-3.5 text-accent-400/70" aria-hidden="true" />
                {quote}
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
