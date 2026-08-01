import { api } from '@/services/api';
import type {
  AuthResponse,
  AuthUserResponse,
  LoginRequest,
  LogoutRequest,
  ProfileResponse,
  RefreshTokenRequest,
  RegisterRequest,
  User,
} from '@/types/auth.types';

/**
 * Maps an auth-service UserResponse (registration) to the app User model.
 *
 * @param response - snake_case wire payload from `POST /api/auth/register`
 * @returns the app-facing User model
 */
export function mapAuthUserToUser(response: AuthUserResponse): User {
  return {
    id: response.id,
    fullName: response.full_name,
    email: response.email,
    role: response.role,
    isOnboarded: response.is_onboarded,
    profilePhotoUrl: response.profile_photo_url ?? null,
    city: response.city ?? null,
    neighborhood: response.neighborhood ?? null,
    createdAt: response.created_at ?? null,
  };
}

/**
 * Maps a user-service ProfileResponse to the app User model.
 *
 * @param response - snake_case wire payload from `GET /api/users/me`
 * @returns the app-facing User model (no email — not returned by this endpoint)
 */
export function mapProfileToUser(response: ProfileResponse): User {
  return {
    id: response.id,
    authUserId: response.auth_user_id,
    fullName: response.full_name,
    role: response.role,
    isOnboarded: response.is_onboarded,
    profilePhotoUrl: response.profile_photo_url ?? null,
    city: response.city ?? null,
    neighborhood: response.neighborhood ?? null,
    createdAt: response.created_at ?? null,
  };
}

/**
 * Auth API service — thin wrappers around the axios instance.
 * All endpoints hit the API Gateway (baseURL from `services/api.ts`).
 */
export const authService = {
  /** POST /api/auth/login — returns JWT tokens. */
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', payload);
    return data;
  },

  /** POST /api/auth/register — creates the account and returns the new user. */
  async register(payload: RegisterRequest): Promise<User> {
    const { data } = await api.post<AuthUserResponse>('/api/auth/register', payload);
    return mapAuthUserToUser(data);
  },

  /** POST /api/auth/refresh — exchanges a refresh token for new tokens. */
  async refreshToken(payload: RefreshTokenRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/api/auth/refresh', payload);
    return data;
  },

  /** POST /api/auth/logout — invalidates the refresh token server-side. */
  async logout(payload?: LogoutRequest): Promise<void> {
    await api.post('/api/auth/logout', payload ?? {});
  },

  /** GET /api/users/me — returns the current user's profile. */
  async getMe(): Promise<ProfileResponse> {
    const { data } = await api.get<ProfileResponse>('/api/users/me');
    return data;
  },
};
