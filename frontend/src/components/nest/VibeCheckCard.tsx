import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Heart, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Textarea } from '@/components/ui/Textarea';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { CustomSlider } from '@/components/nest/CustomSlider';
import { addWeeks } from '@/lib/nest';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/lib/utils';
import type { NestResponse, VibeCheckRequest, VibeCheckStatusResponse } from '@/types/nest.types';

interface VibeCheckCardProps {
  nest: NestResponse;
  status: VibeCheckStatusResponse | null;
  currentUserId: number;
  isAnchor: boolean;
  onSubmit: (data: VibeCheckRequest) => Promise<void>;
  onViewResults: () => void;
}

type Phase = 'form' | 'thanks' | 'preview';

/**
 * The Week-3 Vibe Check card. Three states:
 *  - form: sliders + feedback when the check is open and not yet submitted
 *  - thanks: animated checkmark for ~3s after submitting, then fades away
 *  - preview: confirmation + group averages (with a results button for anchors)
 * Before Week 3 the card is locked with a countdown to the unlock date.
 */
export function VibeCheckCard({ nest, status, currentUserId, isAnchor, onSubmit, onViewResults }: VibeCheckCardProps) {
  const toast = useToast();
  const hasUserSubmitted = status?.submissions.some((s) => s.userId === currentUserId) ?? false;

  const [phase, setPhase] = useState<Phase>(hasUserSubmitted ? 'preview' : 'form');
  const [connection, setConnection] = useState(7);
  const [comfort, setComfort] = useState(8);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const thanksTimer = useRef<number | null>(null);

  // Clean up the thanks→preview timer if the card unmounts mid-transition.
  useEffect(() => {
    return () => {
      if (thanksTimer.current !== null) window.clearTimeout(thanksTimer.current);
    };
  }, []);

  // Sync phase when the status arrives/updates from outside (e.g. page reload).
  useEffect(() => {
    if (hasUserSubmitted && phase === 'form') setPhase('preview');
  }, [hasUserSubmitted, phase]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ connectionScore: connection, comfortScore: comfort, feedback: feedback.trim() || undefined });
      setPhase('thanks');
      toast.success('Check-in submitted — thanks for sharing!');
      thanksTimer.current = window.setTimeout(() => setPhase('preview'), 3000);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit your check-in.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Locked (not yet Week 3, or the Nest ended) ──
  if (nest.status !== 'VIBE_CHECK') {
    const disbanded = nest.status === 'DISBANDED';
    const unlock = addWeeks(nest.startDate, 2);
    const unlockInPast = unlock ? new Date(`${unlock}T00:00:00`).getTime() <= Date.now() : false;
    return (
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-deep)]/60 p-6 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <Heart className="h-5 w-5 text-muted" aria-hidden="true" />
          Vibe Check
        </h2>
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] px-6 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-raised)]/40">
            <Lock className="h-5 w-5 text-muted" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">
              {disbanded ? 'This Nest has disbanded' : 'Vibe Check unlocks in Week 3'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {disbanded
                ? 'Vibe checks are only open for active Nests.'
                : unlock
                  ? 'Your Anchor will open it for everyone to share how things feel.'
                  : 'We’ll open it automatically when the time comes.'}
            </p>
          </div>
          {!disbanded && unlock && !unlockInPast && (
            <CountdownTimer expiresAt={`${unlock}T00:00:00`} prefix="Unlocks in" className="text-muted" />
          )}
          {!disbanded && unlock && unlockInPast && (
            <p className="text-xs font-semibold text-accent-300">Available soon — your Anchor will open it.</p>
          )}
        </div>
      </section>
    );
  }

  const avg = status?.averageConnection ?? 0;
  const count = status?.submissionCount ?? 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border-2 border-royal-500/30 bg-deep/70 p-6 shadow-[0_0_32px_rgba(96,165,250,0.15)] backdrop-blur-xl"
    >
      <AnimatePresence mode="wait" initial={false}>
        {phase === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
              <Heart className="h-5 w-5 text-royal-300" aria-hidden="true" />
              How’s your Nest feeling?
            </h2>
            <p className="mt-1 text-xs text-secondary">Week 3 check-in — your feedback helps us improve matches.</p>

            <div className="mt-5 space-y-5">
              <CustomSlider label="Connection Level" value={connection} onChange={setConnection} />
              <CustomSlider label="Comfort Level" value={comfort} onChange={setComfort} />
              <Textarea
                label="Anything you’d like to share? (optional)"
                rows={3}
                placeholder="Tell your Anchor how the group is settling in…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button fullWidth isLoading={submitting} onClick={() => void handleSubmit()} className="shadow-glow">
                {submitting ? 'Submitting…' : 'Submit Check-in'}
              </Button>
            </div>
          </motion.div>
        )}

        {phase === 'thanks' && (
          <motion.div key="thanks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }} className="flex flex-col items-center gap-3 py-8 text-center">
            <motion.svg viewBox="0 0 52 52" className="h-16 w-16" aria-hidden="true">
              <motion.circle cx="26" cy="26" r="24" fill="none" stroke="#38bdf8" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
              <motion.path
                fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                d="M14 27l8 8 16-16"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.4, duration: 0.35, ease: 'easeOut' }}
              />
            </motion.svg>
            <p className="font-display text-lg font-bold text-primary">Thanks for checking in!</p>
            <p className="text-xs text-secondary">Your Anchor can now see how the Nest is doing.</p>
          </motion.div>
        )}

        {phase === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-primary">
              <CheckCircle2 className="h-5 w-5 text-sky-400" aria-hidden="true" />
              Thanks for checking in!
            </h2>
            <p className="mt-1 text-xs text-secondary">Your Nest’s pulse, at a glance.</p>

            <div className="mt-4 space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/60 p-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-secondary">Group average — connection</span>
                  <span className="font-semibold text-primary">{avg.toFixed(1)} / 10</span>
                </div>
                <ProgressBar value={avg * 10} />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-secondary">Members checked in</span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Users className="h-3 w-3 text-accent-400" aria-hidden="true" />
                    {count} / {nest.members.length}
                  </span>
                </div>
                <ProgressBar value={nest.members.length > 0 ? (count / nest.members.length) * 100 : 0} />
              </div>
            </div>

            {isAnchor && (
              <Button variant="outline" size="sm" fullWidth className="mt-4" onClick={onViewResults}>
                View Results
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
