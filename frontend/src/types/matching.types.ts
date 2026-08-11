/**
 * TypeScript contracts for the matching-service API (Module 3: Discover & Proposals).
 *
 * Like the other modules, *responses* are serialized in snake_case while
 * *request* bodies use camelCase. Enum values mirror the backend enums exactly.
 */

/** A user surfaced as a compatible match after compatibility calculation. */
export interface CompatibleUserResponse {
  userId: number;
  fullName: string;
  city: string;
  overallScore: number;
  valuesScore: number;
  lifestyleScore: number;
  interestScore: number;
  profilePhotoUrl?: string;
  /** The matching-service does not send interests; defaults to [] on the client. */
  interests: string[];
}

/** Lifecycle status of a Nest proposal. */
export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

/** A member inside a Nest proposal (already part of the proposing group). */
export interface ProposalMemberResponse {
  userId: number;
  /** The matching-service currently sends no names for proposal members. */
  fullName?: string;
  roleInNest: 'MEMBER' | 'ANCHOR';
  response: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  profilePhotoUrl?: string;
}

/** A pending invitation to join a Nest. */
export interface MatchProposalResponse {
  id: number;
  status: ProposalStatus;
  proposedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  nestId?: number;
  members: ProposalMemberResponse[];
  /** City of the inviting Nest — may be absent depending on backend version. */
  city?: string;
}

/** Body for `POST /api/matching/proposals/{proposalId}/respond`. */
export interface RespondProposalRequest {
  response: 'ACCEPTED' | 'DECLINED';
}

/** Server acknowledgement for a proposal response. */
export interface RespondProposalResponse {
  proposalId: number;
  status: ProposalStatus;
}
