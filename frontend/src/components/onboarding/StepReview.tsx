import { motion } from 'framer-motion';
import { ArrowLeft, Check, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  BUDGET_OPTIONS,
  PERSONALITY_OPTIONS,
  SCHEDULE_OPTIONS,
  SOCIAL_GOAL_OPTIONS,
  VALUE_QUESTIONS,
  WORK_TYPE_OPTIONS,
  enumLabel,
} from '@/lib/onboarding';
import { fadeUpItem, staggerContainer } from '@/lib/motion';
import type { OnboardingData } from '@/types/user.types';

interface StepReviewProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onBack: () => void;
  onEdit: (stepIndex: number) => void;
  isSubmitting: boolean;
}

/** Step 6 — everything at a glance with per-section edit shortcuts. */
export function StepReview({ data, onNext, onBack, onEdit, isSubmitting }: StepReviewProps) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUpItem}>
        <h2 className="font-display text-2xl font-bold text-primary">Looks good?</h2>
        <p className="mt-1 text-sm text-secondary">
          Review your profile before we save it. You can edit anything later.
        </p>
      </motion.div>

      <Section title="Basic info" onEdit={() => onEdit(1)}>
        <Row label="Name" value={data.fullName || '—'} />
        <Row label="City" value={data.city || '—'} />
        <Row label="Neighborhood" value={data.neighborhood || '—'} />
        <Row label="Years in city" value={String(data.yearsInCity)} />
        <Row label="Occupation" value={data.occupation || '—'} />
      </Section>

      <Section title="Personality & values" onEdit={() => onEdit(2)}>
        <Row label="Personality" value={enumLabel(PERSONALITY_OPTIONS, data.personalityType)} />
        {VALUE_QUESTIONS.map((q) => (
          <Row key={q.key} label={q.label} value={`${data.values[q.key] ?? 3}/5`} />
        ))}
      </Section>

      <Section title="Interests" onEdit={() => onEdit(3)}>
        <div className="flex flex-wrap gap-2">
          {data.interests.length === 0 ? (
            <span className="text-sm text-[var(--text-muted)]">None selected</span>
          ) : (
            data.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-accent-400/30 bg-accent-400/10 px-3 py-1 text-xs font-medium text-accent-200"
              >
                {interest}
              </span>
            ))
          )}
        </div>
      </Section>

      <Section title="Lifestyle" onEdit={() => onEdit(4)}>
        <Row label="Work" value={enumLabel(WORK_TYPE_OPTIONS, data.workType)} />
        <Row label="Schedule" value={enumLabel(SCHEDULE_OPTIONS, data.schedulePreference)} />
        <Row label="Goal" value={enumLabel(SOCIAL_GOAL_OPTIONS, data.socialGoal)} />
        <Row label="Budget" value={enumLabel(BUDGET_OPTIONS, data.budgetLevel)} />
      </Section>

      <motion.div variants={fadeUpItem} className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
          Back
        </Button>
        <Button
          isLoading={isSubmitting}
          disabled={isSubmitting}
          onClick={() => onNext(data)}
          rightIcon={!isSubmitting ? <Check className="h-4 w-4" aria-hidden="true" /> : undefined}
        >
          {isSubmitting ? 'Saving…' : 'Finish & save'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

interface SectionProps {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

/** Summary card with an edit shortcut in the corner. */
function Section({ title, onEdit, children }: SectionProps) {
  return (
    <motion.div
      variants={fadeUpItem}
      className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-widest text-muted">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-accent-300 transition-colors hover:bg-accent-400/10 hover:text-accent-200"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Edit
        </button>
      </div>
      <dl className="space-y-2">{children}</dl>
    </motion.div>
  );
}

interface RowProps {
  label: string;
  value: string;
}

/** Label/value row inside a review card. */
function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-primary">{value}</dd>
    </div>
  );
}
