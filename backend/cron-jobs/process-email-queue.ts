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
    const defaultTemplateValues: Record<string, any> = {
      applicantName: "",
      gender: "",
      email: email.toEmail || "",
      status: "",
      scholarshipPercentage: "",
      major: "",
      tuitionFee: "",
      mathExamDate: "",
      mathStartTime: "",
      mathEndTime: "",
      mathRoom: "",
      englishExamDate: "",
      englishStartTime: "",
      englishEndTime: "",
      englishRoom: "",
      interviewExamDate: "",
      interviewStartTime: "",
      interviewEndTime: "",
      interviewRoom: "",
      interviewSlotStart: "",
      interviewSlotEnd: "",
    };

    const templateData = JSON.stringify({
      ...defaultTemplateValues,
      ...(email.emailData as Record<string, any> || {}),
    });

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

    const result = await sesClient.send(command);

    // SES can return without a MessageId on a soft failure; recording that as
    // 'sent' would make a broken send look successful.
    if (!result?.MessageId) {
      throw new Error("SES returned no MessageId for this message");
    }

    await db
      .update(emailSents)
      .set({ status: "sent", errorMessage: null, updatedAt: new Date() })
      .where(eq(emailSents.id, email.id));

    return "sent";
  } catch (error: any) {
    const reason = `${error?.name ? `${error.name}: ` : ""}${
      error?.message || "Unknown SES error"
    }`;

    systemLogger.error(
      `[EmailQueue] Failed ID ${email.id} (${email.toEmail}):`,
      {
        error: reason,
      },
    );

    await db
      .update(emailSents)
      .set({ status: "failed", errorMessage: reason.slice(0, 2000), updatedAt: new Date() })
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
