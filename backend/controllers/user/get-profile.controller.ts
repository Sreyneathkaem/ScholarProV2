import { Request, Response } from "express";
import { db } from "@db";
import { users } from "@db/schema/user";
import { admins } from "@db/schema/admin";
import { committees } from "@db/schema/committee";
import { eq } from "drizzle-orm";

export default async (req: Request, res: Response) => {
  try {
    const baseUrl = process.env.BASE_URL;
    const userId = String(req.user?.id);
    if (!userId || typeof userId !== "string") {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID not found or invalid",
      });
    }

    // Get user info
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        profileUrl: users.profileUrl,
        phoneNumber: users.phoneNumber
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
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
    }
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name,
        email: user.email,
        role: user.role,
        profileUrl: user.profileUrl ? `${baseUrl}${user.profileUrl}` : null,
        phoneNumber: user.phoneNumber
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
