//studentDetail page

"use client";

import * as React from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ChevronRight } from "lucide-react";
import { useHeader } from "@/components/header/header-context";
import { useAuth } from "@/lib/context/auth-context";
import { EvaluationForm } from "@/components/evaluation-form";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { useApplicantData } from "../../../../hooks/useApplicantData";
import { PersonalInformation } from "../../../../components/applicants/PersonalInformation";
import { ParentGuardianInfo } from "../../../../components/applicants/ParentGuardianInfo";
import { EducationalBackground } from "../../../../components/applicants/EducationalBackground";
import { AppliedProgram } from "../../../../components/applicants/AppliedProgram";
import { ResultSection } from "../../../../components/applicants/ResultSection";
import { AdminPanel } from "../../../../components/applicants/AdminPanel";
import { DocumentsSection } from "../../../../components/applicants/document";
import type { StudentDisplay } from "../../../../types";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString || "";
  }
};
// Safe date formatter
const safeFormatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "-";
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return "-";
    return dateObj.toISOString().split("T")[0];
  } catch {
    return "-";
  }
};

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { setTitle } = useHeader();
  const { user } = useAuth();
  const [status, setStatus] = React.useState("Submitted");
  const [paymentStatus, setPaymentStatus] = React.useState("Pending");
  const [notes, setNotes] = React.useState("");
  const [englishExamStatus, setEnglishExamStatus] = React.useState("Require");
  const [mathExamStatus, setMathExamStatus] = React.useState("Require");
  const [scholarshipStatus, setScholarshipStatus] = React.useState("Pending");
  const [scholarshipPercentage, setScholarshipPercentage] = React.useState("0");

  // Get user role from auth context
  const userRole = (user?.role as "admin" | "committee") || "committee";

  const { studentData, isLoading } = useApplicantData(params.id as string);
  const searchParams = useSearchParams();
  const examId = searchParams?.get("examId") ?? undefined;

  React.useEffect(() => {
    setTitle("Applicant");

    if (studentData) {
      // Load existing status
      const statusMap: Record<string, string> = {
        "new-applicant": "Under Review",
        submitted: "Under Review",
        shortlisted: "Shortlisted",
        awarded: "Awarded",
        rejected: "Rejected",
      };

      if (studentData.awardAmount) {
        const pct = Math.round((Number(studentData.awardAmount) / 3000) * 100);
        setStatus(`Award ${pct}%`);
      } else if (studentData.status) {
        const statusValue = String(studentData.status).toLowerCase();
        setStatus(statusMap[statusValue] || "Under Review");
      }

      if (studentData.notes) {
        setNotes(String(studentData.notes));
      }
    }
  }, [setTitle, studentData]);

  if (isLoading || !studentData) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading student data...</div>
          <p className="text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  // Map studentData to student display format
  const student: StudentDisplay = {
    id: studentData.id,
    number: (studentData.number as string) || "N/A",
    name:
      (studentData.nameEn as string) || (studentData.name as string) || "N/A",
    nameKh: (studentData.nameKh as string) || "N/A",
    gender: (studentData.gender as string) || "N/A",
    nationality: (studentData.nationality as string) || "N/A",
    dateOfBirth:
      (studentData.dateOfBirth as string) ||
      safeFormatDate(studentData.dateApplied as string | Date),
    placeOfBirth: (studentData.placeOfBirth as string) || "N/A",
    country: (studentData.country as string) || "N/A",
    address: (studentData.address as string) || "N/A",
    phone:
      (studentData.phoneNumber as string) ||
      (studentData.phone as string) ||
      "N/A",
    email: (studentData.email as string) || "N/A",
    guardianName: (studentData["Parent/Guardian Name"] as string) || "N/A",
    relationship: (studentData["Relationship to Student"] as string) || "N/A",
    guardianNationality: (studentData["Parent Nationality"] as string) || "N/A",
    guardianOccupation: (studentData["Parent Job"] as string) || "N/A",
    guardianPhone: (studentData["Parent Phone Number"] as string) || "N/A",
    guardianAddress: (studentData["Parent Address"] as string) || "N/A",
    educationLevel: (studentData.educationLevel as string) || "N/A",
    institutionName: (studentData.institutionName as string) || "N/A",
    currentYear: (studentData.currentYear as string) || "N/A",
    academicYear: (studentData.academicYear as string) || "N/A",
    highSchool: (studentData.highSchoolName as string) || "N/A",
    highSchoolLocation: (studentData.schoolLocation as string) || "N/A",
    highSchoolYear: (studentData.academicYear as string) || "N/A",
    overallGrade: (studentData.overallGrade as string) || "N/A",
    mathGrade: (studentData.mathGrade as string) || "N/A",
    englishGrade: (studentData.englishGrade as string) || "N/A",
    university: (studentData.institutionName as string) || "N/A",
    major: (studentData.major as string) || "N/A",
    universityYear: (studentData.currentYear as string) || "N/A",
    hasEnglishCertificate: (studentData["Has English Certificate"] as boolean)
      ? "Yes"
      : "No",
    englishCertificateUrl:
      (studentData["English Certificate URL"] as string) || "",
    ielts: (studentData.ielts as string) || "N/A",
    toefl: (studentData.toefl as string) || "N/A",
    baci: (studentData.baci as string) || "N/A",
    program:
      (studentData["Interest Major"] as string) ||
      (studentData.major as string) ||
      "N/A",
    scholarship: (studentData["Is Applying Scholarship"] as boolean)
      ? "Yes"
      : "No",
    requestedTerm: (studentData["Requested Term"] as string) || "N/A",
    considerNextIntake: (studentData["Consider Next Intake"] as boolean)
      ? "Yes"
      : "No",
    source: (studentData["Referral Source"] as string) || "N/A",

    englishCertificate: (studentData.englishCertificate as string) || "N/A",
    personalIdDocument: (studentData.personalIdDocument as string) || "N/A",
    highSchoolCertificate:
      (studentData.highSchoolCertificate as string) || "N/A",
    paymentReceipt: (studentData.paymentReceipt as string) || "N/A",

    status: studentData.applicationStatus as string,
    // applicationStatus: (studentData.applicationStatus as string) || "N/A",

    batch: (studentData.batch as string) || "N/A",
    submittedDate: formatDate(
      (studentData.submittedDate as string) ||
        safeFormatDate(studentData.submittedDate as string | Date),
    ),
    batchId: (studentData.number as string) || studentData.id,
    url: "",
  };
  console.log("status", studentData.applicationStatus);

  console.log("scholarship:", studentData["Is Applying Scholarship"]);
  const handleStatusUpdate = async () => {
    const statusMap: Record<string, string> = {
      "Under Review": "new-applicant",
      Shortlisted: "shortlisted",
      Awarded: "awarded",
      Rejected: "rejected",
    };

    const internalStatus =
      statusMap[status] || status.toLowerCase().replace(" ", "-");
    const awardMatch = status.match(/(\d+)%/);

    try {
      const updateData: { status: string; awardAmount?: number } = {
        status: awardMatch ? "awarded" : internalStatus,
      };

      if (awardMatch) {
        const pct = Number(awardMatch[1]);
        updateData.awardAmount = (pct / 100) * 3000;
      }

      await apiClient.patch(
        `${API_ENDPOINTS.APPLICANT}/${params.id}`,
        updateData,
      );
      window.location.href = "/applicant";
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleExamStatusUpdate = () => {
    console.log("Updating English exam status to:", englishExamStatus);
    console.log("Updating Math exam status to:", mathExamStatus);
    // TODO: API call to update both exam statuses
  };

  const handleSaveNotes = async () => {
    try {
      await apiClient.patch(`${API_ENDPOINTS.APPLICANT}/${params.id}`, {
        notes,
      });
      alert("Notes saved successfully!");
    } catch (error) {
      console.error("Error saving notes:", error);
      alert("Failed to save notes");
    }
  };

  const handleEvaluationSave = async () => {
    console.log("Evaluation saved");
    // Refresh student data would happen here
  };

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/applicant")}
            className="hover:text-primary transition-colors cursor-pointer"
          >
            Applicant Registry
          </button>
          <ChevronRight size={14} className="text-muted-foreground/60" />
          <span className="text-foreground font-semibold">
            {student.name} Details
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* LEFT SIDE - Main Content */}
        <div className="bg-card rounded-[8px] border border-border/80 shadow-sm overflow-hidden">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-6 space-y-6">
                <PersonalInformation
                  data={{
                    name: student.name,
                    nameKh: student.nameKh,
                    nationality: student.nationality,
                    gender: student.gender,
                    dateOfBirth: student.dateOfBirth,
                    placeOfBirth: student.placeOfBirth,
                    country: student.country,
                    address: student.address,
                    phone: student.phone,
                    email: student.email,
                  }}
                />

                <ParentGuardianInfo
                  data={{
                    guardianName: student.guardianName,
                    relationship: student.relationship,
                    guardianNationality: student.guardianNationality,
                    guardianOccupation: student.guardianOccupation,
                    guardianPhone: student.guardianPhone,
                    guardianAddress: student.guardianAddress,
                  }}
                />

                <EducationalBackground
                  data={{
                    educationLevel: student.educationLevel,
                    institutionName: student.institutionName,
                    major: student.major,
                    currentYear: student.currentYear,
                    academicYear: student.academicYear,
                    highSchool: student.highSchool,
                    highSchoolLocation: student.highSchoolLocation,
                    highSchoolYear: student.highSchoolYear,
                    overallGrade: student.overallGrade,
                    mathGrade: student.mathGrade,
                    englishGrade: student.englishGrade,
                    hasEnglishCertificate: student.hasEnglishCertificate,
                    ielts: student.ielts,
                    toefl: student.toefl,
                  }}
                />

                <AppliedProgram
                  data={{
                    program: student.program,
                    scholarship: student.scholarship,
                    requestedTerm: student.requestedTerm,
                    considerNextIntake: student.considerNextIntake,
                    source: student.source,
                  }}
                />

                <DocumentsSection
                  data={{
                    documents: studentData.documents as {
                      personalIdDocument?: { type: string; url: string };
                      highSchoolCertificate?: { type: string; url: string };
                      englishCertificate?: { type: string; url: string };
                      paymentReceipt?: { type: string; url: string };
                    },
                  }}
                />

                <ResultSection
                  data={{
                    evaluations:
                      (studentData.evaluations as Array<{
                        totalScore: number;
                      }>) || [],
                    evaluation: studentData.evaluation as
                      | { totalScore: number }
                      | undefined,
                    mathScore: (studentData.mathScore as number) || undefined,
                    englishScore:
                      (studentData.englishScore as number) || undefined,
                    applicationId: studentData.id,
                  }}
                />

                {/* Footer Info */}
                <div className="pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-6">
                    <span>ID: {student.id}</span>
                    <span>Batch: {student.batch}</span>
                    <span>Submitted: {student.submittedDate}</span>
                  </div>
                  {studentData?.awardAmount ? (
                    <Badge variant="outline" className="text-blue-600">
                      Award{" "}
                      {Math.round(
                        (Number(studentData.awardAmount) / 3000) * 100,
                      )}
                      %
                    </Badge>
                  ) : (
                    student.status && (
                      <Badge variant="outline" className="text-blue-600">
                        {student.status}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>
          {/*  */}
          {/* RIGHT SIDE - Role-Based Panel */}
          <div className="space-y-6 h-[calc(100vh-200px)] overflow-y-auto">
            {userRole === "committee" && examId && (
              <EvaluationForm
                studentId={student.id}
                examId={examId}
                onSave={handleEvaluationSave}
              />
            )}

            {userRole === "admin" && (
              <AdminPanel
                applicantId={student.id}
                paymentStatus={paymentStatus}
                setPaymentStatus={setPaymentStatus}
                status={status}
                setStatus={setStatus}
                notes={notes}
                setNotes={setNotes}
                englishExamStatus={englishExamStatus}
                setEnglishExamStatus={setEnglishExamStatus}
                mathExamStatus={mathExamStatus}
                setMathExamStatus={setMathExamStatus}
                scholarshipStatus={scholarshipStatus}
                setscholarshipStatus={setScholarshipStatus}
                scholarshipPercentage={scholarshipPercentage}
                setScholarshipPercentage={setScholarshipPercentage}
                onStatusUpdate={handleStatusUpdate}
                onExamStatusUpdate={handleExamStatusUpdate}
                onSaveNotes={handleSaveNotes}
                evaluations={
                  (studentData?.evaluations ||
                    (studentData?.evaluation
                      ? [studentData.evaluation]
                      : undefined)) as
                    | import("@/components/evaluation-form").EvaluationData[]
                    | undefined
                }
              />
            )}
          </div>
        </div>
      </div>
  );
}
