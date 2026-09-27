import { db } from '@db';
import { students } from '@db/schema/student';
import { applications } from '@db/schema/application';
import { exams } from '@db/schema/exam';
import { examSessions } from '@db/schema/exam-session';
import { subjects } from '@db/schema/subject';
import { batches } from '@db/schema/batch';
import { interviewSelection } from '@db/schema/interview-selection';
import { eq, and, ne } from 'drizzle-orm';

export async function getScheduleByStudent(userId: string) {
    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.userId, userId));

    if (!student) {
        return { success: false, msg: "Student not found" };
    }

    const result = await db
        .select({
            examId: exams.id,
            sessionId: examSessions.id,
            sessionName: examSessions.sessionName,
            subjectName: subjects.subjectName,
            examDate: examSessions.examDate,
            startTime: examSessions.startTime,
            endTime: examSessions.endTime,
            location: examSessions.location,
            status: examSessions.status,
            examStatus: exams.status,
            batchName: batches.batchName,
            interviewSlotStart: interviewSelection.slotStart,
            interviewSlotEnd: interviewSelection.slotEnd
        })
        .from(examSessions)
        .innerJoin(exams, eq(examSessions.id, exams.examSessionId))
        .innerJoin(applications, eq(exams.appId, applications.id))
        .innerJoin(subjects, eq(examSessions.subjectId, subjects.id))
        .innerJoin(batches, eq(examSessions.batchId, batches.id))
        .leftJoin(interviewSelection, eq(exams.id, interviewSelection.examId))
        .where(
            and(
                eq(applications.studentId, student.id),
                ne(exams.status, 'cancelled')
            )
        );
    
    return { success: true, data: result };
}
