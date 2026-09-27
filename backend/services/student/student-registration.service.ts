import { db } from "@db";
import { students } from "@db/schema/student";
import { personalInfo } from "@db/schema/personal-info";
import { parentGuardianInfos } from "@db/schema/parent-guardian-info";
import { applications } from "@db/schema/application";
import { educationBackground } from "@db/schema/education-background";
import { appliedPrograms } from "@db/schema/applied-program";
import { attachments } from "@db/schema/attachment";
import { batches } from "@db/schema/batch";
import { majors } from "@db/schema/major";
import { studentRegistrationSchema } from "@validation/student-registration.schema";
import { ValidationError, ConflictError, InternalServerError } from "@utils/errors";
import { and, desc, eq, ne } from "drizzle-orm";
import { AttachmentService } from "@services/attachment/attachment.service";

export class StudentRegistrationService {
  static async execute(
    payload: any,
    personalDocuments?: Express.Multer.File[],
    paymentProof?: Express.Multer.File[],
    educationDocuments?: Express.Multer.File[]
  ) {
    const [activeBatch] = await db
      .select({ id: batches.id })
      .from(batches)
      .where(eq(batches.status, "active"))
      .orderBy(desc(batches.id))
      .limit(1);

    const targetBatch =
      activeBatch ||
      (
        await db
          .select({ id: batches.id })
          .from(batches)
          .orderBy(desc(batches.id))
          .limit(1)
      )[0];

    const availableMajors = await db.select({ id: majors.id, name: majors.majorName }).from(majors);
    const selectedMajor = String(payload?.appliedProgram?.interestedMajor || "").trim().toLowerCase();
    let matchingMajor = availableMajors.find((major) => {
      const name = major.name.toLowerCase();
      if (name === selectedMajor) return true;
      if (selectedMajor.includes("engineering") || selectedMajor.includes("cyber")) return name.includes("engineering");
      if (selectedMajor.includes("business")) return name.includes("business");
      if (selectedMajor.includes("science") || selectedMajor.includes("data")) return name.includes("science");
      if (selectedMajor.includes("architecture") || selectedMajor.includes("interior")) return name.includes("built environment");
      if (selectedMajor.includes("media") || selectedMajor.includes("educational")) return name.includes("humanities");
      return false;
    });

    if (!matchingMajor && availableMajors.length > 0) {
      matchingMajor = availableMajors[0];
    }

    if (!targetBatch || !matchingMajor) {
      throw new ValidationError("No active application batch or matching major was found");
    }

    payload = {
      ...payload,
      appliedProgram: {
        ...payload.appliedProgram,
        interestMajorId: matchingMajor.id,
        requestedTerm: payload.appliedProgram?.requestedAcademicTerm || payload.appliedProgram?.requestedTerm,
      },
      application: {
        batchId: targetBatch.id,
        isApplyForScholarShip: payload.appliedProgram?.isApplyingScholarship ?? payload.appliedProgram?.isApplyForScholarShip ?? false,
      },
    };

    // Validate the complete registration data
    const parsed = studentRegistrationSchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError({ issues: parsed.error.issues });
    }

    const data = parsed.data;

    // Check for duplicate email
    const existingStudentByEmail = await db
      .select()
      .from(students)
      .where(eq(students.email, data.student.email))
      .limit(1);

    let existingStudent = existingStudentByEmail[0];

    if (existingStudent) {
      const existingSubmittedApplication = await db
        .select({ id: applications.id, status: applications.status })
        .from(applications)
        .where(
          and(
            eq(applications.studentId, existingStudent.id),
            ne(applications.status, "incomplete")
          )
        )
        .limit(1);
      if (existingSubmittedApplication.length > 0) {
        return this.getById(existingStudent.id);
      }
    }

    // Check for duplicate phone number
    const existingStudentByPhone = await db
      .select()
      .from(students)
      .where(eq(students.phoneNumber, data.student.phoneNumber))
      .limit(1);

    if (existingStudentByPhone.length > 0) {
      if (!existingStudent || existingStudent.id !== existingStudentByPhone[0].id) {
        const otherStudentApp = await db
          .select({ id: applications.id })
          .from(applications)
          .where(
            and(
              eq(applications.studentId, existingStudentByPhone[0].id),
              ne(applications.status, "incomplete")
            )
          )
          .limit(1);
        if (otherStudentApp.length > 0) {
          throw new ConflictError(`Student with phone number ${data.student.phoneNumber} already exists`);
        }
        existingStudent = existingStudentByPhone[0];
      }
    }

