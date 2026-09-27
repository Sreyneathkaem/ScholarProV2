import { db } from "@db";
import { inviteUsers } from "@db/schema/invite-user";
import { and, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";
import bcrypt from "bcryptjs";
import { users } from "@db/schema/user";
import { userLogger, auditLogger } from "@utils/logger";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import sesClient from "@utils/ses-client";
import { deleteUserCascade } from "./delete-user-cascade.util";

export default async (
  role: "admin" | "committee",
  name: string,
  email: string,
  invitedBy: string,
) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const existUser = await db
      .select({ id: users.id, email: users.email, isActive: users.isActive })
      .from(users)
      .where(and(eq(users.email, normalizedEmail)));

    if (existUser.length > 0) {
      if (existUser[0].isActive) {
        const logData = {
          action: "invite_user_failed",
          reason: "user_already_exists",
          invitedUser: { name, email: normalizedEmail, role },
          invitedBy,
          timestamp: new Date().toISOString(),
        };
        userLogger.warn(logData);
        auditLogger.warn(logData);

        return {
          success: false,
          msg: "User already exists in the system",
        };
      } else {
        // User is inactive (was soft deleted). Clean up previous record completely so new invite can proceed
        await deleteUserCascade(existUser[0].id);
      }
    }

    // Clean up any stale invite for this email
    await db.delete(inviteUsers).where(eq(inviteUsers.email, normalizedEmail));

    // -------------------------
    // 2️⃣ Create invite record
    // -------------------------
    const token = uuidv7().toString();
    const tokenHash = await bcrypt.hash(token, 10);

    const record = await db
      .insert(inviteUsers)
      .values({
        role,
        name,
        email: normalizedEmail,
        invitedBy,
        token: tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    if (!record || record.length === 0) {
      const logData = {
        action: "invite_user_failed",
        reason: "invite_record_creation_failed",
        invitedUser: { name, email: normalizedEmail, role },
        invitedBy,
        timestamp: new Date().toISOString(),
      };
      userLogger.error(logData);
      auditLogger.error(logData);

      return {
        success: false,
        msg: "Failed to create invite record",
      };
    }

    // -------------------------
    // 3️⃣ Send email
    // -------------------------
    const registerBaseUrl = process.env.PUBLIC_REGISTER_URL || "http://localhost:3001/committee-login";
    const inviteLink = `${registerBaseUrl}?id=${record[0].id}&token=${token}`;

    const formattedExpiry = record[0].expiresAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: #1e3a8a; padding: 28px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px; }
    .content { padding: 32px 28px; color: #334155; line-height: 1.6; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    .button-container { text-align: center; margin: 28px 0; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 15px; }
    .expiry { font-size: 13px; color: #64748b; margin-top: 20px; text-align: center; }
    .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; }
    .link-alt { word-break: break-all; font-size: 12px; color: #64748b; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ScholarPro Invitation</h1>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      <p>You have been invited to join the <strong>ScholarPro</strong> system as a <strong>${role}</strong>.</p>
      <p>Click the button below to complete your account registration and set your password:</p>
      <div class="button-container">
        <a href="${inviteLink}" class="button" target="_blank">Accept Invitation & Register</a>
      </div>
      <p class="expiry">This invitation link will expire on <strong>${formattedExpiry}</strong>.</p>
      <p class="link-alt">If the button above does not work, copy and paste this link into your browser:<br/><a href="${inviteLink}">${inviteLink}</a></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ScholarPro. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

    const textContent = [
      `Hello ${name},`,
      "",
      `You have been invited to join ScholarPro as a ${role}.`,
      `Use this link to complete your registration: ${inviteLink}`,
      "",
      `This invitation expires on ${formattedExpiry}.`,
    ].join("\n");

    let emailSend;
    try {
      emailSend = await sesClient.send(
        new SendEmailCommand({
          FromEmailAddress: process.env.AWS_SES_FROM_EMAIL,
          Destination: { ToAddresses: [normalizedEmail] },
          Content: {
            Simple: {
              Subject: {
                Data: "ScholarPro Account Invitation",
                Charset: "UTF-8",
              },
              Body: {
                Html: {
                  Data: htmlContent,
                  Charset: "UTF-8",
                },
                Text: {
                  Data: textContent,
                  Charset: "UTF-8",
                },
              },
            },
          },
        }),
      );
    } catch (mailError: any) {
      userLogger.error({
        action: "invite_user_email_error",
        error: mailError.message,
        invitedUser: { name, email: normalizedEmail, role },
        invitedBy,
      });

      return {
        success: false,
        msg: `Failed to deliver email: ${mailError.message || "Email service error"}`,
      };
    }

    if (!emailSend?.MessageId) {
      const logData = {
        action: "invite_user_failed",
        reason: "email_send_failed",
        invitedUser: { name, email: normalizedEmail, role },
        invitedBy,
        timestamp: new Date().toISOString(),
      };
      userLogger.error(logData);
      auditLogger.error(logData);

      return {
        success: false,
        msg: "Failed to send the invitation email. Please check the email address or try again.",
      };
    }

    // -------------------------
    // 4️⃣ Log success
    // -------------------------
    const logData = {
      action: "invite_user_success",
      invitedUser: { name, email: normalizedEmail, role },
      invitedBy,
      emailMessageId: emailSend.MessageId,
      timestamp: new Date().toISOString(),
    };
    userLogger.info(logData);
    auditLogger.info(logData);

    return {
      success: true,
      msg: "Invitation email sent successfully",
      data: emailSend,
    };
  } catch (error: any) {
    const logData = {
      action: "invite_user_error",
      invitedUser: { name, email: email.trim().toLowerCase(), role },
      invitedBy,
      error,
      timestamp: new Date().toISOString(),
    };
    userLogger.error(logData);
    auditLogger.error(logData);

    return {
      success: false,
      msg: error?.message || "Failed to invite user",
    };
  }
};
