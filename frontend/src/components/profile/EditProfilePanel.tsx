import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
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
import type {
  BudgetLevel,
  PersonalityType,
  ProfileUpdateRequest,
  SchedulePreference,
  SocialGoal,
  UserProfile,
  WorkType,
} from '@/types/user.types';

/** Validation schema for the edit form (selects pass '' when untouched). */
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
  /** Persists via the optimistic-update hook; may reject with the error. */
  onSave: (patch: ProfileUpdateRequest) => Promise<void>;
}

/**
 * Edit Profile slide-over: dark backdrop, panel slides in from the right
 * (w-full on mobile, 480px on desktop), form pre-filled from the profile.
 */
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

  // Re-seed the form whenever the panel opens or the profile changes.
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
      // Error toast is shown by the caller; keep the panel open to retry.
    }
  });

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="absolute inset-y-0 right-0 flex w-full flex-col border-l border-slate-700 bg-slate-800 shadow-2xl shadow-black/50 sm:w-[480px]"
          >
            <div className="flex items-center justify-between border-b border-slate-700/70 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Edit profile</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close edit panel"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden" noValidate>
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <Input id="ep-fullName" label="Full name" error={errors.fullName?.message} {...register('fullName')} />
                <Input id="ep-city" label="City" error={errors.city?.message} {...register('city')} />
                <Input id="ep-neighborhood" label="Neighborhood" error={errors.neighborhood?.message} {...register('neighborhood')} />
                <Input id="ep-yearsInCity" type="number" label="Years in city" error={errors.yearsInCity?.message} {...register('yearsInCity')} />
                <Input id="ep-occupation" label="Occupation" error={errors.occupation?.message} {...register('occupation')} />

                <Controller
                  name="workType"
                  control={control}
                  render={({ field }) => (
                    <Select label="Work type" value={field.value} onChange={field.onChange} options={WORK_TYPE_OPTIONS} error={errors.workType?.message} />
                  )}
                />
                <Controller
                  name="personalityType"
                  control={control}
                  render={({ field }) => (
                    <Select label="Personality" value={field.value} onChange={field.onChange} options={PERSONALITY_OPTIONS} error={errors.personalityType?.message} />
                  )}
                />
                <Controller
                  name="schedulePreference"
                  control={control}
                  render={({ field }) => (
                    <Select label="Schedule" value={field.value} onChange={field.onChange} options={SCHEDULE_OPTIONS} error={errors.schedulePreference?.message} />
                  )}
                />
                <Controller
                  name="socialGoal"
                  control={control}
                  render={({ field }) => (
                    <Select label="Social goal" value={field.value} onChange={field.onChange} options={SOCIAL_GOAL_OPTIONS} error={errors.socialGoal?.message} />
                  )}
                />
                <Controller
                  name="budgetLevel"
                  control={control}
                  render={({ field }) => (
                    <Select label="Budget level" value={field.value} onChange={field.onChange} options={BUDGET_OPTIONS} error={errors.budgetLevel?.message} />
                  )}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-700/70 px-6 py-4">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
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
