import { Pencil, MapPin,  User, Heart } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-primary">Profile info</h3>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={onEdit}
          className="rounded-xl border border-white/[0.08] bg-surface-2 text-secondary hover:border-accent-400/30 hover:text-primary"
        >
          Edit profile
        </Button>
      </div>

      <InfoGroup title="Basic" icon={User}>
        <Row label="City"          value={profile.city          || '—'} />
        <Row label="Neighborhood"  value={profile.neighborhood  || '—'} />
        <Row label="Years in city" value={String(profile.yearsInCity)} />
        <Row label="Occupation"    value={profile.occupation    || '—'} />
        <Row label="Work"          value={enumLabel(WORK_TYPE_OPTIONS, profile.workType)} />
      </InfoGroup>

      <InfoGroup title="Personality & lifestyle" icon={Heart}>
        <Row label="Personality"  value={enumLabel(PERSONALITY_OPTIONS, profile.personalityType)} />
        <Row label="Schedule"     value={enumLabel(SCHEDULE_OPTIONS, profile.schedulePreference)} />
        <Row label="Social goal"  value={enumLabel(SOCIAL_GOAL_OPTIONS, profile.socialGoal)} />
        <Row label="Budget level" value={enumLabel(BUDGET_OPTIONS, profile.budgetLevel)} />
      </InfoGroup>

      <InfoGroup title="Interests & values" icon={MapPin}>
        {interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-accent-400/20 bg-accent-400/10 px-3 py-1 text-xs font-medium text-accent-300 transition-colors hover:border-accent-400/40"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No interests recorded yet.</p>
        )}

        {valueRatings.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {valueRatings.map((answer) => {
              const question = VALUE_QUESTIONS.find((q) => q.key === answer.questionKey);
              if (!question) return null;
              return (
                <span
                  key={answer.questionKey}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-surface-2 px-3 py-1.5 text-xs text-secondary"
                >
                  <span className="text-muted">{question.label}:</span>
                  <span className="font-bold text-accent-400">{answer.answerValue}/5</span>
                </span>
              );
            })}
          </div>
        )}
      </InfoGroup>
    </div>
  );
}

function InfoGroup({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl border border-white/[0.08] bg-surface/50 p-5 backdrop-blur-sm shadow-lg shadow-black/5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-400/10 text-accent-400">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">{title}</h4>
      </div>
      <dl className="space-y-3">{children}</dl>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="group flex items-center justify-between gap-4 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.03]">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="truncate text-sm font-semibold text-primary">{value}</dd>
    </div>
  );
}