/**
 * TypeScript contracts for the NeighborNest authentication API.
 *
 * IMPORTANT: the backend serializes *responses* in snake_case
 * (e.g. `access_token`, `full_name`, `is_onboarded`) while *request* bodies
 * use camelCase. These interfaces model the real wire format so the app
 * stays correct without runtime transforms.
 */

/** Platform role of a user. */
export type UserRole = 'NEWCOMER' | 'ANCHOR' | 'ADMIN';

/** Wire shape returned by `POST /api/auth/register` (auth-service UserResponse). */
export interface AuthUserResponse {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_onboarded: boolean;
  is_email_verified?: boolean;
  city?: string | null;
  neighborhood?: string | null;
  profile_photo_url?: string | null;
  created_at?: string | null;
}

/** Wire shape returned by `GET /api/users/me` (user-service ProfileResponse). */
export interface ProfileResponse {
  id: number;
  auth_user_id: number;
  full_name: string;
  profile_photo_url?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  years_in_city?: number;
  occupation?: string | null;
  work_type?: string | null;
  personality_type?: string | null;
  schedule_preference?: string | null;
  social_goal?: string | null;
  budget_level?: string | null;
  is_onboarded: boolean;
  role: UserRole;
  /** Onboarding answers — consumed in Module 2. */
  onboarding_answers?: unknown[];
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * App-facing user model used across the UI.
 * `email` is only present when the source is the auth-service response
 * (registration) — `GET /api/users/me` does not return an email.
 */
export interface User {
  id: number;
  fullName: string;
  role: UserRole;
  isOnboarded: boolean;
  email?: string | null;
  profilePhotoUrl?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  /** Id of the linked auth-service user (only on the profile response). */
  authUserId?: number | null;
  createdAt?: string | null;
}

/** Body for `POST /api/auth/login`. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Why a one-time passcode is being requested/verified. */
export type OtpPurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

/** Body for `POST /api/auth/register`. */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  /** 6-digit code emailed to the user to prove they own the address. */
  otp: string;
}

/** Body for `POST /api/auth/otp/send`. */
export interface SendOtpRequest {
  email: string;
  purpose: OtpPurpose;
}

/** Wire shape returned by `POST /api/auth/otp/send`. */
export interface OtpSendResponse {
  email: string;
  purpose: OtpPurpose;
  expires_in_seconds: number;
  resend_after_seconds: number;
}

/** Body for `POST /api/auth/password/forgot`. */
export interface ForgotPasswordRequest {
  email: string;
}

/** Body for `POST /api/auth/password/reset`. */
export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

/** Wire shape returned by `POST /api/auth/login` and `POST /api/auth/refresh`. */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

/** Body for `POST /api/auth/refresh`. */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** Body for `POST /api/auth/logout` (optional). */
export interface LogoutRequest {
  refreshToken?: string;
}

/** Standardized API error body returned by all services. */
export interface ApiError {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  validationErrors?: Record<string, string>;
  service?: string;
}

/** Supported toast notification types. */
export type ToastType = 'success' | 'error' | 'info';

/** A single toast notification entry. */
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Epoch ms when the toast was added (drives the auto-dismiss progress bar). */
  createdAt: number;
}
