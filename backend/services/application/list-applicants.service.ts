import { sql, eq, asc, desc, inArray, and, SQL } from "drizzle-orm";
import { db } from "@db";

import { applications } from "@db/schema/application";
import { students } from "@db/schema/student";
import { personalInfo } from "@db/schema/personal-info";
import { appliedPrograms } from "@db/schema/applied-program";
import { exams } from "@db/schema/exam";
import { examSessions } from "@db/schema/exam-session";
import { subjects } from "@db/schema/subject";
import { educationBackground } from "@db/schema/education-background";
import { majors } from "@db/schema/major";
import { calculateRanks } from "@utils/calculate-rank";
import { PaginationConfigService } from "@services/setting/pagination-config.service";
import { TotalApplicationScoreCalculatorService } from "@services/application/Totalapplication-score-calculator.service";

export interface ApplicantSubject {
  subjectId: number;
  subjectName: string;
  totalScore: number;
  weight: number;
}

export interface ApplicantInfo {
  applicationId: number;
  nameEn: string | null;
  gender: "male" | "female" | "other";
  major: string | null;
  email: string | null;
  requestTerm: any;
  dateApplied: Date;
  province: string;
  phoneNumber: string;
  status:
  | "submitted"
  | "shortlisted"
  | "assessment_scheduled"
  | "graded"
  | "accepted"
  | "rejected"
  | "incomplete"
  | "shortlisted_email_sent"
  | "accepted_email_sent";
  subjects: ApplicantSubject[];
  overAllGrade: string | null;
  totalApplicationScore: number;
  paymentStatus?: "failed" | "pending" | "completed";
  scholarshipPercentage: number | null;
  rank?: number;
}

/* =========================
 * SERVICE
 * ========================= */

export class ListApplicantService {
  static async getApplicants(
    page = 1,
    limit?: number,
    sortBy: "name" | "dateApplied" | "id" = "id",
    order: "asc" | "desc" = "asc",
    search?: string,
    applicationId?: number,
    batchIds?: number[],
    provinces?: string[],
    status?: ApplicantInfo["status"][] | string,
    paymentStatus?: ApplicantInfo["paymentStatus"],
    scholarshipPercentage?: number
  ) {
    if (!limit) {
      limit = await PaginationConfigService.getDefaultLimit();
    }

    const offset = (page - 1) * limit;

    const sortColumn =
      sortBy === "name"
        ? students.nameEn
        : sortBy === "id"
          ? applications.id
          : applications.createdAt;

    const sortOrder = order === "asc" ? asc(sortColumn) : desc(sortColumn);
    const conditions: SQL[] = [];

    const normalizedStatuses =
      typeof status === "string"
        ? (status.split(",") as ApplicantInfo["status"][])
        : status;

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      conditions.push(
        sql`(
          ${students.nameEn} ILIKE ${term}
          OR ${students.email} ILIKE ${term}
        )`
      );
    }

    if (applicationId) {
      conditions.push(eq(applications.id, applicationId));
    }

    if (batchIds?.length) {
      conditions.push(inArray(applications.batchId, batchIds));
    }

    if (provinces?.length) {
      conditions.push(inArray(educationBackground.schoolLocation, provinces));
    }

    if (normalizedStatuses?.length) {
      conditions.push(inArray(applications.status, normalizedStatuses));
    }

    if (paymentStatus) {
      conditions.push(eq(applications.paymentStatus, paymentStatus));
    }

