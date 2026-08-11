import { api, cachedGet, invalidateCache } from '@/services/api';
import type {
  AnchorApplicationRequest,
  AnchorApplicationResponse,
  OnboardingStatusResponse,
  OnboardingSubmitRequest,
  ProfileCreateRequest,
  ProfileResponse,
  ProfileUpdateRequest,
  UserProfile,
} from '@/types/user.types';

/**
 * Maps a snake_case user-service response to the app-facing UserProfile model.
 *
 * @param response - wire payload from the user-service
 * @returns the camelCase app model
 */
export function mapProfileToUserProfile(response: ProfileResponse): UserProfile {
  return {
    id: response.id,
    authUserId: response.auth_user_id,
    fullName: response.full_name,
    profilePhotoUrl: response.profile_photo_url ?? null,
    city: response.city ?? null,
    neighborhood: response.neighborhood ?? null,
    yearsInCity: response.years_in_city,
    occupation: response.occupation ?? null,
    workType: response.work_type ?? null,
    personalityType: response.personality_type ?? null,
    schedulePreference: response.schedule_preference ?? null,
    socialGoal: response.social_goal ?? null,
    budgetLevel: response.budget_level ?? null,
    isOnboarded: response.is_onboarded,
    role: response.role,
    onboardingAnswers: response.onboarding_answers ?? [],
    createdAt: response.created_at ?? null,
    updatedAt: response.updated_at ?? null,
  };
}

/**
 * User-profile API service — thin wrappers around the shared axios instance.
 * All endpoints hit the API Gateway (baseURL from `services/api.ts`).
 */
export const userService = {
  /** POST /api/users/profile — creates the profile (authUserId from the JWT). */
  async createProfile(payload: ProfileCreateRequest): Promise<UserProfile> {
    const { data } = await api.post<ProfileResponse>('/api/users/profile', payload);
    return mapProfileToUserProfile(data);
  },

  /**
   * GET /api/users/me — returns the current user's full profile.
   * Cached for 30s and deduplicated so repeated consumers (app shell, dashboard,
   * profile page) share a single network round trip.
   */
  async getMyProfile(force = false): Promise<UserProfile> {
    const data = force
      ? ((await api.get<ProfileResponse>('/api/users/me')).data)
      : await cachedGet<ProfileResponse>('/api/users/me');
    return mapProfileToUserProfile(data);
  },

  /** PUT /api/users/me — partially updates the current user's profile. */
  async updateProfile(payload: ProfileUpdateRequest): Promise<UserProfile> {
    const { data } = await api.put<ProfileResponse>('/api/users/me', payload);
    invalidateCache('/api/users/me');
    return mapProfileToUserProfile(data);
  },

  /** POST /api/users/onboarding — stores answers and marks the user onboarded. */
  async submitOnboarding(payload: OnboardingSubmitRequest): Promise<UserProfile> {
    const { data } = await api.post<ProfileResponse>('/api/users/onboarding', payload);
    invalidateCache('/api/users/me');
    return mapProfileToUserProfile(data);
  },

  /** GET /api/users/onboarding/status — checks onboarding completion. */
  async getOnboardingStatus(): Promise<OnboardingStatusResponse> {
    const { data } = await api.get<OnboardingStatusResponse>('/api/users/onboarding/status');
    return data;
  },

  /**
   * POST /api/users/anchor-apply — submits an anchor application.
   * The backend stores tag lists as comma-joined strings, so the arrays in
   * {@link AnchorApplicationRequest} are joined before sending.
   */
  async applyForAnchor(payload: AnchorApplicationRequest): Promise<AnchorApplicationResponse> {
    const { data } = await api.post<AnchorApplicationResponse>('/api/users/anchor-apply', {
      yearsInCity: payload.yearsInCity,
      neighborhoodsKnown: payload.neighborhoodsKnown.join(', '),
      languagesSpoken: payload.languagesSpoken.join(', '),
      experience: payload.experience,
      availability: payload.availability,
    });
    return data;
  },

  /**
   * GET /api/users/anchor-application — returns the current user's most recent
   * anchor application, or null when they have never applied (backend 404).
   */
  async getAnchorApplication(): Promise<AnchorApplicationResponse | null> {
    try {
      const { data } = await api.get<AnchorApplicationResponse>('/api/users/anchor-application');
      return data;
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 404) return null;
      throw error;
    }
  },
};
