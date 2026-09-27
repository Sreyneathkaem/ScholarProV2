import { Request, Response } from "express";
import bulkSendEmailService from "@services/email/bulk-send-email.service";

export default async (req: Request, res: Response) => {
  const userId = String(req.user?.id);
  if (!userId || typeof userId !== "string") {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }
  const templateName = req.params.name as string;

  const parseCsvList = (value: unknown): string[] => {
    if (!value) return [];
    const items = Array.isArray(value) ? value : String(value).split(",");
    return items.map((item) => String(item).trim()).filter(Boolean);
  };

  const applicationIds = parseCsvList(req.query.applicationIds)
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value) && value > 0);

  const emails = parseCsvList(req.query.emails).filter((email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  );

  const filter = {
    batchId: req.query.batchId ? Number(req.query.batchId) : undefined,
    status:
      req.query.status &&
      req.query.status !== "all" &&
      String(req.query.status).trim() !== ""
        ? (req.query.status as any)
        : undefined,
    scholarshipPercentage:
      req.query.scholarshipPercentage &&
      req.query.scholarshipPercentage !== "all" &&
      !isNaN(Number(req.query.scholarshipPercentage))
        ? Number(req.query.scholarshipPercentage)
        : undefined,
    major:
      req.query.major &&
      req.query.major !== "All Majors" &&
      String(req.query.major).trim() !== ""
        ? String(req.query.major)
        : undefined,
    applicationIds: applicationIds.length ? applicationIds : undefined,
    emails: emails.length ? emails : undefined,
  };

  const result = await bulkSendEmailService(userId, templateName, filter);

  if (!result?.success || !result) {
    return res.status(404).json({
      success: false,
      message: result.msg,
    });
  }

  return res.status(200).json({
    success: true,
    message: result.msg,
    jobId: result.jobId,
  });
};
