import { db } from "@db";
import { students } from "@db/schema/student";
import { applications } from "@db/schema/application";
import { appliedPrograms } from "@db/schema/applied-program";
import { examSessions } from "@db/schema/exam-session";
import { majors } from "@db/schema/major";
import { interviewSelection } from "@db/schema/interview-selection";
import { exams } from "@db/schema/exam";
import { eq, and, SQL, desc, inArray, ilike, or } from "drizzle-orm";
import { personalInfo } from "@db/schema/personal-info";
import { formatDate, formatTime } from "@utils/formate-data-time";

interface BulkEmailFilters {
  batchId?: number;
  search?: string;
  scholarshipPercentage?: number;
  major?: string;
  isApplyForScholarShip?: boolean;
  applicationIds?: number[];
  emails?: string[];
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

export default async function fetchGlobalVariable(filters?: BulkEmailFilters) {
  const whereConditions: SQL[] = [];

  if (
    !filters?.search?.trim() &&
    filters?.batchId !== undefined &&
    !isNaN(Number(filters.batchId))
  ) {
    whereConditions.push(eq(applications.batchId, Number(filters.batchId)));
  }

  if (filters?.search?.trim()) {
    const searchPattern = `%${filters.search.trim()}%`;
    whereConditions.push(
      or(
        ilike(students.nameEn, searchPattern),
        ilike(students.email, searchPattern),
      )!,
    );
  }

  if (
    filters?.status !== undefined &&
    filters.status !== ("all" as any) &&
    String(filters.status).trim() !== ""
  ) {
    whereConditions.push(eq(applications.status, filters.status));
  }

  if (filters?.isApplyForScholarShip !== undefined) {
    whereConditions.push(
      eq(applications.isApplyForScholarShip, filters.isApplyForScholarShip),
    );
  }

  if (
    filters?.scholarshipPercentage !== undefined &&
    !isNaN(Number(filters.scholarshipPercentage))
  ) {
    whereConditions.push(
      eq(
        applications.scholarshipPercentage,
        Number(filters.scholarshipPercentage),
      ),
    );
  }

  if (
    filters?.major !== undefined &&
    filters.major !== "All Majors" &&
    String(filters.major).trim() !== ""
  ) {
    whereConditions.push(eq(majors.majorName, filters.major));
  }

  if (filters?.applicationIds && filters.applicationIds.length > 0) {
    whereConditions.push(inArray(applications.id, filters.applicationIds));
  }

  let baseQuery = db
    .select({
      applicationId: applications.id,
      applicantName: students.nameEn,
      isApplyForScholarShip: applications.isApplyForScholarShip,
      gender: personalInfo.gender,
      email: students.email,
      status: applications.status,
      scholarshipPercentage: applications.scholarshipPercentage,
      major: majors.majorName,
      tuitionFee: majors.tuitionFee,
    })
    .from(applications)
    .innerJoin(students, eq(applications.studentId, students.id))
    .leftJoin(personalInfo, eq(students.id, personalInfo.studentId))
    .leftJoin(appliedPrograms, eq(applications.id, appliedPrograms.appId))
    .leftJoin(majors, eq(appliedPrograms.interestMajorId, majors.id))
    .orderBy(desc(applications.updatedAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0);

  if (whereConditions.length > 0) {
    baseQuery = baseQuery.where(and(...whereConditions)) as any;
  }

  const results = await baseQuery;

  if (!results.length) return [];

  // If fullEnrichment is false (default), skip the exam/interview queries
  if (filters?.fullEnrichment === false) {
    return results.map((r) => ({
      ...r,
      mathExamDate: "N/A",
      mathStartTime: "N/A",
      mathEndTime: "N/A",
      mathRoom: "N/A",
      englishExamDate: "N/A",
      englishStartTime: "N/A",
      englishEndTime: "N/A",
      englishRoom: "N/A",
      interviewExamDate: "N/A",
      interviewStartTime: "N/A",
      interviewEndTime: "N/A",
      interviewRoom: "N/A",
      interviewSlotStart: "N/A",
      interviewSlotEnd: "N/A",
    }));
  }

  const applicationIds = results.map((r) => r.applicationId);

  // Batch fetch math exams (subjectId 1)
  const mathExams = await db
    .select({
      appId: exams.appId,
      examDate: examSessions.examDate,
      startTime: examSessions.startTime,
      endTime: examSessions.endTime,
      location: examSessions.location,
    })
    .from(exams)
    .innerJoin(examSessions, eq(exams.examSessionId, examSessions.id))
    .where(
      and(inArray(exams.appId, applicationIds), eq(examSessions.subjectId, 1)),
    );

  // Batch fetch english exams (subjectId 2)
  const englishExams = await db
    .select({
      appId: exams.appId,
      examDate: examSessions.examDate,
      startTime: examSessions.startTime,
      endTime: examSessions.endTime,
      location: examSessions.location,
    })
    .from(exams)
    .innerJoin(examSessions, eq(exams.examSessionId, examSessions.id))
    .where(
      and(inArray(exams.appId, applicationIds), eq(examSessions.subjectId, 2)),
    );

  // Batch fetch interviews (subjectId 3)
  const interviews = await db
    .select({
      appId: exams.appId,
      examDate: examSessions.examDate,
      startTime: examSessions.startTime,
      endTime: examSessions.endTime,
      location: examSessions.location,
      slotStart: interviewSelection.slotStart,
      slotEnd: interviewSelection.slotEnd,
    })
    .from(exams)
    .innerJoin(interviewSelection, eq(exams.id, interviewSelection.examId))
    .innerJoin(examSessions, eq(exams.examSessionId, examSessions.id))
    .where(
      and(inArray(exams.appId, applicationIds), eq(examSessions.subjectId, 3)),
    );

  // Create lookup maps
  const mathMap = new Map(mathExams.map((e) => [e.appId, e]));
  const englishMap = new Map(englishExams.map((e) => [e.appId, e]));
  const interviewMap = new Map(interviews.map((e) => [e.appId, e]));

  return results.map((result) => {
    const math = mathMap.get(result.applicationId);
    const english = englishMap.get(result.applicationId);
    const interview = interviewMap.get(result.applicationId);

    return {
      ...result,
      mathExamDate: math ? formatDate(math.examDate) : "N/A",
      mathStartTime: math ? formatTime(math.startTime) : "N/A",
      mathEndTime: math ? formatTime(math.endTime) : "N/A",
      mathRoom: math?.location || "N/A",
      englishExamDate: english ? formatDate(english.examDate) : "N/A",
      englishStartTime: english ? formatTime(english.startTime) : "N/A",
      englishEndTime: english ? formatTime(english.endTime) : "N/A",
      englishRoom: english?.location || "N/A",
      interviewExamDate: interview ? formatDate(interview.examDate) : "N/A",
      interviewStartTime: interview ? formatTime(interview.startTime) : "N/A",
      interviewEndTime: interview ? formatTime(interview.endTime) : "N/A",
      interviewRoom: interview?.location || "N/A",
      interviewSlotStart: interview ? formatTime(interview.slotStart) : "N/A",
      interviewSlotEnd: interview ? formatTime(interview.slotEnd) : "N/A",
    };
  });
}
