import { db } from "../../db";
import { users } from "../../db/schema/user";
import { students } from "../../db/schema/student";
import { admins } from "../../db/schema/admin";
import { committees } from "../../db/schema/committee";
import { faculties } from "../../db/schema/faculty";
import { department as departments } from "../../db/schema/department";
import { batches } from "../../db/schema/batch";
import { subjects } from "../../db/schema/subject";
import { majors } from "../../db/schema/major";
import { examSessions } from "../../db/schema/exam-session";
import { examSessionCommittees } from "../../db/schema/exam-session-committee";
import { attachments } from "../../db/schema/attachment";
import { personalInfo } from "../../db/schema/personal-info";
import { parentGuardianInfos } from "../../db/schema/parent-guardian-info";
import { applications } from "../../db/schema/application";
import { appliedPrograms } from "../../db/schema/applied-program";
import { educationBackground } from "../../db/schema/education-background";
import { exams } from "../../db/schema/exam";
import { interviewCriterias } from "../../db/schema/interview-criteria";
import { interviewSelection } from "../../db/schema/interview-selection";
import { interviewScores } from "../../db/schema/interview-score";
import { emailTemplates } from "../../db/schema/email-template";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { CAMBODIA_PROVINCES } from "../../utils/cambodia-provinces";
import {
  generateCambodianName,
  generateCambodianEmail,
  generateCambodianParentName,
} from "../../utils/cambodia-names";

const CAMBODIAN_HIGH_SCHOOLS = [
  "Preah Sisowath High School",
  "Bak Touk High School",
  "Indradevi High School",
  "Chea Sim Santhormok High School",
  "Toul Tom Poung High School",
  "Hun Sen Bun Rany Wat Phnom High School",
  "Preah Yukunthor High School",
  "Boeung Keng Kang High School",
  "Chbar Ampov High School",
  "Angkor High School",
  "Hun Sen Siem Reap High School",
  "Battambang High School",
  "Preah Monivong High School",
  "Kampong Cham High School",
  "Hun Sen Skun High School",
  "Prey Veng High School",
  "Takeo High School",
  "Kampot High School",
  "Preah Sihanouk High School",
  "Kandal Stung High School",
  "Svay Rieng High School",
  "Kratie High School",
];

