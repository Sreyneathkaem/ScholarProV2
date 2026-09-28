import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import sesClient from "@utils/ses-client";
import { systemLogger } from "@utils/logger";

export interface TestSendResult {
  success: boolean;
  message: string;
  messageId?: string;
  /** SES error code, e.g. "MessageRejected" / "ValidationException". */
  errorName?: string;
  /** Raw SES message, e.g. "Email address is not verified...". */
  errorDetail?: string;
  config: {
    region: string | undefined;
    fromEmail: string | undefined;
    hasStaticCredentials: boolean;
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reports what the SES client is actually configured with, so an operator can
 * tell "wrong from-address" / "no credentials" apart from "recipient not
 * verified" without reading the source. Mirrors the construction in
 * utils/ses-client.ts.
 */
function describeConfig() {
  return {
    region: process.env.AWS_REGION || "ap-southeast-2 (default)",
    fromEmail: process.env.AWS_SES_FROM_EMAIL,
    hasStaticCredentials: Boolean(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
    ),
  };
}

/**
 * Sends exactly one email straight through SES, bypassing the
 * `email_sents` queue and the 1-minute cron.
 *
 * This exists because the queued path cannot answer "is the sending service
 * working?": the worker only runs once a minute, marks a row `failed` without
 * persisting the reason, and the UI can then only report a count. A direct send
 * returns the real SES verdict (and reason) in about a second.
 *
 * Never throws - failures are returned so the controller can surface the actual
 * SES reason instead of a generic 500.
 */
export default async function sendTestEmailService(
  to: string,
  templateName?: string,
): Promise<TestSendResult> {
  const config = describeConfig();
  const recipient = String(to ?? "").trim().toLowerCase();

  if (!EMAIL_PATTERN.test(recipient)) {
    return {
      success: false,
      message: `"${to}" is not a valid email address.`,
      config,
    };
  }

  if (!config.fromEmail) {
    return {
      success: false,
      message:
        "AWS_SES_FROM_EMAIL is not set, so there is no verified sender to send from.",
      config,
    };
  }

  const content = templateName
    ? {
        Template: {
          TemplateName: templateName,
          TemplateData: JSON.stringify({ name: "ScholarPro Test" }),
        },
      }
    : {
        Simple: {
          Subject: { Data: "ScholarPro - email service test", Charset: "UTF-8" },
          Body: {
            Text: {
              Data:
                "This is a test message from ScholarPro. If you are reading it, the SES sending service is working.",
              Charset: "UTF-8",
            },
          },
        },
      };

  try {
    const result = await sesClient.send(
      new SendEmailCommand({
        FromEmailAddress: config.fromEmail,
        Destination: { ToAddresses: [recipient] },
        Content: content,
      }),
    );

    if (!result?.MessageId) {
      return {
        success: false,
        message:
          "SES accepted the request but returned no MessageId, so delivery cannot be confirmed.",
        errorDetail: JSON.stringify(result),
        config,
      };
    }

    return {
      success: true,
      message: `SES accepted the message for ${recipient}.`,
      messageId: result.MessageId,
      config,
    };
  } catch (error: any) {
    // Most common causes, surfaced verbatim because the SES message is what
    // actually distinguishes them.
    systemLogger.error("[TestEmail] SES send failed", {
      to: recipient,
      errorName: error?.name,
      error: error?.message,
    });

    return {
      success: false,
      message: error?.message || "SES rejected the send with no message.",
      errorName: error?.name,
      errorDetail: error?.message,
      config,
    };
  }
}
