import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { Spinner } from '@/components/ui/Spinner';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ROUTES } from '@/lib/constants';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user.types';

/**
 * Onboarding page — full-screen experience with animated gradient background
 * and the 7-step wizard in a clean card. Redirects to dashboard if already onboarded.
 */
export function OnboardingPage() {
  const user = useAuthStore((state) => state.user);
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (user?.isOnboarded) {
      setLoading(false);
      return;
    }
    userService
      .getMyProfile()
      .then((p) => {
        if (active) setInitialProfile(p);
      })
      .catch(() => {
        if (active) setInitialProfile(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.isOnboarded]);

  if (user?.isOnboarded) return <Navigate to={ROUTES.DASHBOARD} replace />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] theme-transition">
      <GradientBackground />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        {/* Brand mark */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <BrandLogo />
        </motion.div>

        {/* Wizard card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-5xl overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-deep)] p-6 shadow-[var(--shadow-xl)] sm:p-10 theme-transition"
        >
          {/* Accent hairline at top */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-0.5 rounded-t-[var(--radius-xl)] bg-[var(--grad-primary)]"
          />

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            <OnboardingWizard initialProfile={initialProfile} />
          )}
        </motion.div>
      </div>
    </div>
  );
}