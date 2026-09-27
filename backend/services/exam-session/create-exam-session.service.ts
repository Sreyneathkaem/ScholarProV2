import { db } from '@db'
import { examSessions } from '@db/schema/exam-session';
import { z } from 'zod';
import { createExamSessionSchema } from '@validation/exam-session.schema';
import autoAssignApplicantService from '@services/exam-session/auto-assign-applicant.service'
import addComitteeToExamSessionService from '@services/exam-session//add-comittee-to-exam-session.service';
import { AppError } from "@middleware/app-error";
import { subjects } from '@db/schema/subject';
import { eq,inArray } from 'drizzle-orm';
import { faculties } from '@db/schema/faculty';
import { committees } from '@db/schema/committee';
import { batches } from '@db/schema/batch';

type ExamSessionPayload = z.infer<typeof createExamSessionSchema>;

export default async (batchId: number, payload: ExamSessionPayload) => {
    return await db.transaction(async (tx) => {
        if (!batchId) {
            return {
                success: false,
                msg: "Require batch Id"
            }
        }
        if (!Number.isInteger(batchId) || batchId <= 0) {
            return { success: false, msg: "Invalid batchId" };
        }

        const existingBatch = await db.select().from(batches).where(eq(batches.id, batchId));

        if(!existingBatch || existingBatch.length===0) {
            return { success: false, msg: "Batch not found"};
        }

        const existingCommittees = await db
        .select({ id: committees.id })
        .from(committees)
        .where(inArray(committees.id, payload.committeeIds));
        
        if(!existingCommittees || existingCommittees.length === 0){
            return {success: false, msg:  "Committe not found"};
        }

        
        
        const subject = await db
            .select({ id: subjects.id })
            .from(subjects)
            .where(eq(subjects.id, payload.subjectId))
            .limit(1);

        if (subject.length === 0) {
            return {
                success: false,
                msg: "Invalid subjectId"
            };
        }

        if (payload.facultyId) {
            const faculty = await db
                .select({ id: faculties.id })
                .from(faculties)
                .where(eq(faculties.id, payload.facultyId))
                .limit(1);

            if (faculty.length === 0) {
                return {
                    success: false,
                    msg: "Invalid facultyId"
                };
            }
        }

        let calculatedCapacity = payload.capacity || 0;

        if (payload.subjectId === 3 && payload.startTime && payload.endTime) {
          const breakMinutes =
            payload.breakStart && payload.breakEnd
              ? Math.max(
                  0,
                  (payload.breakEnd.getTime() - payload.breakStart.getTime()) / 60000
                )
              : 0;

          const totalWorkMinutes = Math.max(
            0,
            (payload.endTime.getTime() - payload.startTime.getTime()) / 60000 -
              breakMinutes
          );

          const slotsCount = Math.floor(totalWorkMinutes / 15);
          const breakCount = Math.floor(slotsCount / 6);
          const extraBreakMinutes = breakCount * 10;

          const freeMinutes = totalWorkMinutes - extraBreakMinutes;

          calculatedCapacity = Math.max(0, Math.floor(freeMinutes / 15));
        }

      
        const [session] = await tx
          .insert(examSessions)
          .values({
            ...payload,
            capacity: calculatedCapacity,
            batchId,
          })
          .returning();

        if (!session) {
            throw new AppError("Fail to create exam session.");
        }

        const assignResult = await autoAssignApplicantService(
          batchId,
          payload.subjectId,
          payload.facultyId || 0,
          session.id,
          calculatedCapacity ?? payload.capacity ?? 0,
          payload.startTime,
          payload.endTime,
          payload.breakStart ?? new Date(0),
          payload.breakEnd ?? new Date(0),
          tx
        );   
         await tx
           .update(examSessions)
           .set({ capacity: assignResult.assignedCount })
           .where(eq(examSessions.id, session.id));

        const committPayload = payload.committeeIds.map(committeeId => ({
            examSessionId: session.id,
            committeeId
        }));
        const committeeResult =  await addComitteeToExamSessionService(committPayload,tx);
        

        if (!committeeResult.success) {
          throw new AppError(committeeResult.msg);
        }
        return {
          success: true,
          msg: "Create session successfully",
          data: {
            ...session,
            capacity: assignResult.assignedCount,
            
          },
        };
    })
}