async function seed() {
  console.log("🌱 Starting seed...");

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 1. Base Infrastructure
  console.log("Step 1: Faculties, Departments, Batches, Subjects, Criteria...");

  // Check & Insert Faculties
  let insertedFaculties = await db.select().from(faculties);
  if (insertedFaculties.length === 0) {
    insertedFaculties = await db
      .insert(faculties)
      .values([
        { facultyName: "Engineering" },
        { facultyName: "Business" },
        { facultyName: "Art & Humanities" },
        { facultyName: "Applied Science" },
        { facultyName: "Built Environment" },
      ])
      .returning();
  }

  // Check & Insert Departments
  let insertedDepts = await db.select().from(departments);
  if (insertedDepts.length === 0) {
    insertedDepts = await db
      .insert(departments)
      .values([
        { departmentName: "Software Engineering" },
        { departmentName: "Cyber Security" },
        { departmentName: "Management" },
        { departmentName: "Architecture" },
      ])
      .returning();
  }

  // Check & Insert Batches
  let insertedBatches = await db.select().from(batches);
  if (insertedBatches.length === 0) {
    insertedBatches = await db
      .insert(batches)
      .values([
        {
          batchName: "Fall 2026 Batch",
          startDate: new Date("2026-09-01"),
          endDate: new Date("2026-12-31"),
          status: "active",
        },
        {
          batchName: "Spring 2026 Batch",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-05-31"),
          status: "closed",
        },
      ])
      .returning();
  }

  // Check & Insert Subjects
  let insertedSubjects = await db.select().from(subjects);
  if (insertedSubjects.length === 0) {
    insertedSubjects = await db
      .insert(subjects)
      .values([
        { subjectName: "Mathematics", weight: 1 },
        { subjectName: "English", weight: 1 },
        { subjectName: "Interview", weight: 1.5 },
      ])
      .returning();
  }

  // Check & Insert Interviews Logic
  let insertedCriteria = await db.select().from(interviewCriterias);
  if (insertedCriteria.length === 0) {
    insertedCriteria = await db
      .insert(interviewCriterias)
      .values([
        { name: "Communication Skills", weight: 30 },
        { name: "Technical Knowledge", weight: 40 },
        { name: "Problem Solving", weight: 30 },
      ])
      .returning();
  }

  // Email Templates (upsert or skip)
  const existingTemplates = await db.select().from(emailTemplates);
  if (existingTemplates.length === 0) {
    await db
      .insert(emailTemplates)
      .values([
        {
          name: "Shortlist Announcement",
          variable: [
            "applicantName",
            "interviewExamDate",
            "interviewStartTime",
            "interviewRoom",
          ],
        },
        {
          name: "Acceptance Letter",
          variable: ["applicantName", "major", "scholarshipPercentage"],
        },
      ])
      .returning();
  }

  // 2. Users (Admin, Committee)
  console.log("Step 2: Admin and Committee users...");

  let [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, "admin@scholarpro.site"))
    .limit(1);

  if (!adminUser) {
    [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@scholarpro.site",
        password: hashedPassword,
        role: "admin",
        provider: "local",
      })
      .returning();

    await db.insert(admins).values({
      userId: adminUser.id,
      name: "System Administrator",
    });
  }

  const committeeUsers: any[] = [];
  for (let i = 0; i < 3; i++) {
    const email = `committee${i + 1}@scholarpro.site`;

    let [u] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!u) {
      [u] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role: "committee",
          provider: "local",
        })
        .returning();

      const committeeNames = [
        "Dr. Sovann Chea",
        "Prof. Vannak Heng",
        "Dr. Bopha Meas",
      ];

      await db
        .insert(committees)
        .values({
          userId: u.id,
          name: committeeNames[i % committeeNames.length],
          departmentId: insertedDepts[i % insertedDepts.length].id,
        })
        .returning();
    }

    // Need to fetch the committee record if it existed or was created
    const [c] = await db
      .select()
      .from(committees)
      .where(eq(committees.userId, u.id))
      .limit(1);
    if (c) committeeUsers.push(c);
  }

  // 3. Academic Framework (Majors, Exam Sessions)
  console.log("Step 3: Majors and Exam Sessions...");

  let insertedMajors = await db.select().from(majors);
  if (insertedMajors.length === 0) {
    insertedMajors = await db
      .insert(majors)
      .values(
        insertedFaculties.flatMap((f) => [
          {
            majorName: `${f.facultyName} Major A`,
            facultyId: f.id,
            tuitionFee: "5000",
          },
          {
            majorName: `${f.facultyName} Major B`,
            facultyId: f.id,
            tuitionFee: "4500",
          },
        ]),
      )
      .returning();
  }

  let insertedSessions = await db.select().from(examSessions);
  if (insertedSessions.length === 0) {
    insertedSessions = await db
      .insert(examSessions)
      .values(
        insertedBatches.flatMap((b) =>
          insertedSubjects.map((s) => ({
            batchId: b.id,
            subjectId: s.id,
            facultyId: insertedFaculties[0].id,
            sessionName: `${s.subjectName} Session - ${b.batchName}`,
            examDate: faker.date.future(),
            startTime: faker.date.future(),
            endTime: faker.date.future(),
            location: `Hall ${faker.number.int({ min: 1, max: 10 })}`,
            capacity: 50,
            status: "scheduled" as const,
          })),
        ),
      )
      .returning();

    // Link committees to interview sessions (subjectId 3)
    const interviewSessions = insertedSessions.filter((s) => s.subjectId === 3);
    await db.insert(examSessionCommittees).values(
      interviewSessions.flatMap((s) =>
        committeeUsers.map((c) => ({
          examSessionId: s.id,
          committeeId: c.id,
        })),
      ),
    );
  }

  // 4. Students Lifecycle & Applications (Stress test: 500 students)
  console.log("Step 4: Generating 500 Students, Profiles, and Applications...");

  const PRIORITY_APPLICANTS = [
    {
      nameEn: "Nut Sannara",
      nameKh: "ណុត សាន់ណារ៉ា",
      email: "narahcs2004@gmail.com",
      gender: "male" as const,
      surnameEn: "Nut",
    },
    {
      nameEn: "Virak Rangsey",
      nameKh: "វីរៈ រង្សី",
      email: "rv6024010101@camtech.edu.kh",
      gender: "male" as const,
      surnameEn: "Virak",
    },
    {
      nameEn: "Kaem Neath",
      nameKh: "កែម នាត",
      email: "sk6024010075@camtech.edu.kh",
      gender: "female" as const,
      surnameEn: "Kaem",
    },
  ];

  for (let i = 0; i < 500; i++) {
    const priority = i < PRIORITY_APPLICANTS.length ? PRIORITY_APPLICANTS[i] : null;
    const gender = priority
      ? priority.gender
      : faker.helpers.arrayElement(["male", "female"] as const);
    const cambodianName = priority
      ? {
          nameEn: priority.nameEn,
          nameKh: priority.nameKh,
          surnameEn: priority.surnameEn,
          surnameKh: "",
          givenNameEn: priority.nameEn.split(" ")[1] || priority.nameEn,
          givenNameKh: "",
        }
      : generateCambodianName(gender, i);
    const email = priority
      ? priority.email
      : generateCambodianEmail(
          cambodianName.givenNameEn,
          cambodianName.surnameEn,
          i + 1
        );

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      console.log(`Skipping existing seeded user: ${email}`);
      continue;
    }
    const [u] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role: "student",
        provider: "local",
      })
      .returning();

    const [student] = await db
      .insert(students)
      .values({
        userId: u.id,
        nameEn: cambodianName.nameEn,
        nameKh: cambodianName.nameKh,
        email: u.email,
        phoneNumber: faker.helpers.fromRegExp(/0[1-9][0-9]{7,8}/),
        dateOfBirth: faker.date.birthdate(),
        status: "active",
      })
      .returning();

    const [attachment] = await db
      .insert(attachments)
      .values({
        type: "personalInfo",
        fileUrl: faker.image.url(),
      })
      .returning();

    const studentProvince = faker.helpers.arrayElement(CAMBODIA_PROVINCES);
    const studentSchool = faker.helpers.arrayElement(CAMBODIAN_HIGH_SCHOOLS);

    await db.insert(personalInfo).values({
      studentId: student.id,
      nationality: "Cambodian",
      gender,
      dob: student.dateOfBirth!,
      placeOfBirth: studentProvince,
      address: `St. ${faker.number.int({ min: 1, max: 999 })}, ${studentProvince}`,
      attachmentId: attachment.id,
    });

    const parentRelationship = faker.helpers.arrayElement(["Father", "Mother"]);
    const parentName = generateCambodianParentName(
      cambodianName.surnameEn,
      parentRelationship,
      i
    );

    await db.insert(parentGuardianInfos).values({
      studentId: student.id,
      name: parentName,
      relationship: parentRelationship,
      nationality: "Cambodian",
      address: `St. ${faker.number.int({ min: 1, max: 999 })}, ${studentProvince}`,
      job: faker.person.jobTitle(),
      phoneNumber: faker.helpers.fromRegExp(/0[1-9][0-9]{7,8}/),
    });

    // Create Application
    const targetBatch =
      insertedBatches.find((b) => b.batchName === "Fall 2026 Batch") ||
      insertedBatches[0];

    const [app] = await db
      .insert(applications)
      .values({
        studentId: student.id,
        batchId: targetBatch.id,
        status: faker.helpers.arrayElement([
          "submitted",
          "shortlisted",
          "accepted",
          "graded",
        ]),
        attachmentId: attachment.id,
        isApplyForScholarShip: true,
        scholarshipPercentage: faker.number.int({ min: 10, max: 100 }),
      })
      .returning();

    const major = faker.helpers.arrayElement(insertedMajors);
    await db.insert(appliedPrograms).values({
      appId: app.id,
      interestMajorId: major.id,
      isApplyingScholarship: true,
      considerNextIntake: true,
    });

    await db.insert(educationBackground).values({
      appId: app.id,
      educationLevel: "high_school",
      institutionName: studentSchool,
      academicYear: "2024-2025",
      highSchoolName: studentSchool,
      schoolLocation: studentProvince,
      overallGrade: faker.helpers.arrayElement(["A", "B", "C"]),
      mathGrade: faker.helpers.arrayElement(["A", "B", "C"]),
      englishGrade: faker.helpers.arrayElement(["A", "B", "C"]),
      grade12CertificateId: attachment.id,
      hasEnglishCertificate: "no",
      englishCertificateId: attachment.id,
    });

    // 5. Evaluation Flow (Exams)
    // Create exams for the application in the active batch
    const batchSessions = insertedSessions.filter(
      (s) => s.batchId === targetBatch.id,
    );
    const appExams = await Promise.all(
      batchSessions.map(async (s) => {
        const [exam] = await db
          .insert(exams)
          .values({
            appId: app.id,
            examSessionId: s.id,
            status: "scheduled",
            totalScore: faker.number.int({ min: 50, max: 100 }).toString(),
          })
          .returning();
        return { exam, session: s };
      }),
    );

    // If it's an interview exam, add score
    const interviewExam = appExams.find((e) => e.session.subjectId === 3);
    if (interviewExam) {
      await db.insert(interviewSelection).values({
        examId: interviewExam.exam.id,
        slotStart: new Date(new Date().setHours(9, 0, 0, 0)),
        slotEnd: new Date(new Date().setHours(9, 30, 0, 0)),
      });

      await db.insert(interviewScores).values(
        insertedCriteria.map((c) => ({
          examId: interviewExam.exam.id,
          criteriaId: c.id,
          committeeId: committeeUsers[0].id,
          score: faker.number.int({ min: 1, max: 10 }),
        })),
      );
    }
  }

  console.log("✅ Seeding complete!");
  console.log("---------------------------------------------------------");
  console.log("🔑 Admin Login:");
  console.log("   Email: admin@scholarpro.site");
  console.log("   Password: Password123!");
  console.log("---------------------------------------------------------");
  console.log("🎓 Student Login (Example):");
  console.log("   Email: <check users table or use created student email>");
  console.log("   Password: Password123!");
  console.log("---------------------------------------------------------");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
