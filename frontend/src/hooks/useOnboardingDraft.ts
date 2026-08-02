import { useCallback, useEffect, useState } from 'react';
import { ONBOARDING_DRAFT_KEY } from '@/lib/constants';
import { ONBOARDING_DATA_DEFAULTS } from '@/lib/onboarding';
import type { OnboardingData } from '@/types/user.types';

/** Shape persisted to localStorage: wizard data + the step to resume at. */
interface DraftState {
  data: OnboardingData;
  step: number;
}

/** Safely clamps a persisted step into the valid range (0..6). */
function clampStep(step: unknown): number {
  if (typeof step !== 'number' || Number.isNaN(step)) return 0;
  return Math.min(Math.max(Math.round(step), 0), 6);
}

/** Loads the persisted draft, merging over defaults so a schema change never crashes the resume. */
function loadDraft(): DraftState {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DraftState>;
      const data = (parsed.data ?? {}) as Partial<OnboardingData>;
      return {
        data: {
          ...ONBOARDING_DATA_DEFAULTS,
          ...data,
          values: { ...ONBOARDING_DATA_DEFAULTS.values, ...(data.values ?? {}) },
        },
        step: clampStep(parsed.step),
      };
    }
  } catch {
    // Corrupt or unreadable draft — start fresh.
  }
  return { data: { ...ONBOARDING_DATA_DEFAULTS }, step: 0 };
}

/**
 * Persists the onboarding wizard draft (data + current step) to localStorage
 * and restores it on mount, so a page refresh resumes at the exact step.
 *
 * @returns the draft data, the persisted step, setters, and a clear helper
 */
export function useOnboardingDraft() {
  const [state, setState] = useState<DraftState>(loadDraft);

  // Auto-save on every change.
  useEffect(() => {
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(state));
  }, [state]);

  /** Updates the draft data (accepts a plain value or an updater function). */
  const setData = useCallback(
    (updater: OnboardingData | ((prev: OnboardingData) => OnboardingData)) => {
      setState((current) => ({
        ...current,
        data: typeof updater === 'function' ? updater(current.data) : updater,
      }));
    },
    []
  );

  /** Persists the current step so a refresh resumes here. */
  const setStep = useCallback((step: number) => {
    setState((current) => ({ ...current, step: clampStep(step) }));
  }, []);

  /** Removes the saved draft (called after the wizard completes successfully). */
  const clearDraft = useCallback(() => {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  }, []);

  return { data: state.data, step: state.step, setData, setStep, clearDraft };
}
