import { db } from "@db";
import { emailSents } from "@db/schema/email-sent";
import { emailBatchJobs } from "@db/schema/email-batch-jobs";
import { eq, sql, inArray } from "drizzle-orm";
import { and, or, lt } from "drizzle-orm";
import sesClient from "@utils/ses-client";
import { SendEmailCommand } from "@aws-sdk/client-sesv2";
import { systemLogger } from "@utils/logger";
import { broadcastToJob } from "@utils/email-job-sse";

async function fetchAndMarkEmails() {
  return await db.transaction(async (tx) => {
    const pendingEmails = await tx
      .select()
      .from(emailSents)
      .where(
        or(
          eq(emailSents.status, "pending"),
          and(
            eq(emailSents.status, "processing"),
            lt(emailSents.updatedAt, new Date(Date.now() - 10 * 60 * 1000)),
          ),
        ),
      )
      .limit(50);

    if (pendingEmails.length === 0) return [];

    const emailIds = pendingEmails.map((e) => e.id);
    await tx
      .update(emailSents)
      .set({ status: "processing", updatedAt: new Date() })
      .where(inArray(emailSents.id, emailIds));

    return pendingEmails;
  });
}

async function sendSingleEmail(email: any): Promise<"sent" | "failed"> {
  try {
    const templateData = email.emailData
      ? JSON.stringify(email.emailData as Record<string, any>)
      : "{}";

    const command = new SendEmailCommand({
      FromEmailAddress: process.env.AWS_SES_FROM_EMAIL,
      Destination: { ToAddresses: [email.toEmail || ""] },
      Content: {
        Template: {
          TemplateName: email.templateName,
          TemplateData: templateData,
        },
      },
    });

    await sesClient.send(command);

    await db
      .update(emailSents)
      .set({ status: "sent", updatedAt: new Date() })
      .where(eq(emailSents.id, email.id));

    return "sent";
  } catch (error: any) {
    systemLogger.error(
      `[EmailQueue] Failed ID ${email.id} (${email.toEmail}):`,
      {
        error: error.message,
      },
    );

    await db
      .update(emailSents)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(emailSents.id, email.id));

    return "failed";
  }
}

async function updateJobProgress(
  jobId: number,
  statusUpdate: "sent" | "failed",
) {
  const [updatedJob] = await db
    .update(emailBatchJobs)
    .set({
      sentCount:
        statusUpdate === "sent"
          ? sql`${emailBatchJobs.sentCount} + 1`
          : emailBatchJobs.sentCount,
      failedCount:
        statusUpdate === "failed"
          ? sql`${emailBatchJobs.failedCount} + 1`
          : emailBatchJobs.failedCount,
      status: "processing",
    })
    .where(eq(emailBatchJobs.id, jobId))
    .returning();

  if (!updatedJob) return;

  let finalJobState = updatedJob;
  const isComplete =
    updatedJob.sentCount + updatedJob.failedCount >= updatedJob.totalCount;

  if (isComplete) {
    const [completedJob] = await db
      .update(emailBatchJobs)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(emailBatchJobs.id, jobId))
      .returning();
    if (completedJob) finalJobState = completedJob;
  }

  broadcastToJob(jobId, {
    jobId: finalJobState.id,
    totalCount: finalJobState.totalCount,
    sentCount: finalJobState.sentCount,
    failedCount: finalJobState.failedCount,
    status: finalJobState.status,
    completedAt: finalJobState.completedAt?.toISOString() || null,
  });
}

export default async function processEmailQueue() {
  const emailsToProcess = await fetchAndMarkEmails();

  if (emailsToProcess.length === 0) return;

  systemLogger.info(
    `[EmailQueue] Processing ${emailsToProcess.length} emails...`,
  );

  for (const email of emailsToProcess) {
    const statusUpdate = await sendSingleEmail(email);

    if (email.emailBatchJobId != null) {
      await updateJobProgress(email.emailBatchJobId, statusUpdate);
    }
  }

  systemLogger.info(`[EmailQueue] Complete iteration.`);
}
