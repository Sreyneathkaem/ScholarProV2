import { applications } from "@db/schema/application";
import { exams } from "@db/schema/exam";
import { interviewSelection } from "@db/schema/interview-selection";
import { appliedPrograms } from "@db/schema/applied-program";
import { majors } from "@db/schema/major";
import { and, asc, eq, inArray } from "drizzle-orm";
import { AppError } from "@middleware/app-error";
type Applicant = { id: number };
type Exam = { id: number };

export default async (
  batchId: number,
  subjectId: number,
  facultyId: number,
  examSessionId: number,
  capacity: number,
  startTime: Date,
  endTime: Date,
  breakStart: Date,
  breakEnd: Date,
  tx: any
) => {
  let whereClause;

  switch (subjectId) {
    case 1:
      whereClause = and(
        eq(applications.batchId, batchId),
        eq(applications.isMathTestSkipped, false),
        eq(applications.isMathAssigned, false)
      );
      break;

    case 2:
      whereClause = and(
        eq(applications.batchId, batchId),
        eq(applications.isEnglishTestSkipped, false),
        eq(applications.isEnglishAssigned, false)
      );
      break;

    case 3: {
      const majorIds = await tx
        .select({ id: majors.id })
        .from(majors)
        .where(eq(majors.facultyId, facultyId));

      if (majorIds.length === 0) {
        throw new AppError("No majors found for the selected faculty");
      }

      whereClause = and(
        eq(applications.batchId, batchId),
        eq(applications.isInterviewAssigned, false),
        inArray(
          appliedPrograms.interestMajorId,
          majorIds.map((m: { id: number }) => m.id)
        )
      );
      break;
    }

    default:
      throw new AppError("Invalid subjectId");
  }

  let applicants: Applicant[];

  if (subjectId === 3) {
    applicants = await tx
      .select({ id: applications.id })
      .from(applications)
      .leftJoin(appliedPrograms, eq(applications.id, appliedPrograms.appId))
      .where(whereClause)
      .orderBy(asc(applications.id))
      .limit(capacity);
  } else {
    applicants = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(whereClause)
      .orderBy(asc(applications.id))
      .limit(capacity);
  }

  if (applicants.length === 0) {
    throw new AppError("No applicants available for assignment");
  }

  const examPayload = applicants.map((app: Applicant) => ({
    appId: app.id,
    examSessionId,
    status: "scheduled" as const,
  }));

  const examRows: Exam[] = await tx
    .insert(exams)
    .values(examPayload)
    .returning();

  if (subjectId === 1) {
    await tx
      .update(applications)
      .set({ isMathAssigned: true })
      .where(
        inArray(
          applications.id,
          applicants.map((a) => a.id)
        )
      );
  } else if (subjectId === 2) {
    await tx
      .update(applications)
      .set({ isEnglishAssigned: true })
      .where(
        inArray(
          applications.id,
          applicants.map((a) => a.id)
        )
      );
  } else {
    if (subjectId === 3) {
      await tx
        .update(applications)
        .set({ isInterviewAssigned: true })
        .where(
          inArray(
            applications.id,
            applicants.map((a) => a.id)
          )
        );
    }

    const slots = buildSlots(startTime, endTime, breakStart, breakEnd);
 
    if (examRows.length > slots.length) {
      throw new AppError("Not enough slots for all applicants");
    }

    const interviewPayload = examRows.map((row, i) => ({
      examId: row.id,
      slotStart: slots[i].start,
      slotEnd: slots[i].end,
    }));

    await tx.insert(interviewSelection).values(interviewPayload);
  }

  return { success: true, msg: "Student assigned successfully", assignedCount:applicants.length };
};

export function buildSlots(
  start: Date,
  end: Date,
  breakStart?: Date | null,
  breakEnd?: Date | null
) {
  const slots = [];
  let time = new Date(start);
  let count = 0;

  const hasBreak =
    Boolean(
      breakStart &&
      breakEnd &&
      breakStart.getTime() > 0 &&
      breakEnd.getTime() > breakStart.getTime()
    );

  while (time < end) {
    if (count === 6) {
      time = new Date(time.getTime() + 10 * 60 * 1000);
      count = 0;
      continue;
    }

    const nextTime = new Date(time.getTime() + 15 * 60 * 1000);
    if (nextTime > end) break;

    const inBreak =
      hasBreak &&
      breakStart &&
      breakEnd &&
      ((time >= breakStart && time < breakEnd) ||
        (nextTime > breakStart && nextTime <= breakEnd));

    if (inBreak && breakEnd) {
      time = new Date(breakEnd);
      continue;
    }

    slots.push({ start: new Date(time), end: new Date(nextTime) });
    count++;

    time = nextTime;
  }

  return slots;
}
