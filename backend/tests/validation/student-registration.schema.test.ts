import { studentRegistrationSchema } from "@validation/student-registration.schema";

describe("studentRegistrationSchema", () => {
  it("accepts phone numbers with common separators and country code", () => {
    const payload = {
      student: {
        nameEn: "John Smith",
        nameKh: "ចាន ស៊ីម",
        email: "john@example.com",
        phoneNumber: "+855.12.345.678",
        dateOfBirth: "1998-05-12",
      },
      personalInfo: {
        nameKh: "ចាន ស៊ីម",
        nameEn: "John Smith",
        nationality: "Cambodian",
        gender: "male",
        dateOfBirth: "1998-05-12",
        placeOfBirth: "Phnom Penh",
        address: "123 Main Street",
        country: "Cambodia",
        phoneNumber: "+855 12 345 678",
        email: "john@example.com",
      },
      parentGuardianInfo: {
        name: "Mary Smith",
        relationship: "Mother",
        nationality: "Cambodian",
        address: "123 Main Street",
        jobPosition: "Teacher",
        phoneNumber: "012-345-678",
      },
      educationBackground: {
        currentEducationLevel: "high_school_graduate",
        academicYear: "2024",
        highSchoolName: "ABC High School",
        overallGrade: "A",
        mathGrade: "B",
        englishGrade: "A",
        hasEnglishCertificate: "no",
      },
      appliedProgram: {
        interestMajorId: 1,
        isApplyingScholarship: false,
        requestedTerm: "2025-01-01",
        considerNextIntake: true,
        referralSource: "Friend",
      },
      application: {
        batchId: 1,
        isApplyForScholarShip: false,
        scholarshipPercentage: 50,
      },
    };

    expect(studentRegistrationSchema.safeParse(payload).success).toBe(true);
  });
});
