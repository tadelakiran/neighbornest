import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Moon, Scale, Sun } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { StepCard } from '@/components/ui/StepCard';
import { PERSONALITY_OPTIONS, VALUE_QUESTIONS } from '@/lib/onboarding';
import { fadeUpItem, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { OnboardingData, PersonalityType } from '@/types/user.types';

const PERSONALITY_ICONS: Record<PersonalityType, typeof Moon> = {
  INTROVERT: Moon,
  AMBIVERT:  Scale,
  EXTROVERT: Sun,
};

interface StepPersonalityProps {
  data:   OnboardingData;
  onNext: (data: OnboardingData) => void;
  onBack: () => void;
}

export function StepPersonality({ data, onNext, onBack }: StepPersonalityProps) {
  const [personalityType, setPersonalityType] = useState<PersonalityType | null>(data.personalityType);
  const [values, setValues] = useState<Record<string, number>>(data.values);
  const [touched, setTouched] = useState(false);

  const handleContinue = () => {
    setTouched(true);
    if (!personalityType) return;
    onNext({ ...data, personalityType, values });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={fadeUpItem}>
        <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">How do you recharge?</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Pick what fits best — we match you with neighbors who share your rhythm.
        </p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PERSONALITY_OPTIONS.map((option) => (
          <StepCard
            key={option.value}
            icon={PERSONALITY_ICONS[option.value]}
            title={option.label}
            description={option.description}
            selected={personalityType === option.value}
            onClick={() => setPersonalityType(option.value)}
          />
        ))}
      </motion.div>
      <FieldError message={touched && !personalityType ? 'Choose a personality to continue' : undefined} />

      {/* Values ratings */}
      <motion.div variants={fadeUpItem} className="space-y-4">
        <h3 className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
          Values that shape you
        </h3>
        {VALUE_QUESTIONS.map((question) => (
          <div
            key={question.key}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">{question.prompt}</p>
              <span className="shrink-0 text-xs text-[var(--text-muted)]">
                {values[question.key] ?? 3}/5
              </span>
            </div>
            <div className="mt-3 flex gap-2" role="radiogroup" aria-label={question.label}>
              {[1, 2, 3, 4, 5].map((rating) => {
                const active = (values[question.key] ?? 3) === rating;
                return (
                  <motion.button
                    key={rating}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    aria-pressed={active}
                    onClick={() => setValues((prev) => ({ ...prev, [question.key]: rating }))}
                    className={cn(
                      'h-10 w-10 rounded-full border text-sm font-semibold transition-all duration-200',
                      active
                        ? 'border-accent-500 bg-accent-500 text-white shadow-glow-sm'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--text-muted)] hover:border-accent-400 hover:text-accent-600'
                    )}
                  >
                    {rating}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={fadeUpItem} className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>Back</Button>
        <Button onClick={handleContinue} disabled={!personalityType} rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>Continue</Button>
      </motion.div>
    </motion.div>
  );
}
