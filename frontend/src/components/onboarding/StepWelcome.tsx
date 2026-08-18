import { motion } from 'framer-motion';
import { ArrowRight, Heart, MapPin, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/lib/constants';
import { fadeUpItem, staggerContainer } from '@/lib/motion';

const HIGHLIGHTS = [
  { icon: Users,  text: 'We match you with compatible neighbors'        },
  { icon: MapPin, text: 'Discover your city through local Anchors'      },
  { icon: Heart,  text: 'Build real friendships, not just contacts'     },
];

interface StepWelcomeProps {
  onNext: () => void;
}

/** Step 1 — branded welcome screen. */
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
        className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-accent-gradient shadow-glow"
      >
        <Sparkles className="h-8 w-8 text-white" aria-hidden="true" />
        <span className="absolute -inset-2 -z-10 rounded-xl bg-accent-400/15 blur-xl" aria-hidden="true" />
      </motion.span>

      <motion.div variants={fadeUpItem} className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          Welcome to {APP_NAME}
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          Let&apos;s set up your profile so we can match you into a Nest that
          feels like home. It takes about two minutes.
        </p>
      </motion.div>

      <motion.ul variants={fadeUpItem} className="w-full max-w-md space-y-3 text-left">
        {HIGHLIGHTS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent-100 text-accent-700">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-[var(--text-secondary)]">{text}</span>
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
