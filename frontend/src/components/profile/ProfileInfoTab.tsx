import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  BUDGET_OPTIONS,
  PERSONALITY_OPTIONS,
  SCHEDULE_OPTIONS,
  SOCIAL_GOAL_OPTIONS,
  VALUE_QUESTIONS,
  WORK_TYPE_OPTIONS,
  enumLabel,
} from '@/lib/onboarding';
import type { UserProfile } from '@/types/user.types';

interface ProfileInfoTabProps {
  profile: UserProfile;
  onEdit:  () => void;
}

export function ProfileInfoTab({ profile, onEdit }: ProfileInfoTabProps) {
  const answers      = profile.onboardingAnswers ?? [];
  const interests    = answers.filter((a) => a.questionKey.startsWith('interest_')).map((a) => a.answerValue);
  const valueRatings = answers.filter((a) => a.questionKey.startsWith('values_'));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-[var(--text-primary)]">Profile info</h3>
        <Button variant="secondary" size="sm" leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />} onClick={onEdit}>
          Edit profile
        </Button>
      </div>

      <InfoGroup title="Basic">
        <Row label="City"          value={profile.city          || '—'} />
        <Row label="Neighborhood"  value={profile.neighborhood  || '—'} />
        <Row label="Years in city" value={String(profile.yearsInCity)} />
        <Row label="Occupation"    value={profile.occupation    || '—'} />
        <Row label="Work"          value={enumLabel(WORK_TYPE_OPTIONS, profile.workType)} />
      </InfoGroup>

      <InfoGroup title="Personality & lifestyle">
        <Row label="Personality"  value={enumLabel(PERSONALITY_OPTIONS, profile.personalityType)} />
        <Row label="Schedule"     value={enumLabel(SCHEDULE_OPTIONS, profile.schedulePreference)} />
        <Row label="Social goal"  value={enumLabel(SOCIAL_GOAL_OPTIONS, profile.socialGoal)} />
        <Row label="Budget level" value={enumLabel(BUDGET_OPTIONS, profile.budgetLevel)} />
      </InfoGroup>

      <InfoGroup title="Interests & values">
        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-700"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No interests recorded yet.</p>
        )}

        {valueRatings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {valueRatings.map((answer) => {
              const question = VALUE_QUESTIONS.find((q) => q.key === answer.questionKey);
              if (!question) return null;
              return (
                <span
                  key={answer.questionKey}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                >
                  {question.label}: <span className="font-semibold text-accent-600">{answer.answerValue}/5</span>
                </span>
              );
            })}
          </div>
        )}
      </InfoGroup>
    </div>
  );
}

function InfoGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h4 className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">{title}</h4>
      <dl className="space-y-2.5">{children}</dl>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-2 last:border-0 last:pb-0">
      <dt className="text-xs text-[var(--text-muted)]">{label}</dt>
      <dd className="truncate text-sm font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}
