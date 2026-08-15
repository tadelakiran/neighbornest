import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Clock,
  Home,
  Sparkles,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { LazyImage } from '@/components/ui/LazyImage';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { TagInput } from '@/components/profile/TagInput';
import { useToast } from '@/hooks/useToast';
import { IMAGES } from '@/lib/images';
import { ROUTES } from '@/lib/constants';
import { getErrorMessage } from '@/lib/utils';
import { userService } from '@/services/userService';

const anchorSchema = z.object({
  yearsInCity: z.coerce.number().min(1, 'You must have lived in the city for at least 1 year'),
  neighborhoods: z.array(z.string().min(1)).min(1, 'Add at least one neighborhood'),
  languages: z.array(z.string().min(1)).optional(),
  experience: z.string().min(20, 'Tell us a little more — at least 20 characters'),
  availability: z.string().optional(),
});

type AnchorValues = z.infer<typeof anchorSchema>;

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
  item: { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } },
};

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
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="relative overflow-hidden rounded-2xl border-royal-500/20">
          {/* Home photo as its own side panel — separate from the text */}
          <div className="grid items-stretch md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center md:p-8">
              <motion.span
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-gradient shadow-glow-sm"
              >
                <Home className="h-6 w-6 text-white" aria-hidden="true" />
              </motion.span>
              <div className="flex-1">
                <h1 className="font-display text-xl font-bold tracking-tight text-primary">
                  Want to help others feel at home?
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Become an Anchor — a local who hosts and guides newcomers through their first months in the city.
                </p>
              </div>
              <Sparkles className="hidden h-5 w-5 text-royal-300/50 sm:block" aria-hidden="true" />
            </div>

            <div className="relative h-36 overflow-hidden md:h-auto">
              <LazyImage
                src={IMAGES.home}
                alt=""
                placeholder="shimmer"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[var(--color-surface)]/30 md:bg-gradient-to-l" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Form */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
      >
        <Card className="rounded-2xl p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <motion.div variants={stagger.item}>
              <Input
                id="aa-years"
                type="number"
                min={1}
                label="Years in the city"
                placeholder="5"
                icon={<CalendarDays className="h-4 w-4 text-muted" aria-hidden="true" />}
                error={errors.yearsInCity?.message}
                className="h-12 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] transition-all focus-within:border-[var(--accent-400)]/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                {...register('yearsInCity')}
              />
            </motion.div>

            <motion.div variants={stagger.item}>
              <TagInput
                label="Neighborhoods you know well"
                placeholder="Type a neighborhood and press Enter"
                hint="e.g. Mission, Noe Valley, Castro"
                value={neighborhoods}
                onChange={(tags) => setValue('neighborhoods', tags, { shouldValidate: true })}
                error={errors.neighborhoods?.message}
              />
            </motion.div>

            <motion.div variants={stagger.item}>
              <TagInput
                label="Languages spoken (optional)"
                placeholder="Type a language and press Enter"
                hint="e.g. English, Spanish"
                value={languages}
                onChange={(tags) => setValue('languages', tags, { shouldValidate: true })}
                error={errors.languages?.message}
              />
            </motion.div>

            <motion.div variants={stagger.item}>
              <Textarea
                id="aa-experience"
                label="Your local experience"
                placeholder="Tell us about your time in the city — events you've hosted, groups you're part of, hidden gems you know…"
                rows={4}
                error={errors.experience?.message}
                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] transition-all focus-within:border-[var(--accent-400)]/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                {...register('experience')}
              />
            </motion.div>

            <motion.div variants={stagger.item}>
              <Textarea
                id="aa-availability"
                label="Availability (optional)"
                placeholder="e.g. Evenings and weekends"
                rows={3}
                error={errors.availability?.message}
                className="rounded-xl border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--text-primary)] transition-all focus-within:border-[var(--accent-400)]/40 focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
                {...register('availability')}
              />
            </motion.div>

            <motion.div variants={stagger.item} className="flex items-center justify-between gap-3 pt-3">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
                onClick={() => navigate(ROUTES.PROFILE)}
                className="rounded-xl text-muted hover:text-primary"
              >
                Back
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                disabled={submitting}
                className="rounded-xl shadow-glow"
                leftIcon={<Send className="h-4 w-4" aria-hidden="true" />}
              >
                {submitting ? 'Submitting…' : 'Submit application'}
              </Button>
            </motion.div>
          </form>
        </Card>
      </motion.div>

      {/* Success modal */}
      <Modal open={submitted} onClose={() => navigate(ROUTES.PROFILE)} title="Application submitted" maxWidth="max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5 py-2 text-center"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-400/10 shadow-glow-sm ring-1 ring-accent-400/20">
            <BadgeCheck className="h-8 w-8 text-accent-400" aria-hidden="true" />
          </span>

          <div className="space-y-1">
            <p className="text-base font-bold text-primary">You're in the running!</p>
            <p className="max-w-[16rem] text-sm leading-relaxed text-muted">
              Our team will review your application. You'll see the status on your profile once a decision is made.
            </p>
          </div>

          <PendingBadge />

          {/* Process steps */}
          <div className="w-full space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">What happens next</p>
            <ol className="space-y-3">
              {[
                { icon: ShieldCheck, text: 'An admin reviews your application and local experience' },
                { icon: BadgeCheck, text: 'Approved? Your role upgrades to Anchor automatically' },
                { icon: Clock, text: 'Track the status on your profile at any time' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-400/10 text-[10px] font-bold text-accent-400">
                    {i + 1}
                  </span>
                  <span className="text-xs leading-relaxed text-secondary">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <Button fullWidth onClick={() => navigate(ROUTES.PROFILE)} className="rounded-xl">
            Back to profile
          </Button>
        </motion.div>
      </Modal>
    </div>
  );
}

function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-royal-400/25 bg-royal-400/10 px-4 py-1.5 text-xs font-bold text-royal-300 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
      <span className="relative flex h-2 w-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-royal-400 opacity-60" />
        <span className="relative h-2 w-2 rounded-full bg-royal-400" />
      </span>
      Pending review
    </span>
  );
}