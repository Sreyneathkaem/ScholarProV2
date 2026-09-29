import { db } from "@db";
import { applications } from "@db/schema/application";
import { emailTemplates } from "@db/schema/email-template";
import fetchGlobalVariable from "./fetch-global-variable";
import { and, eq, inArray } from "drizzle-orm";

export default async function prepareBulkEmail(
  templateName: string,
  filter: any,
  tx: any = db,
) {
  const [template] = await tx
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.name, templateName));

  let recipients: any[] = [];

  if (filter?.applicationIds?.length) {
    recipients = await fetchGlobalVariable({
      applicationIds: filter.applicationIds,
      limit: 10000,
      offset: 0,
      fullEnrichment: true,
    });
  } else if (filter?.emails?.length) {
    recipients = filter.emails.map((email: string) => ({
      applicationId: 0,
      applicantName: email.split("@")[0],
      email,
      status: "manual",
      scholarshipPercentage: null,
      major: null,
    }));
  } else {
    recipients = await fetchGlobalVariable({
      ...filter,
      limit: 10000,
      offset: 0,
      fullEnrichment: true,
    });
  }

  if (!recipients.length) return [];

  const applicationIds = recipients
    .map((r) => r.applicationId)
    .filter((id) => Number.isFinite(id) && id > 0);

  if (applicationIds.length > 0) {
    switch (filter.status) {
      case "shortlisted":
        await tx
          .update(applications)
          .set({ status: "shortlisted_email_sent" })
          .where(
            and(
              inArray(applications.id, applicationIds),
              eq(applications.status, "shortlisted"),
            ),
          );
        break;
      case "accepted":
        await tx
          .update(applications)
          .set({ status: "accepted_email_sent" })
          .where(
            and(
              inArray(applications.id, applicationIds),
              eq(applications.status, "accepted"),
            ),
          );
        break;
    }
  }

  const bulkEntries = recipients
    .filter((r): r is typeof r & { email: string } => !!r.email)
    .map((r) => {
      const templateData: Record<string, any> = {
        applicantName: r.applicantName || r.email || "",
        gender: r.gender || "",
        email: r.email || "",
        status: r.status || "",
        scholarshipPercentage:
          r.scholarshipPercentage != null ? String(r.scholarshipPercentage) : "",
        major: r.major || "",
        tuitionFee: r.tuitionFee != null ? String(r.tuitionFee) : "",
        mathExamDate: r.mathExamDate || "",
        mathStartTime: r.mathStartTime || "",
        mathEndTime: r.mathEndTime || "",
        mathRoom: r.mathRoom || "",
        englishExamDate: r.englishExamDate || "",
        englishStartTime: r.englishStartTime || "",
        englishEndTime: r.englishEndTime || "",
        englishRoom: r.englishRoom || "",
        interviewExamDate: r.interviewExamDate || "",
        interviewStartTime: r.interviewStartTime || "",
        interviewEndTime: r.interviewEndTime || "",
        interviewRoom: r.interviewRoom || "",
        interviewSlotStart: r.interviewSlotStart || "",
        interviewSlotEnd: r.interviewSlotEnd || "",
      };

      for (const [key, value] of Object.entries(r)) {
        if (value !== null && value !== undefined) {
          templateData[key] = value;
        }
      }

      for (const v of template?.variable ?? []) {
        if (
          r[v as keyof typeof r] !== undefined &&
          r[v as keyof typeof r] !== null
        ) {
          templateData[v] = r[v as keyof typeof r];
        }
      }

      templateData.applicantName = r.applicantName || r.email || "";
      templateData.email = r.email;
      return {
        Destination: { ToAddresses: [r.email] },
        ReplacementEmailContent: {
          ReplacementTemplate: {
            ReplacementTemplateData: JSON.stringify(templateData),
          },
        },
      };
    });

  return bulkEntries;
}
