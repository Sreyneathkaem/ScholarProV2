// lib/types/auth.ts

// ─── Shared ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "committee" | "student";

// ─── Frontend types ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  data: T;
  message?: string;
}

// ─── Backend: Standard Login (POST /auth/login) ────────────────────────────────

export interface LoginUserProfile {
  id: number;
  name: string;
  email: string;
  profileUrl: string | null;
  phoneNumber: string | null;
  role: UserRole;
}

export interface BackendLoginResponse {
  success: boolean;
  message: string;
  userProfile: LoginUserProfile;
  token: string;
  refreshTokens: string;
  expiresIn?: number;
}

// ─── Backend: Token Refresh (POST /auth/refresh) ──────────────────────────────

export interface RefreshTokenResponse {
  token: string;
}

// ─── Backend: OAuth Callback (Google / Telegram) ──────────────────────────────
// Matches: POST /auth/google/callback  and  POST /auth/telegram/callback
//
// {
//   "success": true,
//   "message": "Google login successful",
//   "data": {
//     "userProfile": { "id": "019cb4f1-...", "name": "...", "role": "student", ... },
//     "accessToken": "eyJ..."
//   }
// }

export interface OAuthUserProfile {
  id: string;
  name: string;
  email: string;
  profileUrl: string | null;
  phoneNumber: string | null;
  role: UserRole;
}

export interface OAuthCallbackData {
  userProfile: OAuthUserProfile;
  accessToken: string;
}

export interface OAuthCallbackResponse {
  success: boolean;
  message: string;
  data: OAuthCallbackData;
}

// ─── Backend: Google Auth URL (GET /auth/google) ──────────────────────────────

export interface GoogleAuthUrlResponse {
  url: string;
}

// ─── OAuth Payloads ────────────────────────────────────────────────────────────

export interface GoogleCallbackPayload {
  code: string;
}

/** Fields sent by the Telegram Login Widget via query params. */
export interface TelegramAuthPayload {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

// ─── Backend: Invite Validation & Registration ────────────────────────────────

export interface ValidateInviteData {
  email?: string;
}

export interface ValidateInviteResponse {
  success?: boolean;
  message?: string;
  data?: ValidateInviteData;
  /** Flat fallback some endpoints return. */
  email?: string;
}

export interface RegisterInviteResponse {
  success?: boolean;
  message?: string;
}

// ─── Backend: Forgot Password ─────────────────────────────────────────────────

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidateForgotPasswordData {
  email?: string;
}

export interface ValidateForgotPasswordResponse {
  success?: boolean;
  message?: string;
  data?: ValidateForgotPasswordData;
  /** Flat fallback some endpoints return. */
  email?: string;
}

export interface ResetForgotPasswordResponse {
  success: boolean;
  message: string;
}

// ─── Error Helpers ─────────────────────────────────────────────────────────────

export interface BackendErrorData {
  message?: string;
  errors?: string[];
}

/** Typed subset of an Axios error used in catch blocks. */
export interface AxiosLikeError extends Error {
  response?: {
    data?: BackendErrorData;
    status?: number;
  };
}

/**
 * Narrows an unknown catch-block value to `AxiosLikeError` so that
 * response.data and response.status can be accessed without casting.
 */
export function toAxiosError(error: unknown): AxiosLikeError {
  if (error instanceof Error) {
    return error as AxiosLikeError;
  }
  return new Error("Unknown error") as AxiosLikeError;
}
