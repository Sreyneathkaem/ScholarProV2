import createEmailTemplateController from "./create-email-template.controller";
import listEmailTemplateNameController from "./list-email-template-name.controller";
import previewEmailTemplateController from "./preview-email-template.controller";
import deleteEmailTemplateController from "./delete-email-template.controller";
import updateEmailTemplateController from "./update-email-template.controller";
import bulkSendEmailController from "./bulk-send-email.controller";
import listRecipentController from "./list-recipent.controller";
import getEmailJobController from "./get-email-job.controller";
import streamEmailJobEventsController from "./stream-email-job-events.controller";
import sendTestEmailController from "./send-test-email.controller";

export const emailController = {
  createEmailTemplateController,
  listEmailTemplateNameController,
  previewEmailTemplateController,
  deleteEmailTemplateController,
  updateEmailTemplateController,
  bulkSendEmailController,
  listRecipentController,
  getEmailJobController,
  streamEmailJobEventsController,
  sendTestEmailController,
};
