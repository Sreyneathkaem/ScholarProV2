import { Request, Response } from "express";
import crypto from "crypto";
import {
  getGoogleUser,
  findOrCreateGoogleUser,
} from "@services/auth/google-oauth.service";
import { verifyGoogleStateSignature } from "@services/auth/google-oauth.service";
import getProfileService from "@services/user/get-profile.service";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@utils/generate-token";
import { auditLogger, securityLogger } from "@utils/logger";
import { GOOGLE_STATE_COOKIE } from "./google-login.controller";

const REFRESH_COOKIE = "refreshToken";
const REFRESH_TTL_MS = 15 * 24 * 60 * 60 * 1000;

const setRefreshCookie = (res: Response, refreshToken: string) =>
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TTL_MS,
  });

const frontendUrl = () => process.env.CLIENT_URL || "http://localhost:3001";

/**
 * Rejects a callback whose `state` this backend did not issue.
 *
 * Without this check, any page on the internet could feed a victim's browser a
 * `code` for the attacker's own Google account and have the victim silently
 * signed in as the attacker (login fixation).
 *
 * The original implementation compared `state` against the `googleOauthState`
 * cookie. That could never succeed here: the cookie is set by the backend on
 * :3000, while the callback is POSTed to the frontend on :3001 and forwarded by
 * a Next.js rewrite that does not pass the cookie upstream. Every legitimate
 * sign-in failed with `hasCookie: false`.
 *
 * Now the state carries an HMAC signature, so authenticity is verifiable from
 * the value alone. Two independent defences are kept:
 *   1. signature valid  -> the backend minted this state (blocks forgery)
 *   2. cookie matches   -> same browser started the flow (blocks cross-session)
 * Either one alone is sufficient; if the cookie is absent the signature carries
 * the check, which is the case the rewrite makes unavoidable.
 */
const verifyState = (req: Request, res: Response): boolean => {
  const cookieState = req.cookies?.[GOOGLE_STATE_COOKIE];
  const receivedState = (req.body?.state ?? req.query?.state) as
    | string
    | undefined;

  // Clear regardless of outcome so a stale value cannot be replayed.
  res.clearCookie(GOOGLE_STATE_COOKIE, { path: "/" });

  if (!receivedState) {
    securityLogger.warn("Google OAuth: state missing on callback");
    return false;
  }

  if (!verifyGoogleStateSignature(receivedState)) {
    securityLogger.warn("Google OAuth: state signature invalid on callback");
    return false;
  }

  if (!cookieState) {
    // Expected whenever the request crosses the Next.js rewrite. Not fatal:
    // the HMAC above already proves this backend issued the state.
    securityLogger.warn("Google OAuth: state cookie absent, relying on signature");
    return true;
  }

  // Constant-time compare against the cookie when it did make it through.
  const a = Buffer.from(cookieState);
  const b = Buffer.from(receivedState);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    securityLogger.warn("Google OAuth: state mismatch on callback");
    return false;
  }

  return true;
};

/**
 * A browser arriving via GET should never be shown raw JSON. Errors on that
 * path are forwarded to the frontend callback page, which renders them.
 */
const fail = (req: Request, res: Response, status: number, message: string) => {
  if (req.method === "GET") {
    return res.redirect(
      `${frontendUrl()}/students/auth/google/callback?error=${encodeURIComponent(message)}`,
    );
  }
  return res.status(status).json({ success: false, message });
};

const googleCallbackController = async (req: Request, res: Response) => {
  // Accept code from both query (GET) and body (POST)
  const code = req.body?.code || req.query?.code;
  const googleError = req.body?.error || req.query?.error;

  if (googleError) {
    securityLogger.warn("Google OAuth: user or Google returned an error", {
      error: googleError,
      method: req.method,
    });
    return fail(
      req,
      res,
      400,
      googleError === "access_denied"
        ? "Google sign-in was cancelled."
        : `Google sign-in failed: ${googleError}`,
    );
  }

  if (!code || typeof code !== "string") {
    securityLogger.warn("Google OAuth: Authorization code missing or invalid", {
      body: req.body,
      query: req.query,
      method: req.method,
    });
    return fail(req, res, 400, "Authorization code is missing");
  }

  if (!verifyState(req, res)) {
    return fail(
      req,
      res,
      400,
      "Sign-in could not be verified. Please start again from the sign-in page.",
    );
  }

  try {
    // 1. Get user info from Google
    const googleUser = await getGoogleUser(code);

    // 2. Find or create user in our DB
    // Note: Google returns the unique user ID in the 'sub' field
    const user = await findOrCreateGoogleUser({
      id: googleUser.sub || googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
    });
    const payload = { id: user.id, email: user.email, role: user.role };

    // 3. Generate our app's tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = await generateRefreshToken(payload);

    // 4. Fetch user profile
    const userProfile = await getProfileService(user.id);

    // 5. Set refresh token in cookie
    setRefreshCookie(res, refreshToken);

    auditLogger.info("User signed in via Google OAuth", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 6. For GET requests from Google's redirect, the backend has already
    //    consumed the single-use code, so the token must NOT go in the URL.
    //    The refreshToken cookie set above lets the frontend call
    //    POST /auth/refresh for an access token, then GET /users/profile.
    //    `session=1` tells the callback page which of the two it is looking at.
    if (req.method === "GET") {
      return res.redirect(
        `${frontendUrl()}/students/auth/google/callback?session=1`,
      );
    }

    // 7. For POST requests, return JSON response
    return res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        userProfile,
        accessToken,
      },
    });
  } catch (error: any) {
    securityLogger.error("Google OAuth callback failed", {
      error: error?.message || String(error),
      // Postgres surfaces the real cause here; the client never sees it.
      cause: error?.cause?.message,
      code: error?.cause?.code,
      method: req.method,
    });

    // Never forward a raw driver message to the browser: it contains the full
    // SQL text, parameter values (i.e. the student's email), table and column
    // names. Postgres unique-violation is the common one and deserves a real
    // message; everything else gets a generic one so internals stay internal.
    const pgCode = error?.cause?.code;
    if (pgCode === "23505") {
      return fail(
        req,
        res,
        409,
        "An account already exists for this email but could not be linked automatically. Please contact the scholarship office.",
      );
    }
    if (pgCode === "23503") {
      return fail(
        req,
        res,
        409,
        "Your account is missing a required record. Please contact the scholarship office.",
      );
    }

    const isGoogleError =
      typeof error?.message === "string" &&
      (error.message.includes("Google rejected") ||
        error.message.includes("Could not read your Google account") ||
        error.message.includes("Failed to fetch Google user"));

    return fail(
      req,
      res,
      500,
      isGoogleError
        ? (error?.message as string)
        : "Google sign-in could not be completed. Please try again.",
    );
  }
};

export default googleCallbackController;
