import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StepBasicInfo } from '@/components/onboarding/StepBasicInfo';
import { StepDealbreakers } from '@/components/onboarding/StepDealbreakers';
import { StepIndicator } from '@/components/onboarding/StepIndicator';
import { StepInterests } from '@/components/onboarding/StepInterests';
import { StepPersonality } from '@/components/onboarding/StepPersonality';
import { StepReview } from '@/components/onboarding/StepReview';
import { StepSuccess } from '@/components/onboarding/StepSuccess';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { useOnboardingDraft } from '@/hooks/useOnboardingDraft';
import { useToast } from '@/hooks/useToast';
import { buildOnboardingAnswers } from '@/lib/onboarding';
import { wizardPageTransition } from '@/lib/motion';
import { getErrorMessage } from '@/lib/utils';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import type { OnboardingData, ProfileCreateRequest, ProfileUpdateRequest, UserProfile } from '@/types/user.types';

interface OnboardingWizardProps {
  /** Existing profile (pre-filled) when the user resumed mid-onboarding. */
  initialProfile: UserProfile | null;
}

/** Number of steps (0-based: Welcome..Success). */
const LAST_STEP = 6;

/**
 * The 7-step onboarding wizard: manages the current step, slide direction,
 * localStorage draft (data + step, so a refresh resumes in place), and the two
 * server interactions (create/update profile on step 2, finish + submit
 * answers on step 6).
 */
export function OnboardingWizard({ initialProfile }: OnboardingWizardProps) {
  const { data, step, setData, setStep, clearDraft } = useOnboardingDraft();
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasProfile, setHasProfile] = useState(initialProfile !== null);
  const toast = useToast();

  // Pre-fill the draft from an existing profile only when no draft was saved.
  useEffect(() => {
    if (!initialProfile) return;
    setData((prev) => {
      if (prev.fullName) return prev;
      return {
        ...prev,
        fullName: initialProfile.fullName,
        city: initialProfile.city ?? '',
        neighborhood: initialProfile.neighborhood ?? '',
        yearsInCity: initialProfile.yearsInCity,
        occupation: initialProfile.occupation ?? '',
        personalityType: initialProfile.personalityType ?? null,
        workType: initialProfile.workType ?? null,
        schedulePreference: initialProfile.schedulePreference ?? null,
        socialGoal: initialProfile.socialGoal ?? null,
        budgetLevel: initialProfile.budgetLevel ?? null,
      };
    });
  }, [initialProfile, setData]);

  const goBack = () => {
    setDirection(-1);
    setStep(Math.max(step - 1, 0));
  };

  const goTo = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), LAST_STEP);
    setDirection(clamped > step ? 1 : -1);
    setStep(clamped);
  };

  /**
   * Creates or updates the profile with the wizard's data. Once a profile
   * exists (created here or passed in), every later save is an update.
   */
  const upsertProfile = async (draftData: OnboardingData): Promise<void> => {
    const payload: ProfileUpdateRequest = {
      fullName: draftData.fullName,
      city: draftData.city,
      neighborhood: draftData.neighborhood,
      yearsInCity: draftData.yearsInCity,
      occupation: draftData.occupation,
      workType: draftData.workType ?? undefined,
      personalityType: draftData.personalityType ?? undefined,
      schedulePreference: draftData.schedulePreference ?? undefined,
      socialGoal: draftData.socialGoal ?? undefined,
      budgetLevel: draftData.budgetLevel ?? undefined,
    };

    if (hasProfile) {
      await userService.updateProfile(payload);
      return;
    }
    // Create requires fullName + city; the update payload is all-optional.
    const createPayload: ProfileCreateRequest = {
      fullName: draftData.fullName,
      city: draftData.city,
      neighborhood: draftData.neighborhood,
      yearsInCity: draftData.yearsInCity,
      occupation: draftData.occupation,
    };
    try {
      await userService.createProfile(createPayload);
      setHasProfile(true);
    } catch (error) {
      // 409 = profile already exists (race) — treat as update.
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 409) {
        await userService.updateProfile(payload);
        setHasProfile(true);
      } else {
        throw error;
      }
    }
  };

  /** Step 2 continue: persist basic info, then advance. */
  const handleBasicContinue = async (nextData: OnboardingData) => {
    setData(nextData);
    setIsSubmitting(true);
    try {
      await upsertProfile(nextData);
      await useAuthStore.getState().fetchUser();
      toast.success('Profile saved — let\u2019s keep going!');
      setDirection(1);
      setStep(2);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save your profile.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Step 6 continue: final save + submit answers, then celebrate. */
  const handleFinalSubmit = async (nextData: OnboardingData) => {
    setData(nextData);
    setIsSubmitting(true);
    try {
      await upsertProfile(nextData);
      await userService.submitOnboarding({ answers: buildOnboardingAnswers(nextData) });
      useAuthStore.getState().markOnboarded();
      clearDraft();
      setDirection(1);
      setStep(LAST_STEP);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not finish onboarding.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <StepIndicator current={step} />

      <div className="mt-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={wizardPageTransition}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {step === 0 && <StepWelcome onNext={() => goTo(1)} />}
            {step === 1 && (
              <StepBasicInfo data={data} onNext={handleBasicContinue} onBack={goBack} isSubmitting={isSubmitting} />
            )}
            {step === 2 && (
              <StepPersonality
                data={data}
                onNext={(next) => {
                  setData(next);
                  goTo(3);
                }}
                onBack={goBack}
              />
            )}
            {step === 3 && (
              <StepInterests
                data={data}
                onNext={(next) => {
                  setData(next);
                  goTo(4);
                }}
                onBack={goBack}
              />
            )}
            {step === 4 && (
              <StepDealbreakers
                data={data}
                onNext={(next) => {
                  setData(next);
                  goTo(5);
                }}
                onBack={goBack}
              />
            )}
            {step === 5 && <StepReview data={data} onNext={handleFinalSubmit} onBack={goBack} onEdit={goTo} isSubmitting={isSubmitting} />}
            {step === 6 && <StepSuccess />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
