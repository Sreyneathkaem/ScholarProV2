import fetchGlobalVariable from "@utils/fetch-global-variable";
import { Request, Response } from "express";

interface BulkEmailFilters {
  batchId?: number;
  search?: string;
  scholarshipPercentage?: number;
  major?: string;
  isApplyForScholarShip?: boolean;
  status?:
    | "submitted"
    | "shortlisted"
    | "shortlisted_email_sent"
    | "assessment_scheduled"
    | "graded"
    | "accepted"
    | "accepted_email_sent"
    | "rejected"
    | "incomplete";
  limit?: number;
  offset?: number;
  fullEnrichment?: boolean;
}

export default async (req: Request, res: Response): Promise<void> => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;
  const page = req.query.page ? Number(req.query.page) : 1;
  const offset = (page - 1) * limit;

  const filters: BulkEmailFilters = {
    batchId: req.query.batchId ? Number(req.query.batchId) : undefined,
    search:
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined,
    scholarshipPercentage: req.query.scholarshipPercentage
      ? Number(req.query.scholarshipPercentage)
      : undefined,
    major: req.query.major as string | undefined,
    isApplyForScholarShip:
      req.query.isApplyForScholarShip !== undefined
        ? req.query.isApplyForScholarShip === "true" ||
          req.query.isApplyForScholarShip === "1"
        : undefined,
    status: req.query.status as BulkEmailFilters["status"],
    limit,
    offset,
    fullEnrichment: false,
  };

  const results = await fetchGlobalVariable(filters);

  const basicInfo = results.map(
    ({
      applicationId,
      applicantName,
      gender,
      email,
      isApplyForScholarShip,
      status,
      scholarshipPercentage,
      major,
    }) => ({
      applicationId,
      applicantName,
      gender,
      email,
      isApplyForScholarShip,
      status,
      scholarshipPercentage,
      major,
    }),
  );

  res.status(200).json({
    success: true,
    data: basicInfo,
    pagination: {
      limit,
      page,
      offset,
      count: basicInfo.length,
    },
  });
};
