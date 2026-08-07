import { api, cachedGet, invalidateCache } from '@/services/api';
import type {
  CompatibleUserResponse,
  MatchProposalResponse,
  RespondProposalRequest,
  RespondProposalResponse,
} from '@/types/matching.types';

/**
 * Matching-service API — thin wrappers around the shared axios instance.
 * All endpoints hit the API Gateway (baseURL from `services/api.ts`).
 *
 * GET endpoints use the short-lived cache so the dashboard, discover page,
 * and sidebar never duplicate the same fetch.
 */

const compatiblesKey = (userId: number) => `/api/matching/compatibles/${userId}`;
const proposalsKey = (userId: number) => `/api/matching/proposals/pending/${userId}`;

/**
 * Triggers a fresh compatibility calculation for a user.
 *
 * @param userId - the user's id (auth-user id from the session)
 * @returns the calculated compatible users
 */
export async function calculateCompatibility(userId: number): Promise<CompatibleUserResponse[]> {
  const { data } = await api.post<CompatibleUserResponse[]>(`/api/matching/calculate/${userId}`);
  invalidateCache(compatiblesKey(userId));
  return data;
}

/**
 * Lists the user's top compatible matches (cached 30s).
 *
 * @param userId - the user's id
 * @returns a ranked list of compatible users
 */
export function getCompatibles(userId: number): Promise<CompatibleUserResponse[]> {
  return cachedGet<CompatibleUserResponse[]>(compatiblesKey(userId), 30_000);
}

/**
 * Lists the user's pending Nest proposals / invitations (cached 30s).
 *
 * @param userId - the user's id
 * @returns pending proposals
 */
export function getPendingProposals(userId: number): Promise<MatchProposalResponse[]> {
  return cachedGet<MatchProposalResponse[]>(proposalsKey(userId), 30_000);
}

/**
 * Accepts or declines a pending Nest proposal.
 *
 * @param proposalId - the proposal id
 * @param response - 'ACCEPTED' | 'DECLINED'
 * @returns the server confirmation
 */
export async function respondToProposal(
  proposalId: number,
  response: RespondProposalRequest['response']
): Promise<RespondProposalResponse> {
  const { data } = await api.post<RespondProposalResponse>(
    `/api/matching/proposals/${proposalId}/respond`,
    { response } satisfies RespondProposalRequest
  );
  return data;
}

/**
 * Drops the cached pending-proposals list for a user (call after responding).
 *
 * @param userId - the user whose proposal list changed
 */
export function invalidateProposals(userId: number): void {
  invalidateCache(proposalsKey(userId));
}
