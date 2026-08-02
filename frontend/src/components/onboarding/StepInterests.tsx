import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { INTEREST_OPTIONS } from '@/lib/onboarding';
import { fadeUpItem, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '@/types/user.types';

interface StepInterestsProps {
  data: OnboardingData;
  onNext: (data: OnboardingData) => void;
  onBack: () => void;
}

/** Step 4 — tap the interests that light you up; they power interest matching. */
export function StepInterests({ data, onNext, onBack }: StepInterestsProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(data.interests));
  const [touched, setTouched] = useState(false);

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleContinue = () => {
    setTouched(true);
    if (selected.size === 0) return;
    onNext({ ...data, interests: [...selected] });
  };

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={fadeUpItem}>
        <h2 className="text-2xl font-bold text-white">What lights you up?</h2>
        <p className="mt-1 text-sm text-slate-400">
          Pick at least one — we use these to match you with neighbors who share
          your hobbies.
        </p>
        <p className="mt-3 text-sm font-semibold text-emerald-400">
          {selected.size} selected
        </p>
      </motion.div>

      <motion.div variants={fadeUpItem} className="flex flex-wrap gap-2.5">
        {INTEREST_OPTIONS.map((option) => {
          const active = selected.has(option.label);
          return (
            <motion.button
              key={option.slug}
              type="button"
              whileTap={{ scale: 0.95 }}
              aria-pressed={active}
              onClick={() => toggle(option.label)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-200',
                active
                  ? 'border-emerald-500 bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/25'
                  : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700/60'
              )}
            >
              {option.label}
            </motion.button>
          );
        })}
      </motion.div>

      <FieldError message={touched && selected.size === 0 ? 'Pick at least one interest to continue' : undefined} />

      <motion.div variants={fadeUpItem} className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={selected.size === 0} rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
          Continue
        </Button>
      </motion.div>
    </motion.div>
  );
}
