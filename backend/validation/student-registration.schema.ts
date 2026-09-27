import { z } from "zod";
import { genderEnum } from "@db/schema/personal-info";
import {
  gradeEnum,
  educationLevelEnum,
  englishCertificateEnum,
} from "@db/schema/education-background";

const normalizePhoneNumber = (value: unknown) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return "";

  const digitsOnly = trimmed.replace(/[^\d+]/g, "");
  const hasPlus = digitsOnly.includes("+");

  return hasPlus
    ? `+${digitsOnly.replace(/\+/g, "")}`
    : digitsOnly.replace(/\+/g, "");
};

const phoneNumberSchema = z.preprocess(
  normalizePhoneNumber,
  z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[0-9]{8,15}$/, "Invalid phone number format"),
);

// Personal Information Schema
export const personalInfoSchema = z.object({
  nameKh: z.string().min(1, "Khmer name is required"),
  nameEn: z.string().min(1, "English name is required"),
  nationality: z.string().min(1, "Nationality is required"),
  gender: z.enum(genderEnum.enumValues, {
    message: "Gender must be male, female, or other",
  }),
  dateOfBirth: z.coerce.date({
    message: "Valid date of birth is required",
  }),
  placeOfBirth: z.string().min(1, "Place of birth is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  phoneNumber: phoneNumberSchema,
  email: z.string().email("Invalid email format"),
});

// Parent/Guardian Information Schema
export const parentGuardianInfoSchema = z.object({
  name: z.string().min(1, "Guardian name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  nationality: z.string().min(1, "Guardian nationality is required"),
  address: z.string().min(1, "Guardian address is required"),
  jobPosition: z.string().min(1, "Job position is required"),
  phoneNumber: phoneNumberSchema,
});

// Educational Background Schema
export const educationBackgroundSchema = z
  .object({
    currentEducationLevel: z.enum(
      ["university", "high_school_graduate", "current_12th_grader"] as const,
      {
        message: "Invalid education level",
      },
    ),
    // University-specific fields (optional, required if currentEducationLevel is 'university')
    major: z.string().optional(),
    institutionName: z.string().optional(),
    yearOfStudy: z.preprocess((value) => {
      if (value === undefined || value === null || value === "")
        return undefined;
      if (typeof value === "string") return Number(value.match(/\d+/)?.[0]);
      return value;
    }, z.number().int().min(1).max(10).optional()),

    // High school information (required for all)
    academicYear: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1, "Academic year is required").optional(),
    ),
    highSchoolName: z.string().min(1, "High school name is required"),
    schoolCity: z.string().optional(),
    schoolCountry: z.string().optional(),

    // Grades
    overallGrade: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .enum(gradeEnum.enumValues, {
          message: "Overall grade must be A, B, C, D, E, or F",
        })
        .optional(),
    ),
    mathGrade: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .enum(gradeEnum.enumValues, {
          message: "Math grade must be A, B, C, D, E, or F",
        })
        .optional(),
    ),
    englishGrade: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .enum(gradeEnum.enumValues, {
          message: "English grade must be A, B, C, D, E, or F",
        })
        .optional(),
    ),

    // English proficiency
    hasEnglishCertificate: z.preprocess(
      (value) => (value === "" || value === undefined ? "no" : value),
      z.enum(englishCertificateEnum.enumValues, {
        message: "English certificate status must be yes, no, or other",
      }),
    ),
  })
  .refine(
    (data) => {
      if (data.currentEducationLevel === "university") {
        return (
          data.major &&
          data.institutionName &&
          data.yearOfStudy &&
          data.academicYear &&
          data.overallGrade &&
          data.mathGrade &&
          data.englishGrade
        );
      }
      if (data.currentEducationLevel === "high_school_graduate") {
        return (
          data.academicYear &&
          data.overallGrade &&
          data.mathGrade &&
          data.englishGrade
        );
      }
      return true;
    },
    {
      message:
        "Academic year and grades are required for completed high-school education",
      path: ["major"],
    },
  );

// Applied Program Schema
export const appliedProgramSchema = z.object({
  interestMajorId: z.number().int().positive("Interest major ID is required"),
  isApplyingScholarship: z.boolean(),
  requestedTerm: z.coerce.date().optional(),
  considerNextIntake: z.boolean().optional(),
  referralSource: z.string().optional(),
});

// Application Schema
export const applicationSchema = z.object({
  batchId: z.number().int().positive("Batch ID is required"),
  isApplyForScholarShip: z.boolean().default(false),
  scholarshipPercentage: z.number().min(0).max(100).optional(),
});

// Complete Student Registration Schema
export const studentRegistrationSchema = z.object({
  // Student basic info (from students table)
  student: z.object({
    nameEn: z.string().min(1, "English name is required"),
    nameKh: z.string().min(1, "Khmer name is required"),
    email: z.string().email("Invalid email format"),
    phoneNumber: phoneNumberSchema,
    dateOfBirth: z.coerce.date({
      message: "Valid date of birth is required",
    }),
  }),

  // Personal information
  personalInfo: personalInfoSchema,

  // Parent/Guardian information
  parentGuardianInfo: parentGuardianInfoSchema,

  // Educational background
  educationBackground: educationBackgroundSchema,

  // Applied program
  appliedProgram: appliedProgramSchema,

  // Application details
  application: applicationSchema,
});

// Type exports for TypeScript
export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type ParentGuardianInfoInput = z.infer<typeof parentGuardianInfoSchema>;
export type EducationBackgroundInput = z.infer<
  typeof educationBackgroundSchema
>;
export type AppliedProgramInput = z.infer<typeof appliedProgramSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type StudentRegistrationInput = z.infer<
  typeof studentRegistrationSchema
>;
