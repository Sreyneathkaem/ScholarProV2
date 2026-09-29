import { Request, Response } from "express";
import {
  generateGoogleAuthUrl,
  getMissingGoogleConfig,
  createGoogleState,
} from "@services/auth/google-oauth.service";
import { securityLogger } from "@utils/logger";

/** Must match the name used by google-callback.controller when verifying. */
export const GOOGLE_STATE_COOKIE = "googleOauthState";
const STATE_TTL_MS = 10 * 60 * 1000;

const setStateCookie = (res: Response, state: string) =>
  res.cookie(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" so the cookie survives the top-level redirect back from Google.
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_MS,
  });

/**
 * GET /auth/google
 *
 * Starts the flow by redirecting the browser straight to Google. This is the
 * "navigate to the backend" entry point.
 */
const googleLoginController = async (req: Request, res: Response) => {
  const missing = getMissingGoogleConfig();
  if (missing.length > 0) {
    securityLogger.error("Google OAuth requested but not configured", { missing });
    return res.status(503).json({
      success: false,
      message: `Google sign-in is not configured. Missing: ${missing.join(", ")}.`,
    });
  }

  // Signed so the callback can verify it without a cookie round-trip — see
  // verifyGoogleStateSignature. The cookie is still set: harmless, and it keeps
  // the browser-session binding for proxies that do forward it.
  const state = createGoogleState();
  setStateCookie(res, state);
  return res.redirect(generateGoogleAuthUrl(state));
};

/**
 * GET /auth/google/url
 *
 * Returns the authorisation URL as JSON instead of redirecting.
 *
 * The frontend calls this over XHR and then assigns the URL to
 * `window.location.href`. Going through JSON rather than a 302 matters here:
 * the frontend reaches the backend through a Next.js rewrite proxy, and a
 * proxied 302 is not something the browser should be asked to rely on. A JSON
 * body also lets the unconfigured case surface a real message in the UI instead
 * of dumping the user on a Google error page.
 */
const googleAuthUrlController = async (req: Request, res: Response) => {
  const missing = getMissingGoogleConfig();
  if (missing.length > 0) {
    securityLogger.error("Google OAuth URL requested but not configured", {
      missing,
    });
    return res.status(503).json({
      success: false,
      message: `Google sign-in is not configured. Missing: ${missing.join(", ")}. Add these to backend/.env and restart the backend.`,
    });
  }

  const state = createGoogleState();
  setStateCookie(res, state);

  // `state` is returned alongside the URL so the frontend can stash it in
  // sessionStorage and hand it back on the callback. Without that the CSRF
  // check has nothing to compare against, because the cookie minted above is
  // set by :3000 while the callback arrives at :3001 through a rewrite that
  // does not forward it. See verifyGoogleStateSignature.
  return res.status(200).json({
    success: true,
    url: generateGoogleAuthUrl(state),
    state,
  });
};

export { googleLoginController, googleAuthUrlController };
export default googleLoginController;
