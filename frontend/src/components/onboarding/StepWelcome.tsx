import { motion } from 'framer-motion';
import { ArrowRight, Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/lib/constants';
import { fadeUpItem, staggerContainer } from '@/lib/motion';

/** Value props the welcome step advertises. */
const HIGHLIGHTS = [
  { icon: Users, text: 'We match you with compatible neighbors' },
  { icon: MapPin, text: 'Discover your city through local Anchors' },
  { icon: Heart, text: 'Build real friendships, not just contacts' },
];

interface StepWelcomeProps {
  onNext: () => void;
}

/** Step 1 — a short branded welcome that sets the tone before the questions. */
export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col items-center space-y-8 py-6 text-center"
    >
      <motion.span
        variants={fadeUpItem}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/30"
      >
        <Sparkles className="h-8 w-8 text-emerald-950" aria-hidden="true" />
      </motion.span>

      <motion.div variants={fadeUpItem} className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Welcome to {APP_NAME}
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
          Let&apos;s set up your profile so we can match you into a Nest that
          feels like home. It takes about two minutes.
        </p>
      </motion.div>

      <motion.ul variants={fadeUpItem} className="w-full max-w-md space-y-3 text-left">
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 px-4 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <Icon className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            </span>
            <span className="text-sm text-slate-300">{text}</span>
          </li>
        ))}
      </motion.ul>

      <motion.div variants={fadeUpItem}>
        <Button
          size="lg"
          onClick={onNext}
          rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          Get started
        </Button>
      </motion.div>
    </motion.div>
  );
}
