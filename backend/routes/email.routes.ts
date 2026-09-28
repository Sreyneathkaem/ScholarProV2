import express from "express";
import { emailController } from "@controllers/email";
const router = express.Router();
import { authenticateUser } from "@middleware/authenticate-user";
import { authorizeRole } from "@middleware/authorize-role";
import { asyncHandler } from "@middleware/async-handler";

// More specific routes first so they are not matched by /:name
router.get(
  "/jobs/:jobId/events",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.streamEmailJobEventsController)
);
router.get(
  "/jobs/:jobId",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.getEmailJobController)
);

// name here is the template name
router.get(
  "/template-name",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.listEmailTemplateNameController)
);

router.get(
  "/recipient",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.listRecipentController)
);

// Sends one real email straight through SES and returns the verdict, bypassing
// the email_sents queue. Registered before /:name so it can never be captured
// as a template name.
router.post(
  "/test-send",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.sendTestEmailController)
);

router.post(
  "/",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.createEmailTemplateController)
);

router.delete(
  "/:name",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.deleteEmailTemplateController)
);

router.get(
  "/:name",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.previewEmailTemplateController)
);

router.put(
  "/:name",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.updateEmailTemplateController)
);

router.post(
  "/bulk-send/:name",
  authenticateUser,
  authorizeRole("admin"),
  asyncHandler(emailController.bulkSendEmailController)
);
export default router;
