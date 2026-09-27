import { db } from "@db";
import { users } from "@db/schema/user";
import { admins } from "@db/schema/admin";
import { committees } from "@db/schema/committee";
import { inviteUsers } from "@db/schema/invite-user";
import { loginAttempts } from "@db/schema/login-attempts";
import { userTokens } from "@db/schema/user-token";
import { passwordResets } from "@db/schema/password-reset";
import { eq } from "drizzle-orm";

export async function deleteUserCascade(userId: string, txOrDb: any = db) {
  await txOrDb.delete(loginAttempts).where(eq(loginAttempts.userId, userId));
  await txOrDb.delete(userTokens).where(eq(userTokens.userId, userId));
  await txOrDb.delete(passwordResets).where(eq(passwordResets.userId, userId));
  await txOrDb.delete(admins).where(eq(admins.userId, userId));
  await txOrDb.delete(committees).where(eq(committees.userId, userId));
  await txOrDb.delete(inviteUsers).where(eq(inviteUsers.invitedBy, userId));
  return await txOrDb.delete(users).where(eq(users.id, userId)).returning({
    id: users.id,
    email: users.email,
    role: users.role,
    phoneNumber: users.phoneNumber,
    isActive: users.isActive,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  });
}
