import loginService from "@services/auth/login.service";
import { loginSchema } from "@validation/user/auth.schema";
import { Request, Response } from "express";

const loginController = async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);
  const ipRaw = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ip =
    typeof ipRaw === "string"
      ? ipRaw
      : Array.isArray(ipRaw)
        ? ipRaw[0]
        : (ipRaw ?? "");
  const result = await loginService(
    validatedData.email,
    validatedData.password,
    ip,
  );

  if (!result?.success || !result) {
    return res.status(401).json({
      success: false,
      message: result.msg,
    });
  }

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Login successfully",
    userProfile: result.userProfile,
    token: result.accessToken,
  });
};

export default loginController;
