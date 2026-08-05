import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, BadgeCheck, CalendarDays, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { TagInput } from '@/components/profile/TagInput';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';
import { userService } from '@/services/userService';

/** Validation schema — mirrors the backend anchor-apply constraints. */
const anchorSchema = z.object({
  yearsInCity: z.coerce.number().min(1, 'You must have lived in the city for at least 1 year'),
  neighborhoods: z.array(z.string().min(1)).min(1, 'Add at least one neighborhood'),
  languages: z.array(z.string().min(1)).optional(),
  experience: z.string().min(20, 'Tell us a little more — at least 20 characters'),
  availability: z.string().optional(),
});

type AnchorValues = z.infer<typeof anchorSchema>;

/**
 * Anchor application page: a local-knowledge questionnaire for NEWCOMERs who
 * want to become Anchors. Submits to POST /api/users/anchor-apply and shows a
 * "pending" success modal.
 */
export function AnchorApplicationForm() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AnchorValues>({
    resolver: zodResolver(anchorSchema),
    mode: 'onChange',
    defaultValues: { yearsInCity: 0, neighborhoods: [], languages: [], experience: '', availability: '' },
  });

  const neighborhoods = watch('neighborhoods') ?? [];
  const languages = watch('languages') ?? [];

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await userService.applyForAnchor({
        yearsInCity: values.yearsInCity,
        neighborhoodsKnown: values.neighborhoods,
        languagesSpoken: values.languages ?? [],
        experience: values.experience,
        availability: values.availability ?? '',
      });
      setSubmitted(true);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit your application.'));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Banner */}
      <Card className="relative overflow-hidden border-accent-400/30 bg-gradient-to-br from-accent-600/20 via-deep to-deep p-6">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-400/15 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent-500 to-accent-400 shadow-glow">
            <Home className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-primary">Want to help others feel at home?</h1>
            <p className="mt-1 text-sm text-muted">
              Become an Anchor — a local who hosts and guides newcomers through
              their first months in the city.
            </p>
          </div>
          <Sparkles className="hidden h-6 w-6 text-accent-300/60 sm:block" aria-hidden="true" />
        </div>
      </Card>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Input
            id="aa-years"
            type="number"
            min={1}
            label="Years in the city"
            placeholder="5"
            icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
            error={errors.yearsInCity?.message}
            {...register('yearsInCity')}
          />

          <TagInput
            label="Neighborhoods you know well"
            placeholder="Type a neighborhood and press Enter"
            hint="e.g. Mission, Noe Valley, Castro"
            value={neighborhoods}
            onChange={(tags) => setValue('neighborhoods', tags, { shouldValidate: true })}
            error={errors.neighborhoods?.message}
          />

          <TagInput
            label="Languages spoken (optional)"
            placeholder="Type a language and press Enter"
            hint="e.g. English, Spanish"
            value={languages}
            onChange={(tags) => setValue('languages', tags, { shouldValidate: true })}
            error={errors.languages?.message}
          />

          <Textarea
            id="aa-experience"
            label="Your local experience"
            placeholder="Tell us about your time in the city — events you've hosted, groups you're part of…"
            error={errors.experience?.message}
            {...register('experience')}
          />

          <Textarea
            id="aa-availability"
            label="Availability (optional)"
            placeholder="e.g. Evenings and weekends"
            rows={3}
            error={errors.availability?.message}
            {...register('availability')}
          />

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              variant="ghost"
              leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
              onClick={() => navigate(ROUTES.PROFILE)}
            >
              Back to profile
            </Button>
            <Button type="submit" isLoading={submitting} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit application'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Success modal */}
      <Modal open={submitted} onClose={() => navigate(ROUTES.PROFILE)} title="Application submitted" maxWidth="max-w-sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <SuccessIcon />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary">You&apos;re in the running!</p>
            <p className="text-sm leading-relaxed text-muted">
              Our team will review your application. You&apos;ll see the status
              here once it&apos;s approved.
            </p>
          </div>
          <PendingBadge />
          <Button fullWidth onClick={() => navigate(ROUTES.PROFILE)}>
            Back to profile
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** Success check inside the modal. */
function SuccessIcon() {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-400/15 shadow-glow-sm">
      <BadgeCheck className="h-8 w-8 text-accent-300" aria-hidden="true" />
    </span>
  );
}

/** Pending status pill with a soft pulse. */
function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
      Pending review
    </span>
  );
}
