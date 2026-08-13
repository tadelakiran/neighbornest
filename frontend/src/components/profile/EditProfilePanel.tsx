import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  BUDGET_OPTIONS,
  PERSONALITY_OPTIONS,
  SCHEDULE_OPTIONS,
  SOCIAL_GOAL_OPTIONS,
  WORK_TYPE_OPTIONS,
} from '@/lib/onboarding';
import { cn } from '@/lib/utils';
import type {
  BudgetLevel,
  PersonalityType,
  ProfileUpdateRequest,
  SchedulePreference,
  SocialGoal,
  UserProfile,
  WorkType,
} from '@/types/user.types';

const editSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  city: z.string().min(1, 'City is required'),
  neighborhood: z.string().optional(),
  yearsInCity: z.coerce.number().min(0, 'Cannot be negative').max(80, 'That seems high'),
  occupation: z.string().optional(),
  workType: z.string(),
  personalityType: z.string(),
  schedulePreference: z.string(),
  socialGoal: z.string(),
  budgetLevel: z.string(),
});

type EditValues = z.infer<typeof editSchema>;

interface EditProfilePanelProps {
  profile: UserProfile;
  open: boolean;
  onClose: () => void;
  onSave: (patch: ProfileUpdateRequest) => Promise<void>;
}

export function EditProfilePanel({ profile, open, onClose, onSave }: EditProfilePanelProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: profile.fullName,
      city: profile.city ?? '',
      neighborhood: profile.neighborhood ?? '',
      yearsInCity: profile.yearsInCity,
      occupation: profile.occupation ?? '',
      workType: profile.workType ?? '',
      personalityType: profile.personalityType ?? '',
      schedulePreference: profile.schedulePreference ?? '',
      socialGoal: profile.socialGoal ?? '',
      budgetLevel: profile.budgetLevel ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        fullName: profile.fullName,
        city: profile.city ?? '',
        neighborhood: profile.neighborhood ?? '',
        yearsInCity: profile.yearsInCity,
        occupation: profile.occupation ?? '',
        workType: profile.workType ?? '',
        personalityType: profile.personalityType ?? '',
        schedulePreference: profile.schedulePreference ?? '',
        socialGoal: profile.socialGoal ?? '',
        budgetLevel: profile.budgetLevel ?? '',
      });
    }
  }, [open, profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await onSave({
        fullName: values.fullName,
        city: values.city,
        neighborhood: values.neighborhood,
        yearsInCity: values.yearsInCity,
        occupation: values.occupation,
        workType: (values.workType || undefined) as WorkType | undefined,
        personalityType: (values.personalityType || undefined) as PersonalityType | undefined,
        schedulePreference: (values.schedulePreference || undefined) as SchedulePreference | undefined,
        socialGoal: (values.socialGoal || undefined) as SocialGoal | undefined,
        budgetLevel: (values.budgetLevel || undefined) as BudgetLevel | undefined,
      });
      onClose();
    } catch {
      // Error toast shown by caller
    }
  });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className={cn(
              'absolute inset-y-0 right-0 flex w-full flex-col',
              'border-l border-white/[0.08] bg-deep/95 shadow-2xl backdrop-blur-2xl',
              'sm:w-[480px]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-400/10 ring-1 ring-accent-400/20">
                  <User className="h-4 w-4 text-accent-400" aria-hidden="true" />
                </span>
                <h2 className="font-display text-lg font-bold text-primary">Edit profile</h2>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onClose}
                aria-label="Close edit panel"
                className="rounded-xl p-2 text-muted transition-colors hover:bg-white/[0.06] hover:text-primary"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden" noValidate>
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6 no-scrollbar">
                <Input
                  id="ep-fullName"
                  label="Full name"
                  error={errors.fullName?.message}
                  className="rounded-xl border-white/[0.08] bg-surface-2 transition-all focus-within:border-accent-400/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                  {...register('fullName')}
                />
                <Input
                  id="ep-city"
                  label="City"
                  error={errors.city?.message}
                  className="rounded-xl border-white/[0.08] bg-surface-2 transition-all focus-within:border-accent-400/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                  {...register('city')}
                />
                <Input
                  id="ep-neighborhood"
                  label="Neighborhood"
                  error={errors.neighborhood?.message}
                  className="rounded-xl border-white/[0.08] bg-surface-2 transition-all focus-within:border-accent-400/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                  {...register('neighborhood')}
                />
                <Input
                  id="ep-yearsInCity"
                  type="number"
                  label="Years in city"
                  error={errors.yearsInCity?.message}
                  className="rounded-xl border-white/[0.08] bg-surface-2 transition-all focus-within:border-accent-400/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                  {...register('yearsInCity')}
                />
                <Input
                  id="ep-occupation"
                  label="Occupation"
                  error={errors.occupation?.message}
                  className="rounded-xl border-white/[0.08] bg-surface-2 transition-all focus-within:border-accent-400/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                  {...register('occupation')}
                />

                <Controller
                  name="workType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Work type"
                      value={field.value}
                      onChange={field.onChange}
                      options={WORK_TYPE_OPTIONS}
                      error={errors.workType?.message}
                    />
                  )}
                />
                <Controller
                  name="personalityType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Personality"
                      value={field.value}
                      onChange={field.onChange}
                      options={PERSONALITY_OPTIONS}
                      error={errors.personalityType?.message}
                    />
                  )}
                />
                <Controller
                  name="schedulePreference"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Schedule"
                      value={field.value}
                      onChange={field.onChange}
                      options={SCHEDULE_OPTIONS}
                      error={errors.schedulePreference?.message}
                    />
                  )}
                />
                <Controller
                  name="socialGoal"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Social goal"
                      value={field.value}
                      onChange={field.onChange}
                      options={SOCIAL_GOAL_OPTIONS}
                      error={errors.socialGoal?.message}
                    />
                  )}
                />
                <Controller
                  name="budgetLevel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label="Budget level"
                      value={field.value}
                      onChange={field.onChange}
                      options={BUDGET_OPTIONS}
                      error={errors.budgetLevel?.message}
                    />
                  )}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
                <Button variant="ghost" onClick={onClose} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="rounded-xl shadow-glow"
                  leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
                >
                  {isSubmitting ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}