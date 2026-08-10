/**
 * TypeScript contracts for the nest-service API (Module 4: Nest Hub).
 *
 * These interfaces model the REAL backend wire format, verified against the
 * DTOs in `backend/nest-service` (Jackson serializes the camelCase field names
 * as-is, so JSON keys match the property names below).
 */

/** Lifecycle status of a Nest. */
export type NestStatus = 'FORMING' | 'ACTIVE' | 'VIBE_CHECK' | 'RE_MATCHING' | 'GRADUATED' | 'DISBANDED';

/** Role of a user inside a Nest. */
export type NestRole = 'MEMBER' | 'ANCHOR';

/** Lifecycle status of a Nest membership. */
export type NestMemberStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'LEFT' | 'REMOVED';

/** Lifecycle status of a scheduled meeting. */
export type MeetingStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

/** How an expense is split among members. */
export type SplitType = 'EQUAL' | 'CUSTOM';

/** A member of a Nest (ids reference user-service profile ids). */
export interface NestMemberResponse {
  userId: number;
  fullName: string;
  roleInNest: NestRole;
  status: NestMemberStatus;
  joinedAt?: string;
  graduated: boolean;
  /** Not part of the wire format — the UI attaches photos when known. */
  profilePhotoUrl?: string;
}

/** Full Nest details — returned by `/api/nests/{nestId}` and `/my-nests`. */
export interface NestResponse {
  id: number;
  name: string;
  city: string;
  status: NestStatus;
  /** LocalDate (yyyy-MM-dd). */
  startDate?: string;
  /** LocalDate (yyyy-MM-dd), set once the Nest ends. */
  endDate?: string;
  members: NestMemberResponse[];
  createdAt: string;
}

/** A scheduled meeting inside a Nest. */
export interface MeetingResponse {
  id: number;
  /** ISO-8601 LocalDateTime. */
  scheduledAt: string;
  venueName?: string;
  venueAddress?: string;
  activityType?: string;
  description?: string;
  status: MeetingStatus;
}

/** Body for `POST /api/nests/{nestId}/meetings`. */
export interface MeetingRequest {
  scheduledAt: string;
  venueName: string;
  venueAddress?: string;
  activityType?: string;
  description?: string;
}

/** One member's share of an expense. */
export interface ExpenseSplitResponse {
  userId: number;
  amountOwed: number;
  settled: boolean;
}

/** A shared expense with per-member splits. */
export interface ExpenseResponse {
  id: number;
  payerId: number;
  amount: number;
  description: string;
  splitType: SplitType;
  splits: ExpenseSplitResponse[];
  /** ISO-8601 LocalDateTime. */
  createdAt: string;
}

/** A single custom split entry in an expense request. */
export interface ExpenseSplitRequest {
  userId: number;
  amountOwed: number;
}

/** Body for `POST /api/nests/{nestId}/expenses`. */
export interface ExpenseRequest {
  amount: number;
  description: string;
  splitType: SplitType;
  /** Empty for EQUAL (the backend splits across active members). */
  splits: ExpenseSplitRequest[];
}

/** Body for `POST /api/nests/{nestId}/vibe-check`. */
export interface VibeCheckRequest {
  connectionScore: number;
  comfortScore: number;
  feedback?: string;
}

/** A single vibe-check submission (user ids kept for membership checks). */
export interface VibeCheckResponse {
  userId: number;
  connectionScore: number;
  comfortScore: number;
  feedback?: string;
  /** ISO-8601 LocalDateTime. */
  submittedAt: string;
}

/** Aggregated vibe-check status — returned by `/api/nests/{nestId}/vibe-check/status`. */
export interface VibeCheckStatusResponse {
  averageConnection: number;
  averageComfort: number;
  overallAverage: number;
  submissionCount: number;
  submissions: VibeCheckResponse[];
}
