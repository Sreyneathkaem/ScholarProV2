import { Request, Response } from "express";
import { validateEmailJobAccess } from "@utils/validate-email-job-access";
import { db } from "@db";
import { emailSents } from "@db/schema/email-sent";
import { and, eq } from "drizzle-orm";

export default async function getEmailJobController(
  req: Request,
  res: Response
): Promise<void> {
  const jobId = Number(req.params.jobId);
  const job = await validateEmailJobAccess(req, res, jobId);
  if (!job) return;

  // Surface the per-recipient SES rejection reasons so the UI can explain a
  // failure instead of only reporting how many failed.
  const failures = job.failedCount
    ? await db
        .select({
          toEmail: emailSents.toEmail,
          errorMessage: emailSents.errorMessage,
        })
        .from(emailSents)
        .where(
          and(
            eq(emailSents.emailBatchJobId, jobId),
            eq(emailSents.status, "failed"),
          ),
        )
        .limit(10)
    : [];

  res.status(200).json({
    jobId: job.id,
    totalCount: job.totalCount,
    sentCount: job.sentCount,
    failedCount: job.failedCount,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    failures,
  });
}
