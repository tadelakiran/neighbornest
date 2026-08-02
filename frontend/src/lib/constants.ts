/**
 * App-wide constants and shared configuration.
 */

/** Display name of the platform. */
export const APP_NAME = 'NeighborNest';

/** Centralized route paths — import these instead of hardcoding strings. */
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  ONBOARDING: '/onboarding',
  ANCHOR_APPLY: '/profile/anchor-apply',
  MY_NEST: '/my-nest',
  MESSAGES: '/messages',
} as const;

/** localStorage key that holds the refresh token (access token stays in memory only). */
export const REFRESH_TOKEN_STORAGE_KEY = 'neighbornest.refreshToken';

/** localStorage key holding the onboarding wizard draft (resume-after-refresh). */
export const ONBOARDING_DRAFT_KEY = 'neighbornest.onboarding.draft';

/** localStorage key holding notification preference toggles. */
export const NOTIFICATION_PREFS_KEY = 'neighbornest.notifications';

/**
 * Password strength rule — mirrors the backend auth-service constraint:
 * at least one lowercase, one uppercase, one digit, and one special character.
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/;

/** How long toast notifications stay on screen before auto-dismissing. */
export const TOAST_DURATION_MS = 4000;
