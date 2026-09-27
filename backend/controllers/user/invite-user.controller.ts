import { inviteUserSchema } from "@validation/user/auth.schema";
import inviteUserService from "@services/user/invite-user.service";
import { Request, Response } from "express";
import { userLogger, auditLogger } from "@utils/logger";

export default async (req: Request, res: Response) => {
  try {
    const invitedBy = String(req.user?.id);
    const validatedData = inviteUserSchema.parse(req.body);

    const result = await inviteUserService(
      validatedData.role,
      validatedData.name,
      validatedData.email,
      invitedBy
    );

    if (!result?.success) {
      return res.status(400).json({
        success: false,
        message: result?.msg || "Invite failed",
      });
    }
    const logData = {
      action: "invite_user",
      invitedUser: {
        email: validatedData.email,
        role: validatedData.role,
        name: validatedData.name,
      },
      invitedBy,
      result: result?.success ? "success" : "failed",
      timestamp: new Date().toISOString(),
    };

    userLogger.info(logData);
    auditLogger.info(logData);
    if (!result?.success) {
      return res.status(400).json({
        success: false,
        message: result?.msg || "Invite failed",
      });
    }
    res.status(200).json({
      success: true,
      message: result.msg,
      data: result.data,
    });
  } catch (error) {
    // optional: log validation or unexpected errors
    userLogger.error({
      action: "invite_user_error",
      error,
      performedBy: req.user,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};
