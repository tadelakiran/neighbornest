import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Clock3,
  Coffee,
  GraduationCap,
  Laptop,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { Select } from '@/components/ui/Select';
import { StepCard } from '@/components/ui/StepCard';
import {
  BUDGET_OPTIONS,
  SCHEDULE_OPTIONS,
  SOCIAL_GOAL_OPTIONS,
  WORK_TYPE_OPTIONS,
} from '@/lib/onboarding';
import { fadeUpItem, staggerContainer } from '@/lib/motion';
import type { BudgetLevel, OnboardingData, SchedulePreference, SocialGoal, WorkType } from '@/types/user.types';

/** Icon per work type. */
const WORK_TYPE_ICONS: Record<WorkType, typeof Briefcase> = {
  FULL_TIME: Briefcase,
  PART_TIME: Clock3,
  STUDENT: GraduationCap,
  FREELANCE: Laptop,
  RETIRED: Coffee,
  UNEMPLOYED: Search,
};

interface StepDealbreakersProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onBack: () => void;
}

/** Step 5 — lifestyle details used for lifestyle matching (hard filters). */
export function StepDealbreakers({ data, onNext, onBack }: StepDealbreakersProps) {
  const [workType, setWorkType] = useState<WorkType | null>(data.workType);
  const [schedulePreference, setSchedulePreference] = useState<SchedulePreference | null>(data.schedulePreference);
  const [socialGoal, setSocialGoal] = useState<SocialGoal | null>(data.socialGoal);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel | null>(data.budgetLevel);
  const [touched, setTouched] = useState(false);

  const complete = workType && schedulePreference && socialGoal && budgetLevel;

  const handleContinue = () => {
    setTouched(true);
    if (!complete) return;
    onNext({ ...data, workType, schedulePreference, socialGoal, budgetLevel });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={fadeUpItem}>
        <h2 className="text-2xl font-bold text-white">Your everyday rhythm</h2>
        <p className="mt-1 text-sm text-slate-400">
          These lifestyle details help us pair you with people who actually fit
          your day-to-day.
        </p>
      </motion.div>

      <motion.div variants={fadeUpItem}>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
          How do you spend your days?
        </h3>
        <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {WORK_TYPE_OPTIONS.map((option) => (
            <div key={option.value} className="w-40 shrink-0">
              <StepCard
                icon={WORK_TYPE_ICONS[option.value]}
                title={option.label}
                description={option.description}
                selected={workType === option.value}
                onClick={() => setWorkType(option.value)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUpItem} className="grid gap-5 sm:grid-cols-2">
        <Select
          label="When are you most social?"
          placeholder="Choose a schedule"
          value={schedulePreference ?? ''}
          onChange={(value) => setSchedulePreference(value as SchedulePreference)}
          options={SCHEDULE_OPTIONS}
          error={touched && !schedulePreference ? 'Required' : undefined}
        />
        <Select
          label="What do you hope to find?"
          placeholder="Choose a goal"
          value={socialGoal ?? ''}
          onChange={(value) => setSocialGoal(value as SocialGoal)}
          options={SOCIAL_GOAL_OPTIONS}
          error={touched && !socialGoal ? 'Required' : undefined}
        />
        <Select
          label="Comfortable budget level"
          placeholder="Choose a level"
          value={budgetLevel ?? ''}
          onChange={(value) => setBudgetLevel(value as BudgetLevel)}
          options={BUDGET_OPTIONS}
          error={touched && !budgetLevel ? 'Required' : undefined}
        />
      </motion.div>

      <FieldError message={touched && !complete ? 'Fill in everything to continue' : undefined} />

      <motion.div variants={fadeUpItem} className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!complete} rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
