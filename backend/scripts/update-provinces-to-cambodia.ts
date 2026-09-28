import { db } from "../db";
import { personalInfo } from "../db/schema/personal-info";
import { educationBackground } from "../db/schema/education-background";
import { parentGuardianInfos } from "../db/schema/parent-guardian-info";
import { CAMBODIA_PROVINCES } from "../utils/cambodia-provinces";
import { eq, sql } from "drizzle-orm";

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

// Weighted distribution for realistic Cambodian demographics (Phnom Penh, Kandal, Siem Reap, Battambang, etc.)
const WEIGHTED_PROVINCES: string[] = [
  "Phnom Penh", "Phnom Penh", "Phnom Penh", "Phnom Penh",
  "Kandal", "Kandal", "Kandal",
  "Siem Reap", "Siem Reap", "Siem Reap",
  "Battambang", "Battambang", "Battambang",
  "Kampong Cham", "Kampong Cham",
  "Prey Veng", "Prey Veng",
  "Takeo", "Takeo",
  "Kampot",
  "Preah Sihanouk",
  "Kampong Speu",
  "Kampong Thom",
  "Banteay Meanchey",
  "Kampong Chhnang",
  "Svay Rieng",
  "Pursat",
  "Tboung Khmum",
  "Kratie",
  "Koh Kong",
  "Kep",
  "Pailin",
  "Preah Vihear",
  "Oddar Meanchey",
  "Stung Treng",
  "Ratanakiri",
  "Mondulkiri"
];

async function updateToCambodiaProvinces() {
  console.log("🇰🇭 Updating all database records to Cambodia provinces and cities...");

  const allPersonalInfo = await db.select().from(personalInfo);
  console.log(`Found ${allPersonalInfo.length} personal info records to update.`);

  for (let i = 0; i < allPersonalInfo.length; i++) {
    const item = allPersonalInfo[i];
    const province = WEIGHTED_PROVINCES[i % WEIGHTED_PROVINCES.length];
    const streetNum = ((i * 17 + 23) % 900) + 10;
    const cambodianAddress = `St. ${streetNum}, ${province}`;

    await db
      .update(personalInfo)
      .set({
        placeOfBirth: province,
        address: cambodianAddress,
        nationality: "Cambodian",
      })
      .where(eq(personalInfo.id, item.id));

    // Update parent guardian info if exists
    await db
      .update(parentGuardianInfos)
      .set({
        address: cambodianAddress,
        nationality: "Cambodian",
      })
      .where(eq(parentGuardianInfos.studentId, item.studentId));
  }

  const allEdu = await db.select().from(educationBackground);
  console.log(`Found ${allEdu.length} education background records to update.`);

  for (let i = 0; i < allEdu.length; i++) {
    const edu = allEdu[i];
    const province = WEIGHTED_PROVINCES[i % WEIGHTED_PROVINCES.length];
    const school = CAMBODIAN_HIGH_SCHOOLS[i % CAMBODIAN_HIGH_SCHOOLS.length];

    await db
      .update(educationBackground)
      .set({
        schoolLocation: province,
        highSchoolName: school,
        institutionName: school,
      })
      .where(eq(educationBackground.id, edu.id));
  }

  console.log("✅ Successfully updated all database records to authentic Cambodian provinces and schools!");
  process.exit(0);
}

updateToCambodiaProvinces().catch((err) => {
  console.error("❌ Update failed:", err);
  process.exit(1);
});
