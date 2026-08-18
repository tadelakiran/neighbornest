import type { Variants } from 'framer-motion';

/**
 * Shared Framer Motion variants used across the onboarding wizard and profile
 * module so every screen animates consistently (Azure Dynasty spec).
 */

/** Ease-out-expo curve used for page transitions. */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

/** Parent variants: staggers children into view (0.08s apart, 0.1s delay). */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/** Child variants: fade in while rising slightly into place. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
};

/**
 * Wizard step page transition. Custom `direction` prop drives the slide:
 * next steps enter from the right, back steps from the left. The current step
 * slides out left (x: -40) while the new step slides in from the right.
 */
export const wizardPageTransition: Variants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction * 40 }),
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: EASE_OUT_EXPO } },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -40,
    transition: { duration: 0.3, ease: 'easeIn' },
  }),
};

/**
 * Page-level enter transition used by every route (slide + fade in from the
 * right). Wrap route content in a motion.div with these variants.
 *
 * Kept short (0.25s) so tab switches feel instant — AnimatePresence
 * `mode="wait"` serializes exit + enter, and long durations made every
 * navigation feel laggy.
 */
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 14, x: 8 },
  show: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.25, ease: EASE_OUT_EXPO },
  },
};

/** Exit variant — pages drift out softly when the route changes. */
export const pageExit: Variants = {
  exit: {
    opacity: 0,
    y: -8,
    x: -12,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

/** Card-list entrance: children fade up with a stagger. */
export const cardStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

/** Individual card in a staggered list — rises from below. */
export const cardRise: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT_EXPO } },
  exit: { opacity: 0, x: -200, transition: { duration: 0.3, ease: 'easeIn' } },
};
