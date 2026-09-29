import express from "express";
import { asyncHandler } from "@middleware/async-handler";
import { authController } from "@controllers/auth";
import { authenticateUser } from "@middleware/authenticate-user";
import { authorizeRole } from "@middleware/authorize-role";

const router = express.Router();

router.post("/login", asyncHandler(authController.loginController));
router.post(
  "/register/:id/:token",
  asyncHandler(authController.registerController),
);
router.post(
  "/forgot-password",
  asyncHandler(authController.sendForgotPasswordLinkController),
);
router.patch(
  "/forgot-password/:id/:token",
  asyncHandler(authController.forgotPasswordController),
);
router.post("/refresh", asyncHandler(authController.refreshTokenController));
router.put("/logout", asyncHandler(authController.logoutController));

// Google OAuth2
router.get("/google", asyncHandler(authController.googleLoginController));
// Must stay above `/:id/:token` below — both paths have two segments, so a
// later registration would shadow this one and read "url" as a token id.
router.get("/google/url", asyncHandler(authController.googleAuthUrlController));
router.get(
  "/google/callback",
  asyncHandler(authController.googleCallbackController),
);
router.post(
  "/google/callback",
  asyncHandler(authController.googleCallbackController),
);
router.get(
  "/telegram/callback",
  asyncHandler(authController.telegramCallbackController),
);
router.post(
  "/telegram/callback",
  asyncHandler(authController.telegramCallbackController),
);

router.get(
  "/:id/:token",
  asyncHandler(authController.validateUrlTokenController),
);
router.get(
  "/forgot-password/:id/:token",
  asyncHandler(authController.validateForgetPasswordLinkController),
);
router.patch(
  "/reset-password",
  authenticateUser,
  authorizeRole("admin", "committee"),
  asyncHandler(authController.resetPasswordController),
);

export default router;
