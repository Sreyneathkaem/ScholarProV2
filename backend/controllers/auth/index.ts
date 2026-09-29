import loginController from "@controllers/auth/login.controller";
import registerController from "@controllers/auth/register.controller";
import refreshTokenController from "@controllers/auth/refresh-token.controller";
import logoutController from "@controllers/auth/logout.controller";
import validateUrlTokenController from "@controllers/auth/validate-url-token.controller";
import resetPasswordController from "@controllers/auth/reset-password.controller";
import sendForgotPasswordLinkController from "@controllers/auth/send-forgot-password-link.controller";
import forgotPasswordController from "@controllers/auth/forgot-password.controller";
import validateForgetPasswordLinkController from "@controllers/auth/validate-forget-password-link.controller";
import googleLoginController, {
  googleAuthUrlController,
} from "@controllers/auth/google-login.controller";
import googleCallbackController from "@controllers/auth/google-callback.controller";
import telegramCallbackController from "@controllers/auth/telegram-callback.controller";

export const authController = {
  loginController,
  registerController,
  refreshTokenController,
  logoutController,
  validateUrlTokenController,
  resetPasswordController,
  sendForgotPasswordLinkController,
  forgotPasswordController,
  validateForgetPasswordLinkController,
  googleLoginController,
  googleAuthUrlController,
  googleCallbackController,
  telegramCallbackController,
};