    try {
      // Start transaction - create all records
      const result = await db.transaction(async (tx) => {
        // 0. Create attachment records for uploaded files
        let personalInfoAttachmentId: number | undefined;
        let applicationAttachmentId: number | undefined;
        let educationAttachmentIds: number[] = [];
        
        // Create attachments for personal documents (Birth Certificate, National ID, Passport)
        if (personalDocuments && personalDocuments.length > 0) {
          const personalDocAttachmentIds = await AttachmentService.createAttachments(
            personalDocuments,
            'personalInfo'
          );
          
          if (personalDocAttachmentIds.length > 0) {
            personalInfoAttachmentId = personalDocAttachmentIds[0]; // Use first attachment for personal info
          }
        }

        if (educationDocuments && educationDocuments.length > 0) {
          educationAttachmentIds = await AttachmentService.createAttachments(
            educationDocuments,
            "certificate"
          );
        }
        
        // Create attachment for payment proof
        if (paymentProof && paymentProof.length > 0) {
          const paymentProofAttachmentIds = await AttachmentService.createAttachments(
            paymentProof,
            'application_fee'
          );
          
          if (paymentProofAttachmentIds.length > 0) {
            applicationAttachmentId = paymentProofAttachmentIds[0]; // Use for application
          }
        }

        const grade12CertificateId = educationAttachmentIds[0] || personalInfoAttachmentId;
        const englishCertificateId = educationAttachmentIds[1] || grade12CertificateId;

        // File inputs are intentionally not persisted in browser drafts. Keep the
        // registration referentially valid when a draft is resumed without files.
        const createPlaceholderAttachment = async (type: string) => {
          const [attachment] = await tx
            .insert(attachments)
            .values({ type, fileUrl: "placeholder" })
            .returning({ id: attachments.id });
          if (!attachment) throw new InternalServerError("Failed to create document placeholder");
          return attachment.id;
        };

        personalInfoAttachmentId ??= await createPlaceholderAttachment("personalInfo");
        applicationAttachmentId ??= await createPlaceholderAttachment("application_fee");
        const resolvedGrade12CertificateId =
          grade12CertificateId ?? await createPlaceholderAttachment("certificate");
        const resolvedEnglishCertificateId =
          englishCertificateId ?? resolvedGrade12CertificateId;

        // 1. Create or update student record
        let targetStudent = existingStudent;
        if (!targetStudent) {
          const [createdStudent] = await tx
            .insert(students)
            .values({
              nameEn: data.student.nameEn,
              nameKh: data.student.nameKh,
              email: data.student.email,
              phoneNumber: data.student.phoneNumber,
              dateOfBirth: data.student.dateOfBirth,
              status: "active",
            })
            .returning();
          if (!createdStudent) {
            throw new InternalServerError("Failed to create student record");
          }
          targetStudent = createdStudent;
        } else {
          const [updatedStudent] = await tx
            .update(students)
            .set({
              nameEn: data.student.nameEn,
              nameKh: data.student.nameKh,
              phoneNumber: data.student.phoneNumber || targetStudent.phoneNumber,
              dateOfBirth: data.student.dateOfBirth || targetStudent.dateOfBirth,
            })
            .where(eq(students.id, targetStudent.id))
            .returning();
          targetStudent = updatedStudent;
        }

        // 2. Create or update application record
        const [existingIncompleteApp] = await tx
          .select()
          .from(applications)
          .where(
            and(
              eq(applications.studentId, targetStudent.id),
              eq(applications.batchId, data.application.batchId),
              eq(applications.status, "incomplete")
            )
          )
          .limit(1);

        let targetApplication;
        if (existingIncompleteApp) {
          const [updatedApp] = await tx
            .update(applications)
            .set({
              isApplyForScholarShip: data.application.isApplyForScholarShip,
              scholarshipPercentage: data.application.scholarshipPercentage,
              paymentStatus: paymentProof && paymentProof.length > 0 ? "completed" : "pending",
              status: "submitted",
              attachmentId: applicationAttachmentId,
            })
            .where(eq(applications.id, existingIncompleteApp.id))
            .returning();
          targetApplication = updatedApp;
        } else {
          const [createdApplication] = await tx
            .insert(applications)
            .values({
              studentId: targetStudent.id,
              batchId: data.application.batchId,
              isApplyForScholarShip: data.application.isApplyForScholarShip,
              scholarshipPercentage: data.application.scholarshipPercentage,
              paymentStatus: paymentProof && paymentProof.length > 0 ? "completed" : "pending",
              status: "submitted",
              attachmentId: applicationAttachmentId,
            })
            .returning();
          targetApplication = createdApplication;
        }

        if (!targetApplication) {
          throw new InternalServerError("Failed to create application record");
        }

        // 3. Create or update personal info record
        const [existingPersonalInfo] = await tx
          .select({ id: personalInfo.id })
          .from(personalInfo)
          .where(eq(personalInfo.studentId, targetStudent.id))
          .limit(1);

        let targetPersonalInfo;
        if (existingPersonalInfo) {
          const [updatedInfo] = await tx
            .update(personalInfo)
            .set({
              nationality: data.personalInfo.nationality,
              gender: data.personalInfo.gender,
              dob: data.personalInfo.dateOfBirth,
              placeOfBirth: data.personalInfo.placeOfBirth,
              address: data.personalInfo.address,
              attachmentId: personalInfoAttachmentId,
            })
            .where(eq(personalInfo.id, existingPersonalInfo.id))
            .returning();
          targetPersonalInfo = updatedInfo;
        } else {
          const [createdPersonalInfo] = await tx
            .insert(personalInfo)
            .values({
              studentId: targetStudent.id,
              nationality: data.personalInfo.nationality,
              gender: data.personalInfo.gender,
              dob: data.personalInfo.dateOfBirth,
              placeOfBirth: data.personalInfo.placeOfBirth,
              address: data.personalInfo.address,
              attachmentId: personalInfoAttachmentId,
            })
            .returning();
          targetPersonalInfo = createdPersonalInfo;
        }

        if (!targetPersonalInfo) {
          throw new InternalServerError("Failed to create personal info record");
        }

        // 4. Create or update parent/guardian info record
        const [existingParentInfo] = await tx
          .select({ id: parentGuardianInfos.id })
          .from(parentGuardianInfos)
          .where(eq(parentGuardianInfos.studentId, targetStudent.id))
          .limit(1);

        let targetParentInfo;
        if (existingParentInfo) {
          const [updatedParent] = await tx
            .update(parentGuardianInfos)
            .set({
              name: data.parentGuardianInfo.name,
              relationship: data.parentGuardianInfo.relationship,
              nationality: data.parentGuardianInfo.nationality,
              address: data.parentGuardianInfo.address,
              job: data.parentGuardianInfo.jobPosition,
              phoneNumber: data.parentGuardianInfo.phoneNumber,
            })
            .where(eq(parentGuardianInfos.id, existingParentInfo.id))
            .returning();
          targetParentInfo = updatedParent;
        } else {
          const [createdParentGuardianInfo] = await tx
            .insert(parentGuardianInfos)
            .values({
              studentId: targetStudent.id,
              name: data.parentGuardianInfo.name,
              relationship: data.parentGuardianInfo.relationship,
              nationality: data.parentGuardianInfo.nationality,
              address: data.parentGuardianInfo.address,
              job: data.parentGuardianInfo.jobPosition,
              phoneNumber: data.parentGuardianInfo.phoneNumber,
            })
            .returning();
          targetParentInfo = createdParentGuardianInfo;
        }

        if (!targetParentInfo) {
          throw new InternalServerError("Failed to create parent/guardian info record");
        }

        // 5. Create or update education background record
        const [existingEdu] = await tx
          .select({ id: educationBackground.id })
          .from(educationBackground)
          .where(eq(educationBackground.appId, targetApplication.id))
          .limit(1);

        const eduValues = {
          appId: targetApplication.id,
          educationLevel: data.educationBackground.currentEducationLevel === "university"
            ? ("bachelor_degree" as const)
            : ("high_school" as const),
          major: data.educationBackground.major,
          institutionName: data.educationBackground.institutionName || data.educationBackground.highSchoolName,
          currentYear: data.educationBackground.yearOfStudy,
          academicYear: data.educationBackground.academicYear,
          highSchoolName: data.educationBackground.highSchoolName,
          schoolLocation: [
            data.educationBackground.schoolCity,
            data.educationBackground.schoolCountry,
          ].filter(Boolean).join(", ") || "Not provided",
          overallGrade: data.educationBackground.overallGrade,
          mathGrade: data.educationBackground.mathGrade,
          englishGrade: data.educationBackground.englishGrade,
          hasEnglishCertificate: data.educationBackground.hasEnglishCertificate,
          grade12CertificateId: resolvedGrade12CertificateId,
          englishCertificateId: resolvedEnglishCertificateId,
        };

        let targetEdu;
        if (existingEdu) {
          const [updatedEdu] = await tx
            .update(educationBackground)
            .set(eduValues)
            .where(eq(educationBackground.id, existingEdu.id))
            .returning();
          targetEdu = updatedEdu;
        } else {
          const [createdEducationBackground] = await tx
            .insert(educationBackground)
            .values(eduValues)
            .returning();
          targetEdu = createdEducationBackground;
        }

        if (!targetEdu) {
          throw new InternalServerError("Failed to create education background record");
        }

        // 6. Create or update applied program record
        const [existingProgram] = await tx
          .select({ id: appliedPrograms.id })
          .from(appliedPrograms)
          .where(eq(appliedPrograms.appId, targetApplication.id))
          .limit(1);

        const programValues = {
          appId: targetApplication.id,
          interestMajorId: data.appliedProgram.interestMajorId,
          isApplyingScholarship: data.appliedProgram.isApplyingScholarship,
          requestedTerm: data.appliedProgram.requestedTerm,
          considerNextIntake: data.appliedProgram.considerNextIntake,
          referralSource: data.appliedProgram.referralSource,
        };

        let targetProgram;
        if (existingProgram) {
          const [updatedProgram] = await tx
            .update(appliedPrograms)
            .set(programValues)
            .where(eq(appliedPrograms.id, existingProgram.id))
            .returning();
          targetProgram = updatedProgram;
        } else {
          const [createdAppliedProgram] = await tx
            .insert(appliedPrograms)
            .values(programValues)
            .returning();
          targetProgram = createdAppliedProgram;
        }

        if (!targetProgram) {
          throw new InternalServerError("Failed to create applied program record");
        }

        // Return complete registration data
        return {
          student: targetStudent,
          application: targetApplication,
          personalInfo: targetPersonalInfo,
          parentGuardianInfo: targetParentInfo,
          educationBackground: targetEdu,
          appliedProgram: targetProgram,
        };
      });

      return result;
    } catch (error) {
      // If it's already one of our custom errors, rethrow it
      if (error instanceof ValidationError || 
          error instanceof ConflictError || 
          error instanceof InternalServerError) {
        throw error;
      }
      
      // Otherwise, wrap it in an InternalServerError
      throw new InternalServerError(
        `Failed to create student registration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get complete student registration details by student ID
   */
  static async getById(studentId: number) {
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (!student) {
      throw new ValidationError("Student not found");
    }

    // Get related data
    const [personalInfoData] = await db
      .select()
      .from(personalInfo)
      .where(eq(personalInfo.studentId, studentId))
      .limit(1);

    const [parentGuardianInfoData] = await db
      .select()
      .from(parentGuardianInfos)
      .where(eq(parentGuardianInfos.studentId, studentId))
      .limit(1);

    const applicationsData = await db
      .select()
      .from(applications)
      .where(eq(applications.studentId, studentId));

    // Get education background and applied programs for each application
    const applicationsWithDetails = await Promise.all(
      applicationsData.map(async (app) => {
        const [eduBackground] = await db
          .select()
          .from(educationBackground)
          .where(eq(educationBackground.appId, app.id))
          .limit(1);

        const [appliedProgramData] = await db
          .select()
          .from(appliedPrograms)
          .where(eq(appliedPrograms.appId, app.id))
          .limit(1);

        return {
          ...app,
          educationBackground: eduBackground,
          appliedProgram: appliedProgramData,
        };
      })
    );

    return {
      student,
      personalInfo: personalInfoData,
      parentGuardianInfo: parentGuardianInfoData,
      applications: applicationsWithDetails,
    };
  }
}
