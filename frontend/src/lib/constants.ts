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
  DISCOVER: '/discover',
  PROPOSALS: '/proposals',
  PROFILE: '/profile',
  ONBOARDING: '/onboarding',
  ANCHOR_APPLY: '/profile/anchor-apply',
  /** My Nest — list of the user's Nests. */
  MY_NEST: '/nests',
  /** Nest detail hub — path pattern `/nests/:nestId`. */
  NEST_DETAIL: '/nests/:nestId',
  MESSAGES: '/messages',
} as const;

/** Builds a nest detail path from a nest id. */
export function nestDetailPath(nestId: number | string): string {
  return `/nests/${nestId}`;
}

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
