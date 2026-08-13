import { api, cachedGet, invalidateCache } from '@/services/api';
import type {
  CompatibleUserResponse,
  MatchProposalResponse,
  ProposalMemberResponse,
  RespondProposalRequest,
  RespondProposalResponse,
} from '@/types/matching.types';

/**
 * IMPORTANT — id spaces: every matching endpoint is keyed by the
 * user-service PROFILE id (the same ids used for compatibles, proposals and
 * nest members). The auth-service id from the JWT is a different id space;
 * callers must pass `user.id` (profile id), never `user.authUserId`.
 */

/**
 * Matching-service API — thin wrappers around the shared axios instance.
 * All endpoints hit the API Gateway (baseURL from `services/api.ts`).
 *
 * GET endpoints use the short-lived cache so the dashboard, discover page,
 * and sidebar never duplicate the same fetch.
 *
 * NOTE: the matching-service serializes responses in snake_case, so every
 * GET is mapped to the camelCase app model before it is cached/returned.
 */

const compatiblesKey = (userId: number) => `/api/matching/compatibles/${userId}`;
const proposalsKey = (userId: number) => `/api/matching/proposals/pending/${userId}`;

/** Wire shape of a compatibility entry (snake_case from the backend). */
interface CompatibleWire {
  user_id: number;
  full_name?: string | null;
  city?: string | null;
  overall_score: number;
  values_score?: number | null;
  lifestyle_score?: number | null;
  interest_score?: number | null;
}

/** Wire shape of a proposal member (the backend sends no names). */
interface ProposalMemberWire {
  user_id: number;
  role_in_nest: 'MEMBER' | 'ANCHOR';
  response: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  responded_at?: string | null;
}

/** Wire shape of a proposal (snake_case from the backend). */
interface ProposalWire {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  proposed_at?: string | null;
  expires_at?: string | null;
  accepted_at?: string | null;
  nest_id?: number | null;
  members: ProposalMemberWire[];
}

/** Maps a snake_case compatibility entry to the camelCase app model. */
function mapCompatible(raw: CompatibleWire): CompatibleUserResponse {
  return {
    userId: raw.user_id,
    fullName: raw.full_name ?? 'Neighbor',
    city: raw.city ?? 'Unknown city',
    overallScore: Number(raw.overall_score ?? 0),
    valuesScore: Number(raw.values_score ?? 0),
    lifestyleScore: Number(raw.lifestyle_score ?? 0),
    interestScore: Number(raw.interest_score ?? 0),
    // The matching-service does not enrich compatibles with interests.
    interests: [],
  };
}

/** Maps a snake_case proposal member (the backend returns no names). */
function mapProposalMember(raw: ProposalMemberWire): ProposalMemberResponse {
  return {
    userId: raw.user_id,
    // The matching-service does not enrich proposal members with names, so
    // the UI falls back to a generic label until that lands server-side.
    fullName: '',
    roleInNest: raw.role_in_nest,
    response: raw.response,
  };
}

/** Maps a snake_case proposal to the camelCase app model. */
function mapProposal(raw: ProposalWire): MatchProposalResponse {
  return {
    id: raw.id,
    status: raw.status,
    proposedAt: raw.proposed_at ?? '',
    expiresAt: raw.expires_at ?? '',
    acceptedAt: raw.accepted_at ?? undefined,
    nestId: raw.nest_id ?? undefined,
    members: (raw.members ?? []).map(mapProposalMember),
  };
}

/**
 * Triggers a fresh compatibility calculation for a user.
 *
 * The endpoint computes scores against every eligible user and returns the
 * number of scores computed (a plain count), not the compatible list — the
 * caller then re-fetches `getCompatibles` for the ranked results.
 *
 * @param userId - the user's PROFILE id
 * @returns how many compatibility scores were computed
 */
export async function calculateCompatibility(userId: number): Promise<number> {
  const { data } = await api.post<number>(`/api/matching/calculate/${userId}`);
  invalidateCache(compatiblesKey(userId));
  return data;
}

/**
 * Lists the user's top compatible matches (cached 30s).
 *
 * @param userId - the user's id
 * @returns a ranked list of compatible users
 */
export async function getCompatibles(userId: number): Promise<CompatibleUserResponse[]> {
  const data = await cachedGet<CompatibleWire[]>(compatiblesKey(userId), 30_000);
  return data.map(mapCompatible);
}

/**
 * Lists the user's pending Nest proposals / invitations (cached 30s).
 *
 * @param userId - the user's id
 * @returns pending proposals
 */
export async function getPendingProposals(userId: number): Promise<MatchProposalResponse[]> {
  const data = await cachedGet<ProposalWire[]>(proposalsKey(userId), 30_000);
  return data.map(mapProposal);
}

/**
 * Accepts or declines a pending Nest proposal.
 *
 * The backend DTO is `{ accept: boolean }` (NOT a `response` enum) — sending
 * anything else surfaces a 400 validation error and the invitation appears
 * broken.
 *
 * @param proposalId - the proposal id
 * @param response - 'ACCEPTED' | 'DECLINED'
 * @returns the updated proposal
 */
export async function respondToProposal(
  proposalId: number,
  response: 'ACCEPTED' | 'DECLINED'
): Promise<RespondProposalResponse> {
  const { data } = await api.post<RespondProposalResponse>(
    `/api/matching/proposals/${proposalId}/respond`,
    { accept: response === 'ACCEPTED' } satisfies RespondProposalRequest
  );
  return data;
}

/**
 * Creates a Nest formation proposal (5–8 people total, 1–2 anchors).
 *
 * The caller MUST be included in `userIds` to be part of the resulting Nest
 * (the backend does not add the creator automatically). All members start
 * PENDING — including the creator, who should accept right after creating.
 *
 * @param userIds - profile ids of all proposed members (5–8)
 * @param anchorIds - profile ids of the 1–2 anchors (subset of userIds)
 * @returns the created proposal
 */
export async function createProposal(
  userIds: number[],
  anchorIds: number[]
): Promise<MatchProposalResponse> {
  const { data } = await api.post<ProposalWire>('/api/matching/propose', { userIds, anchorIds });
  return mapProposal(data);
}

/**
 * Drops the cached pending-proposals list for a user (call after responding).
 *
 * @param userId - the user whose proposal list changed
 */
export function invalidateProposals(userId: number): void {
  invalidateCache(proposalsKey(userId));
}
