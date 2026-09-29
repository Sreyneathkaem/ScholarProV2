import { db } from "../db";
import { students } from "../db/schema/student";
import { users } from "../db/schema/user";
import { personalInfo } from "../db/schema/personal-info";
import { parentGuardianInfos } from "../db/schema/parent-guardian-info";
import { committees } from "../db/schema/committee";
import {
  generateCambodianName,
  generateCambodianEmail,
  generateCambodianParentName,
} from "../utils/cambodia-names";
import { eq, asc } from "drizzle-orm";

async function updateApplicantsToCambodianNames() {
  console.log("🇰🇭 Starting migration to authentic Cambodian names for all applicant data...\n");

  console.log("Step 1: Updating committee member names...");
  const allCommittees = await db.select().from(committees);
  const committeeCambodianNames = [
    "Dr. Sovann Chea",
    "Prof. Vannak Heng",
    "Dr. Bopha Meas",
    "Dr. Piseth Sok",
    "Prof. Channary Lim",
  ];

  for (let i = 0; i < allCommittees.length; i++) {
    const c = allCommittees[i];
    const newName = committeeCambodianNames[i % committeeCambodianNames.length];
    await db
      .update(committees)
      .set({ name: newName })
      .where(eq(committees.id, c.id));
    console.log(`  Updated committee ${c.name} -> ${newName}`);
  }

  // 2. Fetch all students
  console.log("\nStep 2: Fetching students and profile details...");
  const allStudents = await db.select().from(students).orderBy(asc(students.id));
  console.log(`Total students to update: ${allStudents.length}`);

  // Fetch personal info to get gender
  const allPersonalInfo = await db.select().from(personalInfo);
  const genderMap = new Map<number, "male" | "female">();
  for (const p of allPersonalInfo) {
    if (p.gender === "female" || p.gender === "male") {
      genderMap.set(p.studentId, p.gender);
    }
  }

  // Fetch parent info to update
  const allParents = await db.select().from(parentGuardianInfos);
  const parentMap = new Map<number, typeof allParents[0]>();
  for (const pr of allParents) {
    parentMap.set(pr.studentId, pr);
  }

  console.log(`\nStep 3: Updating ${allStudents.length} applicants in batches...`);
  const BATCH_SIZE = 100;
  let updatedCount = 0;

  const PRIORITY_APPLICANTS: Record<
    number,
    {
      nameEn: string;
      nameKh: string;
      email: string;
      gender: "male" | "female";
      parentName: string;
    }
  > = {
    1: {
      nameEn: "Nut Sannara",
      nameKh: "ណុត សាន់ណារ៉ា",
      email: "narahcs2004@gmail.com",
      gender: "male",
      parentName: "Nut Chamroeun",
    },
    2: {
      nameEn: "Virak Rangsey",
      nameKh: "វីរៈ រង្សី",
      email: "rv6024010101@camtech.edu.kh",
      gender: "male",
      parentName: "Virak Dara",
    },
    3: {
      nameEn: "Kaem Neath",
      nameKh: "កែម នាត",
      email: "sk6024010075@camtech.edu.kh",
      gender: "female",
      parentName: "Kaem Sovann",
    },
  };

  for (let i = 0; i < allStudents.length; i += BATCH_SIZE) {
    const batch = allStudents.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (student, idx) => {
        const globalIdx = i + idx;
        const priority = PRIORITY_APPLICANTS[student.id];
        const gender = priority
          ? priority.gender
          : genderMap.get(student.id) || (globalIdx % 2 === 0 ? "male" : "female");
        const cambodianName = priority
          ? {
              nameEn: priority.nameEn,
              nameKh: priority.nameKh,
              surnameEn: priority.nameEn.split(" ")[0],
              surnameKh: "",
              givenNameEn: priority.nameEn.split(" ")[1] || priority.nameEn,
              givenNameKh: "",
            }
          : generateCambodianName(gender, globalIdx);
        const newEmail = priority
          ? priority.email
          : generateCambodianEmail(
              cambodianName.givenNameEn,
              cambodianName.surnameEn,
              student.id
            );

        // Update student record
        await db
          .update(students)
          .set({
            nameEn: cambodianName.nameEn,
            nameKh: cambodianName.nameKh,
            email: newEmail,
          })
          .where(eq(students.id, student.id));

        // Update linked user record if exists
        if (student.userId) {
          await db
            .update(users)
            .set({
              email: newEmail,
            })
            .where(eq(users.id, student.userId));
        }

        // Update parent guardian record if exists
        const parent = parentMap.get(student.id);
        if (parent) {
          const parentName = generateCambodianParentName(
            cambodianName.surnameEn,
            parent.relationship,
            globalIdx
          );
          await db
            .update(parentGuardianInfos)
            .set({
              name: parentName,
              nationality: "Cambodian",
            })
            .where(eq(parentGuardianInfos.id, parent.id));
        }
      })
    );

    updatedCount += batch.length;
    if (updatedCount % 500 === 0 || updatedCount === allStudents.length) {
      console.log(`  Updated ${updatedCount}/${allStudents.length} applicants...`);
    }
  }

  console.log("\n✅ Successfully updated all applicant data to authentic Cambodian names in English and Khmer!");
  console.log("Sample updated records:");
  const samples = await db.select().from(students).limit(5);
  for (const s of samples) {
    console.log(`  - [ID: ${s.id}] English: "${s.nameEn}" | Khmer: "${s.nameKh}" | Email: ${s.email}`);
  }

  process.exit(0);
}

updateApplicantsToCambodianNames().catch((err) => {
  console.error("❌ Update failed:", err);
  process.exit(1);
});
