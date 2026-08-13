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
 *
 * IMPORTANT — the nest-service serializes every response in snake_case
 * (`start_date`, `user_id`, `full_name`, `role_in_nest`, `payer_id`, …).
 * All responses below are mapped to the camelCase app model before they are
 * cached or returned, mirroring the chatService/userService mapper pattern.
 */

const MY_NESTS_KEY = '/api/nests/my-nests';
const nestKey = (nestId: number | string) => `/api/nests/${nestId}`;
const meetingsKey = (nestId: number | string) => `/api/nests/${nestId}/meetings`;
const expensesKey = (nestId: number | string) => `/api/nests/${nestId}/expenses`;
const vibeStatusKey = (nestId: number | string) => `/api/nests/${nestId}/vibe-check/status`;

// ---------------------------------------------------------------------------
// Response mappers (snake_case wire → camelCase app model)
// ---------------------------------------------------------------------------

interface RawNestMember {
  user_id: number;
  full_name: string;
  role_in_nest: NestResponse['members'][number]['roleInNest'];
  status: NestResponse['members'][number]['status'];
  joined_at?: string;
  graduated: boolean;
}

interface RawNest {
  id: number;
  name: string;
  city: string;
  status: NestResponse['status'];
  start_date?: string;
  end_date?: string;
  members: RawNestMember[];
  created_at: string;
}

interface RawMeeting {
  id: number;
  scheduled_at: string;
  venue_name?: string;
  venue_address?: string;
  activity_type?: string;
  description?: string;
  status: MeetingResponse['status'];
}

interface RawExpenseSplit {
  user_id: number;
  amount_owed: number;
  settled: boolean;
}

interface RawExpense {
  id: number;
  payer_id: number;
  amount: number;
  description: string;
  split_type: ExpenseResponse['splitType'];
  splits: RawExpenseSplit[];
  created_at: string;
}

interface RawVibeCheck {
  user_id: number;
  connection_score: number;
  comfort_score: number;
  feedback?: string;
  submitted_at: string;
}

interface RawVibeCheckStatus {
  average_connection: number;
  average_comfort: number;
  overall_average: number;
  submissionCount: number;
  submissions: RawVibeCheck[];
}

function mapNestMember(raw: RawNestMember): NestResponse['members'][number] {
  return {
    userId: raw.user_id,
    fullName: raw.full_name,
    roleInNest: raw.role_in_nest,
    status: raw.status,
    joinedAt: raw.joined_at,
    graduated: raw.graduated,
  };
}

function mapNest(raw: RawNest): NestResponse {
  return {
    id: raw.id,
    name: raw.name,
    city: raw.city,
    status: raw.status,
    startDate: raw.start_date,
    endDate: raw.end_date,
    members: (raw.members ?? []).map(mapNestMember),
    createdAt: raw.created_at,
  };
}

function mapMeeting(raw: RawMeeting): MeetingResponse {
  return {
    id: raw.id,
    scheduledAt: raw.scheduled_at,
    venueName: raw.venue_name,
    venueAddress: raw.venue_address,
    activityType: raw.activity_type,
    description: raw.description,
    status: raw.status,
  };
}

function mapExpense(raw: RawExpense): ExpenseResponse {
  return {
    id: raw.id,
    payerId: raw.payer_id,
    amount: raw.amount,
    description: raw.description,
    splitType: raw.split_type,
    splits: (raw.splits ?? []).map((s) => ({
      userId: s.user_id,
      amountOwed: s.amount_owed,
      settled: s.settled,
    })),
    createdAt: raw.created_at,
  };
}

function mapVibeCheck(raw: RawVibeCheck): VibeCheckResponse {
  return {
    userId: raw.user_id,
    connectionScore: raw.connection_score,
    comfortScore: raw.comfort_score,
    feedback: raw.feedback,
    submittedAt: raw.submitted_at,
  };
}

function mapVibeCheckStatus(raw: RawVibeCheckStatus): VibeCheckStatusResponse {
  return {
    averageConnection: raw.average_connection,
    averageComfort: raw.average_comfort,
    overallAverage: raw.overall_average,
    submissionCount: raw.submissionCount,
    submissions: (raw.submissions ?? []).map(mapVibeCheck),
  };
}

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
export async function getMyNests(): Promise<NestResponse[]> {
  const data = await cachedGet<RawNest[]>(MY_NESTS_KEY, 30_000);
  return data.map(mapNest);
}

/**
 * Fetches full details for a single Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns full nest details including members
 */
export async function getNestById(nestId: number | string): Promise<NestResponse> {
  const data = await cachedGet<RawNest>(nestKey(nestId), 15_000);
  return mapNest(data);
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
  const { data: response } = await api.post<RawMeeting>(meetingsKey(nestId), data);
  invalidateCache(meetingsKey(nestId));
  return mapMeeting(response);
}

/**
 * Lists all meetings for a Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns meetings ordered by scheduled date
 */
