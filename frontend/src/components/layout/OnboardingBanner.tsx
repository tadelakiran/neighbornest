import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';

/**
 * Session-only dismiss flag: the banner comes back on the next visit until
 * the user actually completes onboarding (it must never disappear for good
 * while the profile is still incomplete).
 */
const DISMISS_KEY = 'neighbornest.onboarding.banner-dismissed';

/**
 * Onboarding completion banner — shown on every authenticated page while the
 * user's profile is still incomplete (`isOnboarded === false`).
 *
 * - Full-width gradient strip directly under the navbar, so it is unmissable
 *   right after login/registration.
 * - "Complete profile" CTA takes the user into the onboarding wizard.
 * - Dismissible for the current tab session (Escape/backdrop not needed — the
 *   banner is in normal flow), and disappears permanently the moment the
 *   wizard finishes (markOnboarded flips the flag in the auth store).
 */
export function OnboardingBanner() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage.getItem(DISMISS_KEY) === '1'
  );

  const show = Boolean(user && !user.isOnboarded && !dismissed);

  const dismiss = () => {
    window.sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-30 overflow-hidden border-b border-[var(--color-border)] lg:pl-72"
          role="region"
          aria-label="Profile incomplete"
        >
          <div className="relative bg-accent-gradient">
            {/* Soft light bleed so the strip reads as depth, not a flat bar */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  'radial-gradient(600px circle at 15% 0%, rgba(255,255,255,0.35), transparent 55%)',
              }}
              aria-hidden="true"
            />

            <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row md:px-8">
              <div className="flex items-center gap-3 text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm backdrop-blur-sm">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight">
                    {user?.fullName?.split(' ')[0] ?? 'Welcome'} — complete your profile
                  </p>
                  <p className="text-xs leading-relaxed text-white/85">
                    Tell us your vibe so we can match you with compatible neighbors.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="border-transparent bg-white text-[var(--accent-700)] shadow-sm hover:bg-white/90 hover:text-[var(--accent-700)]"
                  rightIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => navigate(ROUTES.ONBOARDING)}
                >
                  Complete profile
                </Button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                  aria-label="Dismiss profile reminder"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
