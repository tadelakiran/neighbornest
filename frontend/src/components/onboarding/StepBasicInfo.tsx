import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Briefcase, Building2, CalendarDays, MapPin, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { fadeUpItem, staggerContainer } from '@/lib/motion';
import type { OnboardingData } from '@/types/user.types';

/** Validation schema for the basic info step. */
const basicInfoSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  city: z.string().min(1, 'City is required'),
  neighborhood: z.string().optional(),
  yearsInCity: z.coerce
    .number()
    .min(0, 'Cannot be negative')
    .max(80, 'That seems high — double check?'),
  occupation: z.string().optional(),
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

interface StepBasicInfoProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

/** Step 2 — name + where you live. Creates the profile on continue. */
export function StepBasicInfo({ data, onNext, onBack, isSubmitting }: StepBasicInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: data.fullName,
      city: data.city,
      neighborhood: data.neighborhood,
      yearsInCity: data.yearsInCity,
      occupation: data.occupation,
    },
  });

  const onSubmit = handleSubmit((values) => {
    onNext({
      ...data,
      fullName: values.fullName.trim(),
      city: values.city.trim(),
      neighborhood: values.neighborhood?.trim() ?? '',
      yearsInCity: values.yearsInCity,
      occupation: values.occupation?.trim() ?? '',
    });
  });

  return (
    <motion.form
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      onSubmit={onSubmit}
      className="space-y-8"
      noValidate
    >
      <motion.div variants={fadeUpItem}>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">Tell us about you</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          This becomes your profile — you can change it later from the profile page.
        </p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="space-y-5">
        <Input
          id="fullName"
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
          icon={<UserIcon className="h-4 w-4" aria-hidden="true" />}
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="city"
            label="City"
            placeholder="San Francisco"
            icon={<Building2 className="h-4 w-4" aria-hidden="true" />}
            error={errors.city?.message}
            {...register('city')}
          />
          <Input
            id="neighborhood"
            label="Neighborhood (optional)"
            placeholder="Mission District"
            icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
            error={errors.neighborhood?.message}
            {...register('neighborhood')}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            id="yearsInCity"
            type="number"
            min={0}
            max={80}
            label="Years in this city"
            placeholder="1"
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            error={errors.yearsInCity?.message}
            {...register('yearsInCity')}
          />
          <Input
            id="occupation"
            label="Occupation (optional)"
            placeholder="Software Engineer"
            icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
            error={errors.occupation?.message}
            {...register('occupation')}
          />
        </div>
      </motion.div>

      <motion.div variants={fadeUpItem} className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
          Back
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!isValid || isSubmitting}
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {isSubmitting ? 'Saving…' : 'Continue'}
        </Button>
      </motion.div>
    </motion.form>
  );
}
