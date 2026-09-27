import { z } from "zod";

const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Subtract 1 day to allow any timezone differences between client and server
  d.setDate(d.getDate() - 1);
  return d;
};

//bulk create exam session
export const createExamSessionSchema = z
  .object({
    sessionName: z
      .string()
      .min(2, { message: "Session name must be at least 2 characters" }),
    capacity: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce
        .number()
        .int({ message: "Capacity must be an integer" })
        .positive({ message: "Capacity must be greater than 0" })
        .optional()
    ),
    location: z
      .string()
      .min(2, { message: "Location must be at least 2 characters" }),
    subjectId: z.coerce
      .number()
      .int({ message: "Subject ID must be an integer" })
      .positive({ message: "Subject ID must be positive" }),
    facultyId: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce
        .number()
        .int({ message: "faculty ID must be an integer" })
        .positive({ message: "faculty ID must be positive" })
        .optional()
    ),
    examDate: z.coerce
      .date({ message: "Valid exam date is required" })
      .refine((d) => d >= getStartOfToday(), {
        message: "Exam Date cannot be in the past",
      }),

    startTime: z.coerce
      .date({ message: "Valid start time is required" })
      .refine((d) => d >= getStartOfToday(), {
        message: "Start Time cannot be in the past",
      }),
    endTime: z.coerce
      .date({ message: "Valid end time is required" }),
    breakStart: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce.date({ message: "Valid break time start is required" }).optional()
    ),
    breakEnd: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce.date({ message: "Valid break time end is required" }).optional()
    ),
    committeeIds: z
      .array(z.string().uuid({ message: "Committee ID must be a valid UUID" }))
      .min(1, "At least one committee is required"),
  })
  .refine((data) => data.subjectId === 3 || data.capacity !== undefined, {
    message: "Capacity is required unless subject is interview",
    path: ["capacity"],
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine(
    (data) => {
      const { breakStart, breakEnd, startTime, endTime } = data;
      if (!breakStart && !breakEnd) return true; // no break, OK
      if (!breakStart || !breakEnd) return false; // one missing, invalid
      return (
        startTime !== undefined &&
        endTime !== undefined &&
        breakStart > startTime &&
        breakEnd > breakStart &&
        breakEnd < endTime
      );
    },
    {
      message:
        "Break times must be both defined, breakStart must be after startTime, breakEnd must be after breakStart and before endTime",
      path: ["breakStart", "breakEnd"],
    }
  );
//update exam session
export const examSessionIdSchema = z.object({
  id: z.coerce
    .number()
    .int({ message: "Exam session ID must be an integer" })
    .positive({ message: "Exam session ID must be positive" }),
});

export const updateExamSessionSchema = z
  .object({
    sessionName: z
      .string()
      .min(2, { message: "Session name must be at least 2 characters" })
      .optional(),
    capacity: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce
        .number()
        .int({ message: "Capacity must be an integer" })
        .positive({ message: "Capacity must be greater than 0" })
        .optional()
    ),
    location: z
      .string()
      .min(2, { message: "Location must be at least 2 characters" })
      .optional(),
    subjectId: z.coerce
      .number()
      .int({ message: "Subject ID must be an integer" })
      .positive({ message: "Subject ID must be positive" })
      .optional(),
    facultyId: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce
        .number()
        .int({ message: "Faculty ID must be an integer" })
        .positive({ message: "Faculty ID must be positive" })
        .optional()
    ),
    examDate: z.coerce
      .date({ message: "Valid exam date is required" })
      .optional(),
    startTime: z.coerce
      .date({ message: "Valid start time is required" })
      .optional(),
    endTime: z.coerce
      .date({ message: "Valid end time is required" })
      .optional(),
    breakStart: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce.date({ message: "Valid break time start is required" }).optional()
    ),
    breakEnd: z.preprocess(
      (val) => (val === null || val === "" || val === undefined ? undefined : val),
      z.coerce.date({ message: "Valid break time end is required" }).optional()
    ),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )
  .refine(
    (data) => {
      const { breakStart, breakEnd, startTime, endTime } = data;
      if (!breakStart && !breakEnd) return true;
      if (!breakStart || !breakEnd) return false;
      return (
        startTime !== undefined &&
        endTime !== undefined &&
        breakStart > startTime &&
        breakEnd > breakStart &&
        breakEnd < endTime
      );
    },
    {
      message:
        "Break times must be both defined, breakStart must be after startTime, breakEnd must be after breakStart and before endTime",
      path: ["breakStart", "breakEnd"],
    }
  );
//add committe into exam session
export const addCommiteeToExamSessionSchema = z
  .array(
    z.object({
      examSessionId: z.coerce
        .number()
        .int({ message: "Exam session ID must be an integer" })
        .positive({ message: "Exam session ID must be positive" }),
      committeeId: z
        .string()
        .uuid({ message: "Committee ID must be a valid UUID" }),
    })
  )
  .min(1, "At least one committe mapping is required");

//auto assign student
export const autoAssignApplicantSchema = z.object({
  batcheId: z.coerce
    .number()
    .int({ message: "Batch Id is required" })
    .positive({ message: "Batch Id must be a positive number" }),
  subjectId: z.coerce
    .number()
    .int({ message: "Subject Id is required" })
    .positive({ message: "Subject Id must be a positive number" }),
  examDate: z.coerce.date({ message: "Valid exam date is required" }),
  startTime: z.coerce.date({ message: "Valid start time is required" }),
  endTime: z.coerce.date({ message: "Valid end time is required" }),
  sessionName: z.coerce
    .string()
    .min(1, "Session name must be at least 2 character"),
  location: z.coerce.string().min(1, "Location must be at least 2 character"),
  capacity: z.coerce
    .number()
    .int({ message: "Capacity of each room is required" })
    .positive({ message: "Capacity must be a number greater than 0" }),
  breakStart: z.coerce
    .date({ message: "Valid break start time is required" })
    .optional(),
  breakEnd: z.coerce
    .date({ message: "Valid break end time is required" })
    .optional(),
});