    if (scholarshipPercentage !== undefined) {
      conditions.push(
        eq(applications.scholarshipPercentage, scholarshipPercentage)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const applicants = await db
      .select({
        applicationId: applications.id,
        nameEn: students.nameEn,
        phoneNumber: sql<string>`COALESCE(${students.phoneNumber}, '')`,
        gender: sql<"male" | "female" | "other">`COALESCE(${personalInfo.gender}, 'other')`,
        major: majors.majorName,
        email: students.email,
        dateApplied: applications.createdAt,
        status: applications.status,
        province: sql<string>`COALESCE(${educationBackground.schoolLocation}, 'Not provided')`,
        requestTerm: appliedPrograms.requestedTerm,
        paymentStatus: applications.paymentStatus,
        overAllGrade: educationBackground.overallGrade,
        scholarshipPercentage: applications.scholarshipPercentage,
        isMathTestSkipped: applications.isMathTestSkipped,
        isEnglishTestSkipped: applications.isEnglishTestSkipped,
      })
      .from(applications)
      .innerJoin(students, eq(applications.studentId, students.id))
      .leftJoin(personalInfo, eq(personalInfo.studentId, students.id))
      .leftJoin(
        educationBackground,
        eq(educationBackground.appId, applications.id)
      )
      .leftJoin(appliedPrograms, eq(appliedPrograms.appId, applications.id))
      .leftJoin(majors, eq(majors.id, appliedPrograms.interestMajorId))
      .where(whereClause)
      .orderBy(sortOrder)
      .limit(limit)
      .offset(offset);

    if (!applicants.length) {
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const applicationIds = applicants.map((a) => a.applicationId);

    const subjectRows = await db
      .select({
        applicationId: exams.appId,
        subjectId: subjects.id,
        subjectName: subjects.subjectName,
        weight: subjects.weight,
        totalScore: sql<number>`COALESCE(SUM(${exams.totalScore}), 0)`,
      })
      .from(exams)
      .innerJoin(examSessions, eq(examSessions.id, exams.examSessionId))
      .innerJoin(subjects, eq(subjects.id, examSessions.subjectId))
      .where(inArray(exams.appId, applicationIds))
      .groupBy(exams.appId, subjects.id, subjects.subjectName, subjects.weight);

    const subjectMap = new Map<number, ApplicantSubject[]>();

    for (const row of subjectRows) {
      if (!subjectMap.has(row.applicationId)) {
        subjectMap.set(row.applicationId, []);
      }

      subjectMap.get(row.applicationId)!.push({
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        totalScore: Number(row.totalScore),
        weight: Number(row.weight),
      });
    }

    const data: ApplicantInfo[] = applicants.map((app) => {
      const subjects = subjectMap.get(app.applicationId) ?? [];
      if (app.isMathTestSkipped) {
        const mathSubject = subjects.find(
          (s) =>
            s.subjectName.toLowerCase() === "math" ||
            s.subjectName.toLowerCase() === "mathematics"
        );
        if (mathSubject) {
          mathSubject.totalScore = 100;
        } else {
          subjects.push({
            subjectId: 1,
            subjectName: "Mathematics",
            totalScore: 100,
            weight: 25,
          });
        }
      }

      if (app.isEnglishTestSkipped) {
        const englishSubject = subjects.find(
          (s) => s.subjectName.toLowerCase() === "english"
        );
        if (englishSubject) {
          englishSubject.totalScore = 100;
        } else {
          subjects.push({
            subjectId: 2,
            subjectName: "English",
            totalScore: 100,
            weight: 25,
          });
        }
      }

      const totalApplicationScore =
        TotalApplicationScoreCalculatorService.calculate(
          subjects.map((s) => ({
            subjectId: s.subjectId,
            totalScore: s.totalScore,
            weight: s.weight,
          }))
        );
      return {
        ...app,
        subjects,
        totalApplicationScore,
        rank: 0, // Temporary, will be updated below
      };
    });
    const [{ count }] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${applications.id})`.mapWith(Number),
      })
      .from(applications)
      .innerJoin(students, eq(applications.studentId, students.id))
      .leftJoin(personalInfo, eq(personalInfo.studentId, students.id))
      .leftJoin(
        educationBackground,
        eq(educationBackground.appId, applications.id)
      )
      .leftJoin(appliedPrograms, eq(appliedPrograms.appId, applications.id))
      .leftJoin(majors, eq(majors.id, appliedPrograms.interestMajorId))
      .where(whereClause);

    const rankMap = calculateRanks(
      data.map((applicant) => ({
        applicationId: applicant.applicationId,
        totalApplicationScore: applicant.totalApplicationScore,
      }))
    );

    // Add ranks to each applicant
    data.forEach((applicant) => {
      applicant.rank = rankMap.get(applicant.applicationId) ?? 0;
    });

    return {
      data,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}
