import { ListApplicantQuerySchema } from "@validation/ListApplicantQuerySchema";
import { ListApplicantService } from "@services/application/list-applicants.service";
import { asyncHandler } from "@utils/async-handler";
import { userLogger } from "@utils/logger";


export const GetApplicants = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit,
    sortBy = "id",
    order = "asc",
    search,
    applicationId,
    batchId,
    province,
    status,
    paymentStatus,
    scholarshipPercentage,
  } = ListApplicantQuerySchema.parse(req.query);

  userLogger.info("GET_APPLICANTS", {
    userId: req.user?.id,
    role: req.user?.role,
    filters: {
      page,
      limit,
      sortBy,
      order,
      batchId,
      province,
      status,
      paymentStatus,
      scholarshipPercentage,
      hasSearch: Boolean(search),
    },
  });

  const result = await ListApplicantService.getApplicants(
    page,
    limit,
    sortBy,
    order,
    search,
    applicationId,
    batchId,
    province,
    status,
    paymentStatus,
    scholarshipPercentage
  );

  res.status(200).json({
    success: true,
    ...result,
  });
});
