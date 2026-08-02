import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bird } from 'lucide-react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Spinner } from '@/components/ui/Spinner';
import { ROUTES } from '@/lib/constants';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import type { UserProfile } from '@/types/user.types';

/**
 * Onboarding page — the premium first impression after login.
 * Renders the 7-step wizard full-screen (glassmorphism card over a gradient);
 * redirects to the dashboard when the user is already onboarded.
 */
export function OnboardingPage() {
  const user = useAuthStore((state) => state.user);
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch an existing profile (resume case) unless onboarding is already done.
  useEffect(() => {
    let active = true;
    if (user?.isOnboarded) {
      setLoading(false);
      return;
    }
    userService
      .getMyProfile()
      .then((profile) => {
        if (active) setInitialProfile(profile);
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

  if (user?.isOnboarded) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-2.5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Bird className="h-5 w-5 text-emerald-950" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight text-white">
            Neighbor<span className="text-emerald-400">Nest</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="w-full max-w-3xl rounded-3xl border border-slate-700/50 bg-slate-800/60 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10"
        >
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
