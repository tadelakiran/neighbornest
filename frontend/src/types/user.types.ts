import type { UserRole } from '@/types/auth.types';

/**
 * TypeScript contracts for the user-service API (Module 2: Onboarding & Profile).
 *
 * Like the auth module, *responses* are serialized in snake_case while *request*
 * bodies use camelCase. All enum values mirror the backend enums exactly —
 * sending anything else results in a 400 from the API.
 */

/** Employment type of a user (mirrors backend `WorkType` enum). */
export type WorkType = 'FULL_TIME' | 'PART_TIME' | 'STUDENT' | 'FREELANCE' | 'RETIRED' | 'UNEMPLOYED';

/** Self-reported personality type (mirrors backend `PersonalityType` enum). */
export type PersonalityType = 'INTROVERT' | 'AMBIVERT' | 'EXTROVERT';

/** Preferred daily schedule (mirrors backend `SchedulePreference` enum). */
export type SchedulePreference = 'EARLY_BIRD' | 'MORNING' | 'FLEXIBLE' | 'EVENING' | 'NIGHT_OWL';

/** Primary social goal (mirrors backend `SocialGoal` enum). */
export type SocialGoal = 'FRIENDSHIP' | 'NETWORKING' | 'MENTORSHIP' | 'HOUSING_MATE' | 'COMMUNITY';

/** Comfortable monthly budget level (mirrors backend `BudgetLevel` enum). */
export type BudgetLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/** Lifecycle status of an anchor application. */
export type AnchorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** A single onboarding answer (values_* / interest_* question keys). */
export interface OnboardingAnswer {
  questionKey: string;
  answerValue: string;
  weight: number;
}

/** App-facing user profile model (camelCase). */
export interface UserProfile {
  id: number;
  authUserId: number;
  fullName: string;
  profilePhotoUrl?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  yearsInCity: number;
  occupation?: string | null;
  workType?: WorkType | null;
  personalityType?: PersonalityType | null;
  schedulePreference?: SchedulePreference | null;
  socialGoal?: SocialGoal | null;
  budgetLevel?: BudgetLevel | null;
  isOnboarded: boolean;
  role: UserRole;
  onboardingAnswers?: OnboardingAnswer[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Wire shape returned by the user-service (snake_case). */
export interface ProfileResponse {
  id: number;
  auth_user_id: number;
  full_name: string;
  profile_photo_url?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  years_in_city: number;
  occupation?: string | null;
  work_type?: WorkType | null;
  personality_type?: PersonalityType | null;
  schedule_preference?: SchedulePreference | null;
  social_goal?: SocialGoal | null;
  budget_level?: BudgetLevel | null;
  is_onboarded: boolean;
  role: UserRole;
  onboarding_answers?: OnboardingAnswer[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Body for `POST /api/users/profile` (authUserId is taken from the JWT). */
export interface ProfileCreateRequest {
  fullName: string;
  profilePhotoUrl?: string;
  /** Optional at creation — onboarding fills it in later. */
  city?: string;
  neighborhood?: string;
  yearsInCity?: number;
  occupation?: string;
  role?: UserRole;
}

/** Body for `PUT /api/users/me` — all fields optional (partial update). */
export interface ProfileUpdateRequest {
  fullName?: string;
  profilePhotoUrl?: string;
  city?: string;
  neighborhood?: string;
  yearsInCity?: number;
  occupation?: string;
  workType?: WorkType;
  personalityType?: PersonalityType;
  schedulePreference?: SchedulePreference;
  socialGoal?: SocialGoal;
  budgetLevel?: BudgetLevel;
  role?: UserRole;
}

/** Body for `POST /api/users/onboarding`. */
export interface OnboardingSubmitRequest {
  answers: OnboardingAnswer[];
}

/** Wire shape returned by `GET /api/users/onboarding/status`. */
export interface OnboardingStatusResponse {
  /** Backend serializes the boolean getter as `onboarded`; both spellings tolerated. */
  onboarded?: boolean;
  isOnboarded?: boolean;
  answerCount: number;
}

/** Body for `POST /api/users/anchor-apply` (arrays are joined into comma strings on send). */
export interface AnchorApplicationRequest {
  yearsInCity: number;
  neighborhoodsKnown: string[];
  languagesSpoken: string[];
  experience: string;
  availability: string;
}

/** Wire shape returned by the user-service anchor-application endpoints. */
export interface AnchorApplicationResponse {
  id: number;
  user_profile_id: number;
  /** Applicant full name — populated on the admin list/review views. */
  full_name?: string;
  years_in_city: number;
  neighborhoods_known: string;
  languages_spoken: string;
  experience: string;
  availability: string;
  status: AnchorStatus;
  applied_at: string;
  reviewed_at?: string | null;
  review_note?: string | null;
}

/** Admin review decision for a pending anchor application. */
export type AnchorReviewDecision = 'APPROVE' | 'REJECT';

/** Body for `PUT /api/users/anchor-applications/{id}/review`. */
export interface AnchorReviewRequest {
  decision: AnchorReviewDecision;
  note?: string;
}

/** App-facing anchor application model (camelCase, mapped from the wire shape). */
export interface AnchorApplication {
  id: number;
  userProfileId: number;
  fullName?: string;
  yearsInCity: number;
  neighborhoodsKnown: string;
  languagesSpoken: string;
  experience: string;
  availability: string;
  status: AnchorStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

/**
 * The onboarding wizard's draft state — persisted to localStorage so a refresh
 * resumes at the last step. `yearsInCity` stays a number; the form coerces it.
 */
export interface OnboardingData {
  fullName: string;
  city: string;
  neighborhood: string;
  yearsInCity: number;
  occupation: string;
  personalityType: PersonalityType | null;
  /** values_* question keys -> rating (1-5); the rating doubles as the weight. */
  values: Record<string, number>;
  interests: string[];
  workType: WorkType | null;
  schedulePreference: SchedulePreference | null;
  socialGoal: SocialGoal | null;
  budgetLevel: BudgetLevel | null;
}
