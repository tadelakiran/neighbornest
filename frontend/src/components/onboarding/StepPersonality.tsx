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

/** Icon per personality type. */
const PERSONALITY_ICONS: Record<PersonalityType, typeof Moon> = {
  INTROVERT: Moon,
  AMBIVERT: Scale,
  EXTROVERT: Sun,
};

interface StepPersonalityProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onBack: () => void;
}

/** Step 3 — personality cards + 1-5 "values" ratings (fed to the matcher). */
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
        <h2 className="text-2xl font-bold text-white">How do you recharge?</h2>
        <p className="mt-1 text-sm text-slate-400">
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

      <motion.div variants={fadeUpItem} className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Values that shape you
        </h3>
        {VALUE_QUESTIONS.map((question) => (
          <div
            key={question.key}
            className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-4"
          >
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-sm font-medium text-slate-200">{question.prompt}</p>
              <span className="shrink-0 text-xs text-slate-500">
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
                      'h-10 w-10 rounded-full border text-sm font-semibold transition-colors duration-150',
                      active
                        ? 'border-emerald-500 bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/25'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
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
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!personalityType} rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
