import { db } from "@db";
import { users } from "@db/schema/user";
import { admins } from "@db/schema/admin";
import { committees } from "@db/schema/committee";
import { students } from "@db/schema/student";
import { eq } from "drizzle-orm";
import { NotFoundError } from "@utils/errors";
import { userLogger, auditLogger } from "@utils/logger";

export default async (userId: string, performedBy?: { id: string; role: string }) => {
  const baseUrl = process.env.BASE_URL;

  if (!userId || typeof userId !== "string") {
    const logData = {
      action: "get_current_user_failed",
      reason: "invalid_user_id",
      userId,
      performedBy,
      timestamp: new Date().toISOString(),
    };
    userLogger.warn(logData);
    auditLogger.warn(logData);

    return {
      success: false,
      message: "Unauthorized - User ID not found or invalid",
    };
  }

  // Get user info
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      profileUrl: users.profileUrl,
      phoneNumber: users.phoneNumber,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    const logData = {
      action: "get_current_user_failed",
      reason: "user_not_found",
      userId,
      performedBy,
      timestamp: new Date().toISOString(),
    };
    userLogger.warn(logData);
    auditLogger.warn(logData);

    throw new NotFoundError("User not found");
  }

  // Get name based on role
  let name = "N/A";

  if (user.role === "admin") {
    const [admin] = await db
      .select({ name: admins.name })
      .from(admins)
      .where(eq(admins.userId, userId))
      .limit(1);
    name = admin?.name || "N/A";
  } else if (user.role === "committee") {
    const [committee] = await db
      .select({ name: committees.name })
      .from(committees)
      .where(eq(committees.userId, userId))
      .limit(1);
    name = committee?.name || "N/A";
  } else if (user.role === "student") {
    const [student] = await db
      .select({ name: students.nameEn })
      .from(students)
      .where(eq(students.userId, userId))
      .limit(1);
    name = student?.name || "N/A";
  }

  const userData = {
    id: user.id,
    name,
    email: user.email,
    profileUrl: user.profileUrl ? `${baseUrl}${user.profileUrl}` : null,
    phoneNumber: user.phoneNumber,
    role: user.role,
  };

  // Logging success
  const logData = {
    action: "get_current_user",
    user: { id: user.id, email: user.email, role: user.role },
    performedBy,
    timestamp: new Date().toISOString(),
  };
  userLogger.info(logData);
  auditLogger.info(logData);

  return userData;
};
