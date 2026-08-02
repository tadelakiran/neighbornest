import { useCallback, useEffect, useRef, useState } from 'react';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';
import type { ProfileUpdateRequest, UserProfile } from '@/types/user.types';

/**
 * Applies a partial update to a local profile snapshot for optimistic updates.
 *
 * @param profile - current profile
 * @param patch - partial update request
 * @returns the merged profile
 */
function applyPatch(profile: UserProfile, patch: ProfileUpdateRequest): UserProfile {
  return {
    ...profile,
    fullName: patch.fullName ?? profile.fullName,
    profilePhotoUrl: patch.profilePhotoUrl ?? profile.profilePhotoUrl,
    city: patch.city ?? profile.city,
    neighborhood: patch.neighborhood ?? profile.neighborhood,
    yearsInCity: patch.yearsInCity ?? profile.yearsInCity,
    occupation: patch.occupation ?? profile.occupation,
    workType: patch.workType ?? profile.workType,
    personalityType: patch.personalityType ?? profile.personalityType,
    schedulePreference: patch.schedulePreference ?? profile.schedulePreference,
    socialGoal: patch.socialGoal ?? profile.socialGoal,
    budgetLevel: patch.budgetLevel ?? profile.budgetLevel,
    role: patch.role ?? profile.role,
  };
}

/**
 * Loads the current user's full profile and exposes an optimistic-update
 * `updateProfile` that rolls back on error and keeps the auth store in sync.
 *
 * @returns profile state, loading flag, reload, and the update action
 */
export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  /** Fetches the current user's profile from `GET /api/users/me`. */
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getMyProfile();
      if (mounted.current) setProfile(data);
    } catch (caught) {
      if (!mounted.current) return;
      // 404 = no profile yet — not an error worth shouting about.
      const status = (caught as { response?: { status?: number } }).response?.status;
      if (status !== 404) setError('Could not load your profile.');
      setProfile(null);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Reset the flag on every effect run — StrictMode double-invokes effects
    // (mount -> cleanup -> mount), so a stale `false` would freeze loading.
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  /**
   * Updates the profile optimistically: applies the patch locally, persists via
   * `PUT /api/users/me`, and rolls back on failure.
   *
   * @param patch - partial profile update
   * @returns the server-confirmed profile
   */
  const updateProfile = useCallback(
    async (patch: ProfileUpdateRequest): Promise<UserProfile> => {
      const previous = profile;
      if (previous) setProfile(applyPatch(previous, patch)); // optimistic paint

      try {
        const updated = await userService.updateProfile(patch);
        setProfile(updated);
        // Keep navbar/dashboard labels in sync after the profile changes.
        void useAuthStore.getState().fetchUser();
        return updated;
      } catch (caught) {
        if (previous) setProfile(previous); // rollback
        throw caught;
      }
    },
    [profile]
  );

  return { profile, isLoading, error, reload: load, updateProfile };
}
