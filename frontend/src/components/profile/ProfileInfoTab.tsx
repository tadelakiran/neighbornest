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
  onEdit: () => void;
}

/**
 * Profile Info tab — the onboarding data shown read-only, grouped by category
 * (Basic, Personality & Values, Interests), with an Edit action that opens the
 * slide-over panel.
 */
export function ProfileInfoTab({ profile, onEdit }: ProfileInfoTabProps) {
  const answers = profile.onboardingAnswers ?? [];
  const interests = answers
    .filter((answer) => answer.questionKey.startsWith('interest_'))
    .map((answer) => answer.answerValue);
  const valueRatings = answers.filter((answer) => answer.questionKey.startsWith('values_'));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Profile info</h3>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
          onClick={onEdit}
        >
          Edit profile
        </Button>
      </div>

      <InfoGroup title="Basic">
        <Row label="City" value={profile.city || '—'} />
        <Row label="Neighborhood" value={profile.neighborhood || '—'} />
        <Row label="Years in city" value={String(profile.yearsInCity)} />
        <Row label="Occupation" value={profile.occupation || '—'} />
        <Row label="Work" value={enumLabel(WORK_TYPE_OPTIONS, profile.workType)} />
      </InfoGroup>

      <InfoGroup title="Personality & lifestyle">
        <Row label="Personality" value={enumLabel(PERSONALITY_OPTIONS, profile.personalityType)} />
        <Row label="Schedule" value={enumLabel(SCHEDULE_OPTIONS, profile.schedulePreference)} />
        <Row label="Social goal" value={enumLabel(SOCIAL_GOAL_OPTIONS, profile.socialGoal)} />
        <Row label="Budget level" value={enumLabel(BUDGET_OPTIONS, profile.budgetLevel)} />
      </InfoGroup>

      <InfoGroup title="Interests & values">
        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No interests recorded yet.</p>
        )}

        {valueRatings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {valueRatings.map((answer) => {
              const question = VALUE_QUESTIONS.find((q) => q.key === answer.questionKey);
              if (!question) return null;
              return (
                <span
                  key={answer.questionKey}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300"
                >
                  {question.label}: <span className="font-semibold text-emerald-300">{answer.answerValue}/5</span>
                </span>
              );
            })}
          </div>
        )}
      </InfoGroup>
    </div>
  );
}

interface InfoGroupProps {
  title: string;
  children: React.ReactNode;
}

/** Grouped card with a section title. */
function InfoGroup({ title, children }: InfoGroupProps) {
  return (
    <Card className="p-5">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h4>
      <dl className="space-y-2.5">{children}</dl>
    </Card>
  );
}

interface RowProps {
  label: string;
  value: string;
}

/** Label/value pair inside an info group. */
function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="truncate text-sm font-medium text-slate-200">{value}</dd>
    </div>
  );
}
