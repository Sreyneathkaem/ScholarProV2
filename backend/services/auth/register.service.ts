import { db } from "@db";
import { inviteUsers } from "@db/schema/invite-user";
import { users } from "@db/schema/user";
import { admins } from "@db/schema/admin";
import { committees } from "@db/schema/committee";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auditLogger, securityLogger, userLogger } from "@utils/logger";
import { deleteUserCascade } from "@services/user/delete-user-cascade.util";

export default async (
  id: string,
  token: string,
  email: string,
  password: string,
) => {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    return await db.transaction(async (tx) => {
      // Registration attempt log
      securityLogger.info({
        event: "REGISTRATION_ATTEMPT",
        inviteId: id,
        email: normalizedEmail,
      });

      // Fetch invitation record
      const [inviteUser] = await tx
        .select({
          role: inviteUsers.role,
          name: inviteUsers.name,
          token: inviteUsers.token,
        })
        .from(inviteUsers)
        .where(
          and(
            eq(inviteUsers.id, id),
            eq(inviteUsers.email, normalizedEmail),
            eq(inviteUsers.status, "pending"),
            gt(inviteUsers.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!inviteUser || !inviteUser.token) {
        securityLogger.warn({
          event: "REGISTRATION_FAILED_INVALID_INVITE",
          inviteId: id,
          email: normalizedEmail,
        });
        return {
          success: false,
          msg: "The invitation link is invalid or expired.",
        };
      }

      // Validate invitation token
      const isTokenValid = await bcrypt.compare(token, inviteUser.token);
      if (!isTokenValid) {
        securityLogger.warn({
          event: "REGISTRATION_FAILED_INVALID_TOKEN",
          inviteId: id,
          email: normalizedEmail,
        });
        return { success: false, msg: "Invalid invitation link" };
      }

      // Check if active user already exists
      const [existingUser] = await tx
        .select({ id: users.id, isActive: users.isActive })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser) {
        if (existingUser.isActive) {
          securityLogger.warn({
            event: "REGISTRATION_FAILED_EMAIL_EXISTS",
            email: normalizedEmail,
          });
          return { success: false, msg: "Email already registered" };
        } else {
          // Clean up stale inactive records
          await deleteUserCascade(existingUser.id, tx);
        }
      }

      // Hash password & create new user
      const hashedPassword = await bcrypt.hash(password, 10);
      const [newUser] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          password: hashedPassword,
          role: inviteUser.role,
          lastLogin: new Date(),
        })
        .returning();

      auditLogger.info({
        event: "REGISTRATION_SUCCESS",
        userId: newUser.id,
        email: normalizedEmail,
        role: inviteUser.role,
      });

      userLogger.info(`User created: ${newUser.id}, Email: ${normalizedEmail}`);

      // Create role-specific entry
      if (inviteUser.role === "admin") {
        await tx
          .insert(admins)
          .values({ userId: newUser.id, name: inviteUser.name || "" });
      } else if (inviteUser.role === "committee") {
        await tx
          .insert(committees)
          .values({ userId: newUser.id, name: inviteUser.name || "" });
      } else {
        securityLogger.error({
          event: "REGISTRATION_FAILED_INVALID_ROLE",
          userId: newUser.id,
          role: inviteUser.role,
        });
        return { success: false, msg: "Invalid role or missing logic" };
      }

      // Delete invitation after successful registration
      await tx.delete(inviteUsers).where(eq(inviteUsers.id, id));
      auditLogger.info({
        event: "INVITE_CONSUMED",
        inviteId: id,
        userId: newUser.id,
      });

      return { success: true, msg: "Register successfully" };
    });
  } catch (error) {
    securityLogger.error({
      event: "REGISTRATION_FAILED_SERVER_ERROR",
      inviteId: id,
      email: normalizedEmail,
      error,
    });
    return { success: false, msg: "Registration failed due to server error" };
  }
};
