import { useCallback, useEffect, useRef, useState } from 'react';
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
  const saveTimer = useRef<number | null>(null);
  // Always points at the latest draft so the unmount flush can't write a stale
  // snapshot over a newer one.
  const latestRef = useRef(state);
  latestRef.current = state;

  // Auto-save (debounced 300ms) — writing JSON to localStorage on every
  // keystroke caused avoidable main-thread jank while typing in the wizard.
  useEffect(() => {
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(state));
      saveTimer.current = null;
    }, 300);
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [state]);

  // Flush any pending draft synchronously on unmount (hard nav / tab close).
  useEffect(() => {
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(latestRef.current));
      }
    };
  }, []);

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

  /**
   * Removes the saved draft (called after the wizard completes successfully).
   * Also cancels any pending debounced write so a just-scheduled auto-save can't
   * resurrect the draft moments after completion.
   */
  const clearDraft = useCallback(() => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  }, []);

  return { data: state.data, step: state.step, setData, setStep, clearDraft };
}
