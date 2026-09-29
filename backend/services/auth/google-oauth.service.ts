import { db } from "@db";
import { users } from "@db/schema/user";
import { students } from "@db/schema/student";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { ForbiddenError } from "@utils/errors";
import { securityLogger, auditLogger } from "@utils/logger";
import { ensureStudentApplication } from "@services/application/ensure-student-application.service";

/**
 * Read at call time rather than at module load.
 *
 * dotenv populates process.env from `index.ts` *after* this module is imported,
 * so caching these in module scope reads them as `undefined` whenever load
 * order ever changes. Reading lazily also means a restart is not needed after
 * the credentials are first added to .env.
 */
const googleConfig = () => ({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

/** Names of the env vars still missing, for an actionable error message. */
export const getMissingGoogleConfig = (): string[] => {
    const { clientId, clientSecret, redirectUri } = googleConfig();
    const missing: string[] = [];
    if (!clientId) missing.push("GOOGLE_CLIENT_ID");
    if (!clientSecret) missing.push("GOOGLE_CLIENT_SECRET");
    if (!redirectUri) missing.push("GOOGLE_REDIRECT_URI");
    return missing;
};

export const isGoogleOAuthConfigured = () =>
    getMissingGoogleConfig().length === 0;

/** Throws if unconfigured; otherwise returns the config with `string` types. */
const assertGoogleConfigured = () => {
    const missing = getMissingGoogleConfig();
    if (missing.length > 0) {
        throw new Error(
            `Google sign-in is not configured. Missing environment variable(s): ${missing.join(", ")}. ` +
                `Add them to backend/.env and restart the backend.`,
        );
    }

    const { clientId, clientSecret, redirectUri } = googleConfig();
    // Safe: missing.length === 0 means all three are truthy.
    return {
        clientId: clientId as string,
        clientSecret: clientSecret as string,
        redirectUri: redirectUri as string,
    };
};

/**
 * Signs the CSRF `state` so the callback can authenticate it without a cookie.
 *
 * Why this exists: the state cookie is minted by the backend on localhost:3000
 * but the callback returns to the frontend on localhost:3001 through a Next.js
 * rewrite. That rewrite does not reliably forward the cookie back upstream, so
 * the CSRF check compared `hasCookie: false` against `hasParam: true` and
 * rejected every legitimate sign-in. Signing the value removes the cookie from
 * the security decision entirely — see verifyGoogleStateSignature.
 */
const stateSigningKey = (): string => {
  // Reuse the RSA private key as an HMAC key rather than adding a new required
  // env var: it is already guaranteed present (generate-token.ts throws without
  // it), already untracked in git, and stable across restarts.
  const keyPath = process.env.JWT_PRIVATE_KEY_PATH;
  if (!keyPath) {
    throw new Error("JWT_PRIVATE_KEY_PATH environment variable is not set");
  }
  const resolved = path.resolve(process.cwd(), keyPath);
  return fs.readFileSync(resolved, "utf8");
};

/** Returns `<randomHex>.<hmacHex>` — opaque to the browser, verifiable later. */
export const createGoogleState = (): string => {
  const nonce = crypto.randomBytes(24).toString("hex");
  const sig = crypto
    .createHmac("sha256", stateSigningKey())
    .update(nonce)
    .digest("hex");
  return `${nonce}.${sig}`;
};

/**
 * True when `state` carries a valid HMAC signature, i.e. this backend issued it.
 *
 * This is what makes the cookie-free flow safe. An attacker cannot mint a state
 * for their own Google `code` without the signing key, so a forged callback
 * fails here before the code is ever exchanged.
 */
export const verifyGoogleStateSignature = (state?: string): boolean => {
  if (!state || typeof state !== "string") return false;
  const dot = state.indexOf(".");
  if (dot < 1) return false;

  const nonce = state.slice(0, dot);
  const receivedSig = state.slice(dot + 1);
  if (!nonce || !receivedSig) return false;

  const expectedSig = crypto
    .createHmac("sha256", stateSigningKey())
    .update(nonce)
    .digest("hex");

  const a = Buffer.from(expectedSig);
  const b = Buffer.from(receivedSig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const generateGoogleAuthUrl = (state?: string) => {
    const { clientId, redirectUri } = assertGoogleConfigured();

    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options: Record<string, string> = {
        redirect_uri: redirectUri,
        client_id: clientId,
        access_type: "offline",
        response_type: "code",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    // `state` is echoed back by Google on the callback and is what ties the
    // callback to the browser that started the flow (CSRF / login-fixation).
    // `prompt=consent` was deliberately dropped: it forced a consent screen on
    // every sign-in even when the user had already granted the scopes.
    if (state) options.state = state;

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
};

export const getGoogleUser = async (code: string) => {
    const { clientId, clientSecret, redirectUri } = assertGoogleConfigured();

    const url = "https://oauth2.googleapis.com/token";
    const values = {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
    };

    try {
        const res = await fetch(url, {
            method: "POST",
            body: new URLSearchParams(values as any),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const tokenJson: any = await res.json();

        if (!res.ok || !tokenJson.access_token) {
            securityLogger.error("Google token exchange rejected", {
                status: res.status,
                error: tokenJson.error,
                error_description: tokenJson.error_description,
            });
            throw new Error(
                tokenJson.error_description ||
                    tokenJson.error ||
                    "Google rejected the sign-in request",
            );
        }

        const { access_token } = tokenJson;

        const googleUserRes = await fetch(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const googleUser: any = await googleUserRes.json();

        if (!googleUserRes.ok || !googleUser.email) {
            securityLogger.error("Google userinfo request failed", {
                status: googleUserRes.status,
            });
            throw new Error("Could not read your Google account details");
        }

        return googleUser;
    } catch (error: any) {
        securityLogger.error("Failed to fetch Google user", {
            error: error?.message || error,
        });
        throw new Error(error?.message || "Failed to fetch Google user");
    }
};

export const findOrCreateGoogleUser = async (googleUser: {
    id: string;
    email: string;
    name: string;
    picture?: string;
}) => {
    //Try to find user by providerId (google id)
    const [userByProvider] = await db
        .select()
        .from(users)
        .where(eq(users.providerId, googleUser.id))
        .limit(1);

    if (userByProvider) {
        const [existingStudent] = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.userId, userByProvider.id))
            .limit(1);
        if (existingStudent) {
            await ensureStudentApplication(existingStudent.id, db);
        }
        return userByProvider;
    }

    //Try to find user by email
    const [userByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, googleUser.email.toLowerCase()))
        .limit(1);

    if (userByEmail) {
        //If account exists but is not a student, block social login
        if (userByEmail.role !== "student") {
            securityLogger.warn("Social login blocked: Non-student role attempt", {
                email: googleUser.email,
                role: userByEmail.role,
                provider: "google"
            });
            throw new ForbiddenError(
                "Social login is only supported for student accounts. Admin and Committee accounts must use email and password."
            );
        }

        // Link the provider info to existing student email user
        const [updatedUser] = await db
            .update(users)
            .set({
                provider: "google",
                providerId: googleUser.id,
                profileUrl: googleUser.picture || users.profileUrl,
            })
            .where(eq(users.id, userByEmail.id))
            .returning();

        const [existingStudent] = await db
            .select({ id: students.id })
            .from(students)
            .where(eq(students.userId, updatedUser.id))
            .limit(1);
        if (existingStudent) {
            await ensureStudentApplication(existingStudent.id, db);
        }

        return updatedUser;
    }

    // 3. Create new user (always as student)
    //
    // A `students` row may already exist for this email with `user_id` NULL —
    // an orphan from a form registration whose `users` row is missing. Looking
    // up only `users` above cannot see those, so the insert below used to die
    // on `students_email_unique` and block a legitimate sign-in indefinitely.
    // Adopt the orphan instead of colliding with it.
    const email = googleUser.email.toLowerCase();
    const [orphanStudent] = await db
        .select({ id: students.id, nameEn: students.nameEn, nameKh: students.nameKh })
        .from(students)
        .where(eq(students.email, email))
        .limit(1);

    return await db.transaction(async (tx) => {
        const [newUser] = await tx
            .insert(users)
            .values({
                email,
                provider: "google",
                providerId: googleUser.id,
                role: "student",
                profileUrl: googleUser.picture,
                isActive: true,
                lastLogin: new Date(),
            })
            .returning();

        let studentId: number;

        if (orphanStudent) {
            // Claim the existing student record rather than creating a duplicate.
            await tx
                .update(students)
                .set({ userId: newUser.id })
                .where(eq(students.id, orphanStudent.id));

            // The form-supplied name wins when present; it is what the student
            // typed on their application.
            await tx
                .update(students)
                .set({
                    nameEn: googleUser.name || orphanStudent.nameEn,
                    nameKh: orphanStudent.nameKh,
                })
                .where(eq(students.id, orphanStudent.id));

            studentId = orphanStudent.id;
            auditLogger.info("Adopted orphaned student row on Google OAuth", {
                userId: newUser.id,
                studentId,
                email,
            });
        } else {
            // Create entry in students table
            const [createdStudent] = await tx
                .insert(students)
                .values({
                    userId: newUser.id,
                    nameEn: googleUser.name,
                    email,
                })
                .returning();
            studentId = createdStudent.id;
        }

        // Save record in applicant (applications) as well
        await ensureStudentApplication(studentId, tx);

        auditLogger.info("New student created via Google OAuth", {
            userId: newUser.id,
            email
        });

        return newUser;
    });
};

