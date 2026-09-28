import { Request, Response } from "express";
import sendTestEmailService from "@services/email/send-test-email.service";

/**
 * POST /api/v1/email/test-send
 *
 * Sends a single real email through SES and returns the verdict. Always 200 on
 * a well-formed request - a 200 with `success: false` is what carries the SES
 * rejection reason, which is the whole point of the endpoint.
 */
export default async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const to = body.to ?? body.email;
  const templateName = body.templateName ? String(body.templateName) : undefined;

  if (typeof to !== "string" || !to.trim()) {
    return res.status(400).json({
      success: false,
      message: "A recipient email address is required.",
    });
  }

  const result = await sendTestEmailService(to, templateName);

  return res.status(200).json(result);
};
