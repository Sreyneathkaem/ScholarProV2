// api/service/auth.service.ts
import { apiClient } from "../api";
import { API_ENDPOINTS } from "../endpoint";
import {
  LoginCredentials,
  LoginResponse,
  ApiResponse,
  User,
  BackendLoginResponse,
  RefreshTokenResponse,
  TelegramAuthPayload,
  OAuthCallbackResponse,
  ValidateInviteResponse,
  RegisterInviteResponse,
  ForgotPasswordResponse,
  ValidateForgotPasswordResponse,
  ResetForgotPasswordResponse,
  BackendErrorData,
  toAxiosError,
} from "@/types/auth";
import { verifyAndDecodeJWT } from "@/lib/utils/jwt-verify";

// Map the standard-login backend profile to the frontend User shape.
function extractTokens(raw: BackendLoginResponse): {
  token: string;
  user: User | null;
  message: string;
} {
  const user: User | null = raw.userProfile
    ? {
        id: raw.userProfile.id.toString(),
        name: raw.userProfile.name,
        email: raw.userProfile.email,
        role: raw.userProfile.role,
        avatar: raw.userProfile.profileUrl ?? undefined,
      }
    : null;

  return {
    token: raw.token,
    user,
    message: raw.message || "Login successful",
  };
}

export const authService = {
  // ─── Standard admin / committee login (email + password) ──────────────────
  async login(
    credentials: LoginCredentials,
  ): Promise<ApiResponse<LoginResponse>> {
    let res;
    try {
      res = await apiClient.post<BackendLoginResponse>(
        API_ENDPOINTS.LOGIN,
        credentials,
      );
    } catch (error) {
      const err = toAxiosError(error);
      throw new Error(
        err.response?.data?.message ?? err.message ?? "Login failed",
      );
    }

    const { token, user, message } = extractTokens(res.data);

    if (!token || !user) {
      throw new Error(res.data?.message || "Login failed");
    }

    // Verify JWT signature before trusting the payload.
    const verification = await verifyAndDecodeJWT(token);

    if (!verification.valid || !verification.payload) {
      throw new Error(
        `Token signature verification failed: ${verification.error}`,
      );
    }

    // Validate role consistency between the verified JWT and the API response.
    if (verification.payload.role !== user.role) {
      throw new Error(
        "Security error: Role mismatch between token and profile",
      );
    }

    // Use role from the VERIFIED JWT payload — cryptographically guaranteed.
    const verifiedUser: User = {
      ...user,
      role: verification.payload.role,
    };

    return {
      success: true,
      message,
      data: {
        user: verifiedUser,
        token,
        refreshToken: "",
      },
    };
  },

  async logout(redirectTo = "/login") {
    try {
      await apiClient.put(API_ENDPOINTS.LOGOUT);
    } catch {
      // Ignore logout errors (expected if token already expired).
    } finally {
      if (typeof window !== "undefined") {
        window.location.replace(redirectTo);
      }
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    const res = await apiClient.post<RefreshTokenResponse>(
      API_ENDPOINTS.REFRESH,
      {},
    );

    if (!res.data?.token) {
      throw new Error("Refresh failed - no token returned");
    }

    return { token: res.data.token };
  },

  async me(): Promise<ApiResponse<User>> {
    const res = await apiClient.get<ApiResponse<User> | User>(API_ENDPOINTS.ME);
    const data = res.data;

    if ("success" in data && "data" in data) {
      return data as ApiResponse<User>;
    }

    if ("id" in data) {
      return { success: true, data: data as User };
    }

    throw new Error("Invalid response format from /auth/me");
  },

  // ─── Invite validation & registration ─────────────────────────────────────

  async validateInvite(
    id: string,
    token: string,
  ): Promise<{
    success: boolean;
    email?: string;
    raw?: ValidateInviteResponse;
    error?: string;
  }> {
    try {
      const res = await apiClient.get<ValidateInviteResponse>(
        API_ENDPOINTS.VALIDATE_INVITE(id, token),
      );
      const raw = res.data;
      const email = raw.data?.email ?? raw.email;
      return { success: true, email, raw };
    } catch (error) {
      console.error("validateInvite error:", error);
      const err = toAxiosError(error);
      return {
        success: false,
        error:
          err.response?.data?.message ?? err.message ?? "Validation failed",
      };
    }
  },

  async registerWithInvite(
    id: string,
    token: string,
    email: string,
    password: string,
  ): Promise<{
    success: boolean;
    data?: RegisterInviteResponse;
    error?: { message?: string; status?: number; data?: BackendErrorData };
  }> {
    try {
      const res = await apiClient.post<RegisterInviteResponse>(
        API_ENDPOINTS.REGISTER_INVITE(id, token),
        { email, password },
      );
      return { success: true, data: res.data };
    } catch (error) {
      console.error("registerWithInvite error:", error);
      const err = toAxiosError(error);
      return {
        success: false,
        error: {
          message:
            err.response?.data?.message ??
            err.response?.data?.errors?.join(", ") ??
            err.message,
          status: err.response?.status,
          data: err.response?.data,
        },
      };
    }
  },

  // ─── Forgot password flow ──────────────────────────────────────────────────

  async sendForgotPasswordLink(
    email: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await apiClient.post<ForgotPasswordResponse>(
        API_ENDPOINTS.FORGOT_PASSWORD,
        { email },
      );
      return {
        success: true,
        message: res.data.message || "Reset link sent successfully",
      };
    } catch (error) {
      console.error("sendForgotPasswordLink error:", error);
      const err = toAxiosError(error);
      return {
        success: false,
        error:
          err.response?.data?.message ??
          err.message ??
          "Failed to send reset link",
      };
    }
  },

  async validateForgotPasswordToken(
    id: string,
    token: string,
  ): Promise<{ success: boolean; email?: string; error?: string }> {
    try {
      const res = await apiClient.get<ValidateForgotPasswordResponse>(
        API_ENDPOINTS.VALIDATE_FORGOT_PASSWORD(id, token),
      );
      const raw = res.data;
      const email = raw.data?.email ?? raw.email;
      console.log("Validate token response:", { raw, email });
      return { success: true, email };
    } catch (error) {
      console.error("validateForgotPasswordToken error:", error);
      const err = toAxiosError(error);
      return {
        success: false,
        error:
          err.response?.data?.message ??
          err.message ??
          "Invalid or expired link",
      };
    }
  },

  async resetForgotPassword(
    id: string,
    token: string,
    password: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log("🔄 Resetting password with PATCH request");
      console.log("📧 Password length:", password.length);

      const res = await apiClient.patch<ResetForgotPasswordResponse>(
        API_ENDPOINTS.RESET_FORGOT_PASSWORD(id, token),
        { password, newPassword: password },
      );

      console.log("✅ Password reset response:", res.data);
      return {
        success: true,
        message: res.data.message || "Password reset successfully",
      };
    } catch (error) {
      console.error("❌ resetForgotPassword error:", error);
      const err = toAxiosError(error);
      return {
        success: false,
        error:
          err.response?.data?.message ??
          err.message ??
          "Failed to reset password",
      };
    }
  },

  // ─── Student OAuth endpoints ───────────────────────────────────────────────

  /** Returns the Google OAuth authorisation URL (and CSRF state) from the backend. */
  async getGoogleAuthUrl(): Promise<{
    success: boolean;
    url?: string;
    state?: string;
    error?: string;
  }> {
    // Plain `fetch`, not apiClient: this is unauthenticated, so the axios
    // interceptor would first try to refresh a token that does not exist yet,
    // and the response must be readable even when the backend answers 503
    // (Google not configured) — axios would turn that into a thrown error with
    // no message.
    let res: Response;
    try {
      res = await fetch("/api" + API_ENDPOINTS.AUTH_GOOGLE_URL, {
        method: "GET",
        headers: { Accept: "application/json" },
        // Required so the httpOnly googleOauthState cookie minted by the backend
        // is stored and can be sent back for CSRF verification on the callback.
        credentials: "same-origin",
      });
    } catch {
      // `fetch` rejects outright only when the frontend dev server itself is
      // unreachable, so this is almost always "the frontend is not running".
      return {
        success: false,
        error:
          "Could not reach the app server. Make sure the frontend is running on port 3001.",
      };
    }

    let body: { url?: string; state?: string; message?: string } | null = null;
    try {
      body = await res.json();
    } catch {
      // non-JSON body — fall through to the status-based message
    }

    if (!res.ok || !body?.url) {
      return {
        success: false,
        error:
          body?.message ||
          // No JSON body means the request never reached the backend controller.
          // `ts-node-dev` closes port 3000 for a second or two while respawning,
          // and Next.js reports that dead upstream as a 500 — a restart in
          // progress, not a broken configuration. Say so instead of "500".
          (res.status >= 500
            ? "The backend is not responding. It may be restarting after a code change — wait a couple of seconds and try again."
            : `Could not start Google sign-in (${res.status}). Please try again.`),
      };
    }

    // Persist the CSRF state for the callback page to hand back. sessionStorage
    // survives the redirect through Google and is scoped to this tab, which is
    // what ties the callback to the browser that started the flow.
    if (body.state) {
      try {
        sessionStorage.setItem("googleOauthState", body.state);
      } catch {
        // Private-mode storage denial — the callback will report the failure.
      }
    }

    return { success: true, url: body.url, state: body.state };
  },

  /**
   * Exchanges a Google OAuth code for a session token.
   *
   * Uses plain `fetch` (not apiClient) so the auth interceptor does NOT
   * attempt a refresh before this unauthenticated request.  The Next.js
   * proxy rewrite forwards POST /api/auth/google → backend POST /auth/google.
   */
  async postGoogleCallback(
    code: string,
    state?: string,
  ): Promise<OAuthCallbackResponse> {
    const res = await fetch("/api" + API_ENDPOINTS.AUTH_GOOGLE_CALLBACK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // The backend sets the httpOnly refreshToken cookie on this response.
      credentials: "same-origin",
      body: JSON.stringify({ code, state }),
    });

    if (!res.ok) {
      let message = `Authentication failed (${res.status})`;
      try {
        const err = (await res.json()) as { message?: string };
        if (err.message) message = err.message;
      } catch {
        // ignore JSON parse failures — use the status-based message above
      }
      throw new Error(message);
    }

    return res.json() as Promise<OAuthCallbackResponse>;
  },

  /** Forwards Telegram Login Widget data to the backend for verification. */
  async postTelegramCallback(
    payload: TelegramAuthPayload,
  ): Promise<OAuthCallbackResponse> {
    const res = await apiClient.post<OAuthCallbackResponse>(
      API_ENDPOINTS.AUTH_TELEGRAM_CALLBACK,
      payload,
    );
    return res.data;
  },
};