export async function getMeetings(nestId: number | string): Promise<MeetingResponse[]> {
  const data = await cachedGet<RawMeeting[]>(meetingsKey(nestId), 15_000);
  return data.map(mapMeeting);
}

/**
 * Marks a scheduled meeting as completed.
 *
 * @param nestId - the nest id
 * @param meetingId - the meeting id
 * @returns the updated meeting
 */
export async function completeMeeting(nestId: number | string, meetingId: number): Promise<MeetingResponse> {
  const { data } = await api.post<RawMeeting>(`${meetingsKey(nestId)}/${meetingId}/complete`);
  invalidateCache(meetingsKey(nestId));
  return mapMeeting(data);
}

/**
 * Cancels a scheduled meeting.
 *
 * @param nestId - the nest id
 * @param meetingId - the meeting id
 * @returns the updated meeting
 */
export async function cancelMeeting(nestId: number | string, meetingId: number): Promise<MeetingResponse> {
  const { data } = await api.post<RawMeeting>(`${meetingsKey(nestId)}/${meetingId}/cancel`);
  invalidateCache(meetingsKey(nestId));
  return mapMeeting(data);
}

/**
 * Creates an expense with EQUAL or CUSTOM splits for a Nest.
 *
 * @param nestId - the nest id
 * @param data - amount, description, split type and custom splits
 * @returns the created expense with splits
 */
export async function createExpense(nestId: number | string, data: ExpenseRequest): Promise<ExpenseResponse> {
  const { data: response } = await api.post<RawExpense>(expensesKey(nestId), data);
  invalidateCache(expensesKey(nestId));
  return mapExpense(response);
}

/**
 * Lists all expenses for a Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns expenses with their splits
 */
export async function getExpenses(nestId: number | string): Promise<ExpenseResponse[]> {
  const data = await cachedGet<RawExpense[]>(expensesKey(nestId), 15_000);
  return data.map(mapExpense);
}

/**
 * Marks the current user's share of an expense as settled.
 *
 * @param nestId - the nest id
 * @param expenseId - the expense id
 * @returns the updated expense
 */
export async function settleExpense(nestId: number | string, expenseId: number): Promise<ExpenseResponse> {
  const { data } = await api.patch<RawExpense>(`${expensesKey(nestId)}/${expenseId}/settle`);
  invalidateCache(expensesKey(nestId));
  return mapExpense(data);
}

/**
 * Submits the current user's vibe check for a Nest.
 *
 * @param nestId - the nest id
 * @param data - connection/comfort scores + optional feedback
 * @returns the submitted vibe check
 */
export async function submitVibeCheck(nestId: number | string, data: VibeCheckRequest): Promise<VibeCheckResponse> {
  const { data: response } = await api.post<RawVibeCheck>(`/api/nests/${nestId}/vibe-check`, data);
  invalidateCache(vibeStatusKey(nestId));
  return mapVibeCheck(response);
}

/**
 * Returns the aggregated vibe-check status for a Nest (cached 15s).
 *
 * @param nestId - the nest id
 * @returns average scores and the individual submissions
 */
export async function getVibeCheckStatus(nestId: number | string): Promise<VibeCheckStatusResponse> {
  const data = await cachedGet<RawVibeCheckStatus>(vibeStatusKey(nestId), 15_000);
  return mapVibeCheckStatus(data);
}

/**
 * Marks a Nest as graduated (anchor action).
 *
 * @param nestId - the nest id
 * @returns the updated Nest
 */
export async function graduateNest(nestId: number | string): Promise<NestResponse> {
  const { data } = await api.post<RawNest>(`${nestKey(nestId)}/graduate`);
  invalidateNest(nestId);
  return mapNest(data);
}

/**
 * Disbands a Nest (anchor action).
 *
 * @param nestId - the nest id
 * @returns the updated Nest
 */
export async function disbandNest(nestId: number | string): Promise<NestResponse> {
  const { data } = await api.post<RawNest>(`${nestKey(nestId)}/disband`);
  invalidateNest(nestId);
  return mapNest(data);
}

/**
 * Leaves a Nest (the membership is marked LEFT server-side).
 *
 * @param nestId - the nest id
 * @returns the updated Nest
 */
export async function leaveNest(nestId: number | string): Promise<NestResponse> {
  const { data } = await api.post<RawNest>(`${nestKey(nestId)}/leave`);
  invalidateNest(nestId);
  return mapNest(data);
}

/**
 * Removes a member from a Nest (anchor-only).
 *
 * @param nestId - the nest id
 * @param userId - the profile id of the member to remove
 * @returns the updated Nest
 */
export async function removeMember(nestId: number | string, userId: number): Promise<NestResponse> {
  const { data } = await api.delete<RawNest>(`${nestKey(nestId)}/members/${userId}`);
  invalidateNest(nestId);
  return mapNest(data);
}
