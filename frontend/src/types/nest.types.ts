/**
 * TypeScript contracts for the nest-service API (Module 3: Nest Hub).
 *
 * Responses are serialized in snake_case; the interfaces below model the real
 * wire format so the app stays correct without runtime transforms.
 */

/** Lifecycle status of a Nest. */
export type NestStatus = 'FORMING' | 'ACTIVE' | 'VIBE_CHECK' | 'GRADUATED' | 'DISBANDED';

/** Role of a user inside a Nest. */
export type NestRole = 'MEMBER' | 'ANCHOR';

/** Summary of a Nest — used by the my-nests list. */
export interface NestSummaryResponse {
  id: number;
  name: string;
  city: string;
  status: NestStatus;
  memberCount: number;
  nextMeetingDate?: string;
}

/** A member of a Nest. */
export interface NestMemberResponse {
  userId: number;
  fullName: string;
  roleInNest: NestRole;
  profilePhotoUrl?: string;
}

/** Full Nest details — used by the Nest detail page. */
export interface NestDetailResponse {
  id: number;
  name: string;
  city: string;
  neighborhood?: string;
  status: NestStatus;
  startDate?: string;
  endDate?: string;
  members: NestMemberResponse[];
  nextMeetingDate?: string;
}
