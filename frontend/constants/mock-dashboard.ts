export const dashboardStats = {
  newApplications: 168,
  totalApplicants: 1125,
  gender: { female: 599, male: 526, total: 1125 },
  majors: [
    { major: "Business Intelligence", count: 320 },
    { major: "Software ", count: 280 },
    { major: "Data Science & AI", count: 240 },
    { major: "Cybersecurity", count: 170 },
    { major: "Cloud ", count: 95 },
    { major: "Network Engineering", count: 20 },
    { major: "Other", count: 0 },
  ],
};

import { CAMBODIA_PROVINCES } from "./provinces";

export const dashboardProvinceData = CAMBODIA_PROVINCES.map((province) => ({
  province,
}));
