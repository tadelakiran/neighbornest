import { cachedGet, invalidateCache } from '@/services/api';
import type { NestDetailResponse, NestSummaryResponse } from '@/types/nest.types';

/**
 * Nest-service API — thin wrappers around the shared axios instance.
 * All endpoints hit the API Gateway (baseURL from `services/api.ts`).
 */

/**
 * Lists the current user's Nests (cached 30s).
 *
 * @returns an array of nest summaries
 */
export function getMyNests(): Promise<NestSummaryResponse[]> {
  return cachedGet<NestSummaryResponse[]>('/api/nests/my-nests', 30_000);
}

/**
 * Fetches full details for a single Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns full nest details including members
 */
export function getNestById(nestId: number | string): Promise<NestDetailResponse> {
  return cachedGet<NestDetailResponse>(`/api/nests/${nestId}`, 15_000);
}

/**
 * Invalidates the cached my-nests list (call after a proposal is accepted so
 * the new Nest appears immediately).
 */
export function invalidateMyNests(): void {
  invalidateCache('/api/nests/my-nests');
}
