import { db } from "@db";
import { users } from "@db/schema/user";
import { eq, and, gte, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@utils/generate-token";
import getProfileService from "@services/user/get-profile.service";
import { auditLogger, securityLogger, userLogger } from "@utils/logger";
import { loginAttempts } from "@db/schema/login-attempts";

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MINUTES = 15;

export default async (inputEmail: string, password: string, ip: string) => {
  const email = inputEmail.trim().toLowerCase();
  //  Log login attempt (not log password)
  securityLogger.info({
    event: "LOGIN_ATTEMPT",
    email,
    ip,
  });

  const now = new Date();
  const blockCheckTime = new Date(
    now.getTime() - BLOCK_DURATION_MINUTES * 60 * 1000,
  );

  const recentAttempts = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.ip, ip),
        gte(loginAttempts.attemptedAt, blockCheckTime),
        eq(loginAttempts.success, false),
      ),
    )
    .orderBy(desc(loginAttempts.attemptedAt));

  const failedCount = recentAttempts.length;
  if (failedCount >= MAX_ATTEMPTS) {
    const oldestFailedAttempt = recentAttempts[recentAttempts.length - 1];
    const blockUntil = new Date(
      oldestFailedAttempt.attemptedAt.getTime() +
        BLOCK_DURATION_MINUTES * 60 * 1000,
    );

    if (now < blockUntil) {
      securityLogger.warn({
        event: "LOGIN_BLOCKED",
        ip,
        remainingTime: Math.ceil(
          (blockUntil.getTime() - now.getTime()) / 60000,
        ),
      });

      return {
        success: false,
        msg: `Account temporarily locked. Try again in ${Math.ceil(
          (blockUntil.getTime() - now.getTime()) / 60000,
        )} minutes.`,
      };
    }
  }
  // Fetch user by email & active status
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      password: users.password,
    })
    .from(users)
    .where(and(eq(users.email, email), eq(users.isActive, true)))
    .limit(1);
  // User not found or inactive
  if (!user || !user.password) {
    securityLogger.warn({
      event: "LOGIN_FAILED_USER_NOT_FOUND",
      ip,
    });
    await db
      .insert(loginAttempts)
      .values({ ip: ip, email: email, attemptedAt: now, success: false });
    return { success: false, msg: "Invalid email or password" };
  }
  // Validate password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    securityLogger.warn({
      event: "LOGIN_FAILED_INVALID_PASSWORD",
      userId: user.id,
      ip,
    });
    await db
      .insert(loginAttempts)
      .values({
        ip: ip,
        email: email,
        userId: user.id,
        attemptedAt: now,
        success: false,
      });

    return { success: false, msg: "Invalid email or password" };
  }

  // Login successful
  await db.insert(loginAttempts).values({
    ip,
    email,
    userId: user.id,
    attemptedAt: now,
    success: true,
  });
  const payload = { id: user.id, email: user.email, role: user.role };

  // Update last login timestamp
  await db
    .update(users)
    .set({ lastLogin: new Date() })
    .where(eq(users.id, user.id));

  // Generate tokens
  const accessToken = generateAccessToken(payload);

  const refreshToken = await generateRefreshToken(payload);

  // Fetch user profile
  const userProfile = await getProfileService(payload.id);

  // Audit log for successful login
  auditLogger.info({
    event: "LOGIN_SUCCESS",
    userId: user.id,
    role: user.role,
  });

  // Optional operational log
  userLogger.info("User logged in", { userId: user.id, email: user.email });

  return {
    success: true,
    userProfile,
    accessToken,
    refreshToken,
  };
};
