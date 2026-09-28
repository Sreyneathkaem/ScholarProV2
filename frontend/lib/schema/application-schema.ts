import { z } from "zod";
import { sanitizeText } from "@/lib/utils/sanitize";

// Mirrors the backend's `phoneNumberSchema` in
// backend/validation/student-registration.schema.ts, which normalises to digits
// (plus an optional leading +) and then requires 8-15 digits. Kept in sync on
// purpose: the backend validates the same field and would otherwise reject the
// form with an opaque 400.
const phoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .refine((value) => {
    const digitsOnly = value.trim().replace(/[^\d+]/g, "");
    const normalized = digitsOnly.includes("+")
      ? `+${digitsOnly.replace(/\+/g, "")}`
      : digitsOnly.replace(/\+/g, "");
    return /^\+?[0-9]{8,15}$/.test(normalized);
  }, "Enter a valid phone number (8-15 digits)")
  .transform(sanitizeText);

export const personalInfoSchema = z.object({
  nameKhmer: z
    .string()
    .min(1, "Full name in Khmer is required")
    .trim()
    .transform(sanitizeText),
  nameEnglish: z
    .string()
    .min(1, "Full name in English is required")
    .trim()
    .transform(sanitizeText),
  nationality: z
    .string()
    .min(1, "Nationality is required")
    .trim()
    .transform(sanitizeText),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  placeOfBirth: z
    .string()
    .min(1, "Place of birth is required")
    .trim()
    .transform(sanitizeText),
  currentAddress: z
    .string()
    .min(1, "Current address is required")
    .trim()
    .transform(sanitizeText),
  country: z.string().min(1, "Country is required"),
  phoneNumber: phoneNumberSchema,
  email: z.string().email("Please enter a valid email address").trim(),
});

export const parentsSchema = z.object({
  name: z
    .string()
    .min(1, "Parent/Guardian's name is required")
    .trim()
    .transform(sanitizeText),
  relationship: z.string().min(1, "Relationship is required"),
  nationality: z
    .string()
    .min(1, "Nationality is required")
    .trim()
    .transform(sanitizeText),
  currentAddress: z
    .string()
    .min(1, "Current address is required")
    .trim()
    .transform(sanitizeText),
  jobPosition: z
    .string()
    .min(1, "Job position is required")
    .trim()
    .transform(sanitizeText),
  phoneNumber: phoneNumberSchema,
});

// NOTE: the rules below intentionally mirror
// backend/validation/student-registration.schema.ts. The backend re-validates
// everything on POST /students/student-register, so any field required here but
// missing there (or vice versa) surfaces as an opaque 400 on submit. If you
// change a required field here, change it there too.
export const educationSchema = z
  .object({
    currentEducationLevel: z.enum(
      ["university", "high_school_graduate", "current_12th_grader"] as const,
      { error: "Please select your current education level" },
    ),
    universityCurrentMajor: z.string().trim(),
    universityInstitutionName: z.string().trim(),
    universityYearOfStudy: z.string().trim(),
    highSchoolAcademicYear: z.string().trim(),
    highSchoolName: z.string().trim(),
    highSchoolCity: z.string().trim(),
    highSchoolOverallGrade: z.string(),
    highSchoolMathGrade: z.string(),
    highSchoolEnglishGrade: z.string(),
    hasIeltsOrToefl: z.string(),
  })
  .superRefine((data, ctx) => {
    const require = (path: (keyof typeof data)[], message: string, value: unknown) => {
      const isEmpty =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "");
      if (isEmpty) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: path as string[], message });
      }
    };

    // `highSchoolName` is a top-level `min(1)` on the backend's
    // educationBackgroundSchema, so it is required for every education level.
    require(["highSchoolName"], "School name is required", data.highSchoolName);

    if (data.currentEducationLevel === "university") {
      // Matches the "university" branch of the backend .refine().
      require(
        ["universityCurrentMajor"],
        "Current major is required",
        data.universityCurrentMajor,
      );
      require(
        ["universityInstitutionName"],
        "Institution name is required",
        data.universityInstitutionName,
      );

      // The backend parses the first integer out of this free-text field and
      // requires it to be 1-10, so "Third year" would be rejected there.
      const yearMatch = data.universityYearOfStudy.match(/\d+/);
      const yearValue = yearMatch ? Number(yearMatch[0]) : NaN;
      if (!Number.isInteger(yearValue) || yearValue < 1 || yearValue > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["universityYearOfStudy"],
          message: "Enter your year of study as a number between 1 and 10",
        });
      }

      require(
        ["highSchoolAcademicYear"],
        "Academic year is required",
        data.highSchoolAcademicYear,
      );
      require(
        ["highSchoolOverallGrade"],
        "Overall grade is required",
        data.highSchoolOverallGrade,
      );
      require(["highSchoolMathGrade"], "Math grade is required", data.highSchoolMathGrade);
      require(
        ["highSchoolEnglishGrade"],
        "English grade is required",
        data.highSchoolEnglishGrade,
      );
    }

    if (data.currentEducationLevel === "high_school_graduate") {
      // Matches the "high_school_graduate" branch of the backend .refine().
      // current_12th_grader is intentionally absent there, as it is here.
      require(
        ["highSchoolAcademicYear"],
        "Academic year is required",
        data.highSchoolAcademicYear,
      );
      require(
        ["highSchoolOverallGrade"],
        "Overall grade is required",
        data.highSchoolOverallGrade,
      );
      require(["highSchoolMathGrade"], "Math grade is required", data.highSchoolMathGrade);
      require(
        ["highSchoolEnglishGrade"],
        "English grade is required",
        data.highSchoolEnglishGrade,
      );
    }
  });

export const appliedProgramSchema = z.object({
  interestedMajors: z
    .array(z.string())
    .min(1, "Please select at least one major"),
  applyingForScholarship: z
    .string()
    .min(1, "Please indicate if you are applying for a scholarship"),
  requestedAcademicTerm: z.string().min(1, "Please select an academic term"),
  considerNextIntake: z.string().min(1, "Please indicate your preference"),
  howDidYouKnow: z
    .array(z.string())
    .min(1, "Please select at least one option"),
  dataConsent: z.string().min(1, "Please provide your consent decision"),
  declaration: z
    .boolean()
    .refine((v) => v === true, "You must agree to the declaration"),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;
export type ParentsValues = z.infer<typeof parentsSchema>;
export type EducationValues = z.infer<typeof educationSchema>;
export type AppliedProgramValues = z.infer<typeof appliedProgramSchema>;
