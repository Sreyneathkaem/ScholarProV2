import { db } from '../../db';
import { applications } from '../../db/schema/application';
import { students } from '../../db/schema/student';
import { appliedPrograms } from '../../db/schema/applied-program';
import { personalInfo } from '../../db/schema/personal-info';
import { majors } from '../../db/schema/major';
import { eq, and, count, desc, gte, sql } from 'drizzle-orm';

export const getDashboardStatistics = async (batchId?: number) => {
    // Helper to build where clause
    const buildWhereClause = (baseCondition?: any) => {
        const conditions = [];
        if (batchId) conditions.push(eq(applications.batchId, batchId));
        if (baseCondition) conditions.push(baseCondition);
        return conditions.length > 0 ? and(...conditions) : baseCondition;
    };

    // 1. Dashboard Overview
    // Total Applicants
    const [totalApplicantsResult] = await db
        .select({ count: count() })
        .from(applications)
        .where(buildWhereClause());
    
    const totalApplicants = totalApplicantsResult?.count || 0;

    // New Applications (e.g., created in the last 30 days or current month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [newApplicationsResult] = await db
        .select({ count: count() })
        .from(applications)
        .where(buildWhereClause(gte(applications.createdAt, startOfMonth)));
    
    const newApplications = newApplicationsResult?.count || 0;

    // Accepted Students
    const [acceptedResult] = await db
        .select({ count: count() })
        .from(applications)
        .where(buildWhereClause(eq(applications.status, 'accepted')));
    
    const acceptedStudents = acceptedResult?.count || 0;
    const acceptanceRate = totalApplicants > 0 ? ((acceptedStudents / totalApplicants) * 100).toFixed(2) : 0;

    // 2. Gender Distribution
    const genderDistribution = await db
        .select({
            gender: personalInfo.gender,
            count: count(),
        })
        .from(applications)
        .innerJoin(students, eq(applications.studentId, students.id))
        .innerJoin(personalInfo, eq(students.id, personalInfo.studentId))
        .where(buildWhereClause())
        .groupBy(personalInfo.gender);

    // Calculate Female Ratio
    const femaleCount = genderDistribution.find(g => g.gender === 'female')?.count || 0;
    const maleCount = genderDistribution.find(g => g.gender === 'male')?.count || 0;
    const totalGenderCount = femaleCount + maleCount;
    const femaleRatio = totalGenderCount > 0 ? ((femaleCount / totalGenderCount) * 100).toFixed(2) : 0;

    // 3. Most Popular Majors
    const popularMajors = await db
        .select({
            major: majors.majorName,
            count: count(),
        })
        .from(applications)
        .innerJoin(appliedPrograms, eq(applications.id, appliedPrograms.appId))
        .innerJoin(majors, eq(appliedPrograms.interestMajorId, majors.id))
        .where(buildWhereClause())
        .groupBy(majors.majorName)
        .orderBy(desc(count()))
        .limit(5);

    // 4. Students by Province
    const studentsByProvince = await db
        .select({
            province: personalInfo.placeOfBirth, 
            count: count(),
        })
        .from(applications)
        .innerJoin(students, eq(applications.studentId, students.id))
        .innerJoin(personalInfo, eq(students.id, personalInfo.studentId))
        .where(buildWhereClause(sql`${personalInfo.placeOfBirth} IS NOT NULL AND ${personalInfo.placeOfBirth} != ''`))
        .groupBy(personalInfo.placeOfBirth)
        .orderBy(desc(count()));

    return {
        overview: {
            totalApplicants,
            newApplications,
            acceptedStudents,
            acceptanceRate,
            femaleRatio,
            genderDistribution
        },
        charts: {
            popularMajors,
            studentsByProvince
        }
    };
};    