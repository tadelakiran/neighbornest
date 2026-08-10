import { api, cachedGet, invalidateCache } from '@/services/api';
import type {
  ExpenseRequest,
  ExpenseResponse,
  MeetingRequest,
  MeetingResponse,
  NestResponse,
  VibeCheckRequest,
  VibeCheckResponse,
  VibeCheckStatusResponse,
} from '@/types/nest.types';

/**
 * Nest-service API — thin wrappers around the shared axios instance.
 * All endpoints hit the API Gateway (baseURL from `services/api.ts`) and
 * require a valid JWT, attached by the request interceptor.
 *
 * GET endpoints use the short-lived cache; every mutating call invalidates the
 * affected keys so the UI always reflects the latest state.
 */

const MY_NESTS_KEY = '/api/nests/my-nests';
const nestKey = (nestId: number | string) => `/api/nests/${nestId}`;
const meetingsKey = (nestId: number | string) => `/api/nests/${nestId}/meetings`;
const expensesKey = (nestId: number | string) => `/api/nests/${nestId}/expenses`;
const vibeStatusKey = (nestId: number | string) => `/api/nests/${nestId}/vibe-check/status`;

/** Drops every cached key for a nest (nest + its meetings/expenses/vibe). */
function invalidateNest(nestId: number | string): void {
  invalidateCache(nestKey(nestId));
  invalidateCache(meetingsKey(nestId));
  invalidateCache(expensesKey(nestId));
  invalidateCache(vibeStatusKey(nestId));
  invalidateCache(MY_NESTS_KEY);
}

/**
 * Lists the current user's Nests (active + graduated), cached 30s.
 *
 * @returns an array of full nest responses
 */
export function getMyNests(): Promise<NestResponse[]> {
  return cachedGet<NestResponse[]>(MY_NESTS_KEY, 30_000);
}

/**
 * Fetches full details for a single Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns full nest details including members
 */
export function getNestById(nestId: number | string): Promise<NestResponse> {
  return cachedGet<NestResponse>(nestKey(nestId), 15_000);
}

/** Drops the cached my-nests list (call after a proposal is accepted). */
export function invalidateMyNests(): void {
  invalidateCache(MY_NESTS_KEY);
}

/**
 * Schedules a new meeting for a Nest.
 *
 * @param nestId - the nest id
 * @param data - meeting details (scheduledAt as ISO-8601)
 * @returns the created meeting
 */
export async function scheduleMeeting(nestId: number | string, data: MeetingRequest): Promise<MeetingResponse> {
  const { data: response } = await api.post<MeetingResponse>(meetingsKey(nestId), data);
  invalidateCache(meetingsKey(nestId));
  return response;
}

/**
 * Lists all meetings for a Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns meetings ordered by scheduled date
 */
export function getMeetings(nestId: number | string): Promise<MeetingResponse[]> {
  return cachedGet<MeetingResponse[]>(meetingsKey(nestId), 15_000);
}

/**
 * Marks a scheduled meeting as completed.
 *
 * @param nestId - the nest id
 * @param meetingId - the meeting id
 * @returns the updated meeting
 */
export async function completeMeeting(nestId: number | string, meetingId: number): Promise<MeetingResponse> {
  const { data } = await api.post<MeetingResponse>(`${meetingsKey(nestId)}/${meetingId}/complete`);
  invalidateCache(meetingsKey(nestId));
  return data;
}

/**
 * Cancels a scheduled meeting.
 *
 * @param nestId - the nest id
 * @param meetingId - the meeting id
 * @returns the updated meeting
 */
export async function cancelMeeting(nestId: number | string, meetingId: number): Promise<MeetingResponse> {
  const { data } = await api.post<MeetingResponse>(`${meetingsKey(nestId)}/${meetingId}/cancel`);
  invalidateCache(meetingsKey(nestId));
  return data;
}

/**
 * Creates an expense with EQUAL or CUSTOM splits for a Nest.
 *
 * @param nestId - the nest id
 * @param data - amount, description, split type and custom splits
 * @returns the created expense with splits
 */
export async function createExpense(nestId: number | string, data: ExpenseRequest): Promise<ExpenseResponse> {
  const { data: response } = await api.post<ExpenseResponse>(expensesKey(nestId), data);
  invalidateCache(expensesKey(nestId));
  return response;
}

/**
 * Lists all expenses for a Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns expenses with their splits
 */
export function getExpenses(nestId: number | string): Promise<ExpenseResponse[]> {
  return cachedGet<ExpenseResponse[]>(expensesKey(nestId), 15_000);
}

/**
 * Marks the current user's share of an expense as settled.
 *
 * @param nestId - the nest id
 * @param expenseId - the expense id
 * @returns the updated expense
 */
export async function settleExpense(nestId: number | string, expenseId: number): Promise<ExpenseResponse> {
  const { data } = await api.patch<ExpenseResponse>(`${expensesKey(nestId)}/${expenseId}/settle`);
  invalidateCache(expensesKey(nestId));
  return data;
}

/**
 * Submits the current user's vibe check for a Nest.
 *
 * @param nestId - the nest id
 * @param data - connection/comfort scores + optional feedback
 * @returns the submitted vibe check
 */
export async function submitVibeCheck(nestId: number | string, data: VibeCheckRequest): Promise<VibeCheckResponse> {
  const { data: response } = await api.post<VibeCheckResponse>(`/api/nests/${nestId}/vibe-check`, data);
  invalidateCache(vibeStatusKey(nestId));
  return response;
}

/**
 * Returns the aggregated vibe-check status for a Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns average scores and the individual submissions
 */
export function getVibeCheckStatus(nestId: number | string): Promise<VibeCheckStatusResponse> {
  return cachedGet<VibeCheckStatusResponse>(vibeStatusKey(nestId), 15_000);
}

/**
 * Marks a Nest as graduated (anchor action).
 *
 * @param nestId - the nest id
 * @returns the updated Nest
 */
export async function graduateNest(nestId: number | string): Promise<NestResponse> {
  const { data } = await api.post<NestResponse>(`${nestKey(nestId)}/graduate`);
  invalidateNest(nestId);
  return data;
}

/**
 * Disbands a Nest (anchor action).
 *
 * @param nestId - the nest id
 * @returns the updated Nest
 */
export async function disbandNest(nestId: number | string): Promise<NestResponse> {
  const { data } = await api.post<NestResponse>(`${nestKey(nestId)}/disband`);
  invalidateNest(nestId);
  return data;
}

/**
 * Leaves a Nest (the membership is marked LEFT server-side).
 *
 * @param nestId - the nest id
 * @returns the updated Nest
 */
export async function leaveNest(nestId: number | string): Promise<NestResponse> {
  const { data } = await api.post<NestResponse>(`${nestKey(nestId)}/leave`);
  invalidateNest(nestId);
  return data;
}

/**
 * Removes a member from a Nest (anchor-only).
 *
 * @param nestId - the nest id
 * @param userId - the profile id of the member to remove
 * @returns the updated Nest
 */
export async function removeMember(nestId: number | string, userId: number): Promise<NestResponse> {
  const { data } = await api.delete<NestResponse>(`${nestKey(nestId)}/members/${userId}`);
  invalidateNest(nestId);
  return data;
}
