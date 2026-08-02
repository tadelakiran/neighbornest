import type { Variants } from 'framer-motion';

/**
 * Shared Framer Motion variants used across the onboarding wizard and profile
 * module so every screen animates consistently.
 */

/** Parent variants: staggers children into view one-by-one (0.05s apart). */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

/** Child variants: fade in while rising slightly into place. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

/**
 * Wizard step page transition. Custom `direction` prop drives the slide:
 * next steps enter from the right, back steps from the left.
 */
export const wizardPageTransition: Variants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction * 60 }),
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -60,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
};
