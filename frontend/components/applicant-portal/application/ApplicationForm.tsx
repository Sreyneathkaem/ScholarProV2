"use client";

import { useEffect, useState } from "react";
import FormStepper from "./FormStepper";
import PersonalInfoStep from "./steps/PersonalInfoStep";
import ParentsGuardiansStep from "./steps/ParentsGuardiansStep";
import EducationStep from "./steps/EducationStep";
import AppliedProgramStep from "./steps/AppliedProgramStep";
import ReviewSubmitStep from "./steps/ReviewSubmitStep";
import type { ApplicationFormData } from "@/types/application";
import { FileText, Info } from "lucide-react";
import {
  loadStudentPortalSnapshot,
  saveStudentPortalSnapshot,
  getStudentDisplayName,
} from "@/lib/utils/student-portal";
import { useAuthStore } from "@/lib/stores/auth-store";
import { apiClient } from "@/api/api";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { toast } from "sonner";

const INITIAL_DATA: ApplicationFormData = {
  personal: {
    nameKhmer: "",
    nameEnglish: "",
    nationality: "",
    gender: "",
    dateOfBirth: "",
    placeOfBirth: "",
    currentAddress: "",
    country: "",
    phoneNumber: "",
    email: "",
    identityDocument: [],
  },
  parents: {
    name: "",
    relationship: "",
    nationality: "",
    currentAddress: "",
    jobPosition: "",
    phoneNumber: "",
  },
  education: {
    currentEducationLevel: "",
    university: {
      currentMajor: "",
      institutionName: "",
      yearOfStudy: "",
    },
    highSchool: {
      academicYear: "",
      schoolName: "",
      cityAndCountry: "",
      overallGrade: "",
      mathGrade: "",
      englishGrade: "",
    },
    hasIeltsOrToefl: "",
    hsCertificate: [],
    ieltsDocument: [],
    grade12IdCard: [],
  },
  program: {
    interestedMajors: [],
    applyingForScholarship: "",
    requestedAcademicTerm: "",
    considerNextIntake: "",
    howDidYouKnow: [],
    dataConsent: "",
    declaration: false,
    paymentProof: [],
  },
};

export default function ApplicationForm() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_DATA);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userKey, setUserKey] = useState<string>("");

  useEffect(() => {
    const initForm = () => {
      const currentAuthUser = useAuthStore.getState().user;
      let resolvedEmail = currentAuthUser?.email || "";

      if (!resolvedEmail && typeof window !== "undefined") {
        try {
          const stored = sessionStorage.getItem("studentUser");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.email) resolvedEmail = parsed.email;
          }
        } catch {}
      }

      const saved = loadStudentPortalSnapshot(resolvedEmail);
      const resolvedName = getStudentDisplayName(currentAuthUser);

      if (!resolvedEmail && saved.profile?.email && saved.profile.email !== "applicant@example.com") {
        resolvedEmail = saved.profile.email;
      }

      setUserKey(resolvedEmail || "guest");

      if (saved.applicationData) {
        const rawCompleted = Array.isArray(saved.completedSteps) ? saved.completedSteps : [];
        const validCompleted: number[] = [];
        for (let i = 1; i <= 4; i++) {
          if (rawCompleted.includes(i)) {
            validCompleted.push(i);
          } else {
            break;
          }
        }
        const maxStepAllowed = validCompleted.length + 1;
        const resolvedStep = Math.min(saved.currentStep || 1, maxStepAllowed);

        setFormData({
          ...saved.applicationData,
          personal: {
            ...saved.applicationData.personal,
            nameEnglish:
              saved.applicationData.personal?.nameEnglish ||
              (resolvedName !== "Student" && resolvedName !== "Applicant" ? resolvedName : ""),
            email: saved.applicationData.personal?.email || resolvedEmail || "",
          },
        });
        setCurrentStep(resolvedStep);
        setCompletedSteps(validCompleted);
      } else {
        setFormData({
          ...INITIAL_DATA,
          personal: {
            ...INITIAL_DATA.personal,
            nameEnglish: resolvedName !== "Student" && resolvedName !== "Applicant" ? resolvedName : "",
            email: resolvedEmail || "",
          },
        });
        setCurrentStep(1);
        setCompletedSteps([]);
      }
      setIsLoaded(true);
    };

    initForm();

    if (typeof window !== "undefined") {
      window.addEventListener("student-portal-updated", initForm);
      window.addEventListener("student-profile-updated", initForm);
      return () => {
        window.removeEventListener("student-portal-updated", initForm);
        window.removeEventListener("student-profile-updated", initForm);
      };
    }
  }, []);

  const persistForm = (
    nextData: ApplicationFormData,
    nextStep: number,
    nextCompletedSteps?: number[],
  ) => {
    const resolvedCompletedSteps = nextCompletedSteps ?? completedSteps;
    const resolvedName =
      nextData.personal.nameEnglish ||
      nextData.personal.nameKhmer ||
      getStudentDisplayName(useAuthStore.getState().user);
    const resolvedEmail =
      nextData.personal.email ||
      useAuthStore.getState().user?.email ||
      userKey ||
      "";

    setFormData(nextData);
    setCompletedSteps(resolvedCompletedSteps);

    saveStudentPortalSnapshot(
      {
        applicationData: nextData,
        currentStep: nextStep,
        completedSteps: resolvedCompletedSteps,
        applicationStatus: "draft",
        profile: {
          name: resolvedName,
          email: resolvedEmail || "applicant@example.com",
          phone: nextData.personal.phoneNumber || "—",
          studentId: "APP-001",
        },
      },
      resolvedEmail,
    );

    if (resolvedName && resolvedName !== "Student" && typeof window !== "undefined") {
      try {
        const storedUser = JSON.parse(sessionStorage.getItem("studentUser") || "{}");
        const updatedUser = {
          id: storedUser.id || `student-${resolvedEmail || "user"}`,
          name: resolvedName,
          email: resolvedEmail || storedUser.email || "",
          role: storedUser.role || "student",
          avatar: storedUser.avatar,
        };
        sessionStorage.setItem("studentUser", JSON.stringify(updatedUser));
        useAuthStore.getState().setUser(updatedUser);
        window.dispatchEvent(new Event("student-profile-updated"));
      } catch {}
    }
  };

  const isStepAccessible = (targetStep: number, activeCompleted = completedSteps): boolean => {
    if (targetStep === currentStep) return true;
    if (targetStep < currentStep) return true;
    for (let i = 1; i < targetStep; i++) {
      if (!activeCompleted.includes(i)) return false;
    }
    return true;
  };

  const goToStep = (
    nextStep: number,
    nextData?: ApplicationFormData,
    overrideCompleted?: number[],
  ) => {
    const activeData = nextData ?? formData;
    const safeStep = Math.min(Math.max(nextStep, 1), 5);
    const activeCompleted = overrideCompleted ?? completedSteps;

    if (!isStepAccessible(safeStep, activeCompleted)) {
      return;
    }

    setCurrentStep(safeStep);
    persistForm(activeData, safeStep, activeCompleted);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goBack = () => goToStep(currentStep - 1);

  const handleSubmit = async () => {
    const registration = new FormData();
    const append = (key: string, value: string | number | boolean) => {
      registration.append(key, String(value));
    };
    const { personal, parents, education, program } = formData;

    append("student[nameEn]", personal.nameEnglish);
    append("student[nameKh]", personal.nameKhmer);
    append("student[email]", personal.email);
    append("student[phoneNumber]", personal.phoneNumber);
    append("student[dateOfBirth]", personal.dateOfBirth);
    append("personalInfo[nameEn]", personal.nameEnglish);
    append("personalInfo[nameKh]", personal.nameKhmer);
    append("personalInfo[nationality]", personal.nationality);
    append("personalInfo[gender]", personal.gender.toLowerCase());
    append("personalInfo[dateOfBirth]", personal.dateOfBirth);
    append("personalInfo[placeOfBirth]", personal.placeOfBirth);
    append("personalInfo[address]", personal.currentAddress);
    append("personalInfo[country]", personal.country);
    append("personalInfo[phoneNumber]", personal.phoneNumber);
    append("personalInfo[email]", personal.email);
    append("parentGuardianInfo[name]", parents.name);
    append("parentGuardianInfo[relationship]", parents.relationship);
    append("parentGuardianInfo[nationality]", parents.nationality);
    append("parentGuardianInfo[address]", parents.currentAddress);
    append("parentGuardianInfo[jobPosition]", parents.jobPosition);
    append("parentGuardianInfo[phoneNumber]", parents.phoneNumber);
    append("educationBackground[currentEducationLevel]", education.currentEducationLevel);
    append("educationBackground[major]", education.university.currentMajor);
    append("educationBackground[institutionName]", education.university.institutionName);
    append("educationBackground[yearOfStudy]", education.university.yearOfStudy);
    append("educationBackground[academicYear]", education.highSchool.academicYear);
    append("educationBackground[highSchoolName]", education.highSchool.schoolName);
    const [schoolCity, schoolCountry] = education.highSchool.cityAndCountry.split(",", 2);
    append("educationBackground[schoolCity]", schoolCity?.trim() || education.highSchool.cityAndCountry);
    append("educationBackground[schoolCountry]", schoolCountry?.trim() || personal.country);
    append("educationBackground[overallGrade]", education.highSchool.overallGrade);
    append("educationBackground[mathGrade]", education.highSchool.mathGrade);
    append("educationBackground[englishGrade]", education.highSchool.englishGrade);
    append("educationBackground[hasEnglishCertificate]", education.hasIeltsOrToefl);
    append("appliedProgram[interestedMajor]", program.interestedMajors[0] || "");
    append("appliedProgram[isApplyingScholarship]", program.applyingForScholarship === "yes");
    append("appliedProgram[requestedAcademicTerm]", program.requestedAcademicTerm);
    append("appliedProgram[considerNextIntake]", program.considerNextIntake === "yes");
    append("appliedProgram[referralSource]", program.howDidYouKnow[0] || "");

    personal.identityDocument.forEach((file) => registration.append("personalDocuments", file));
    [...education.hsCertificate, ...education.ieltsDocument, ...education.grade12IdCard].forEach(
      (file) => registration.append("educationDocuments", file),
    );
    program.paymentProof.forEach((file) => registration.append("paymentProof", file));

    try {
      await apiClient.post("/students/student-register", registration, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Unable to submit your application"),
      );
      throw error;
    }

    const nextCompletedSteps = Array.from(new Set([...completedSteps, 5]));
    const resolvedEmail =
      formData.personal.email ||
      useAuthStore.getState().user?.email ||
      userKey ||
      "applicant@example.com";

    const nextSnapshot = saveStudentPortalSnapshot(
      {
        applicationData: formData,
        currentStep: 5,
        completedSteps: nextCompletedSteps,
        applicationStatus: "under_review",
        applicationId: `APP-${Date.now().toString().slice(-6)}`,
        submittedAt: new Date().toISOString(),
        examDate: "TBD",
        examTime: "TBD",
        examLocation: "TBD",
        enrollmentStatus:
          "Enrollment tracking will begin once the review is completed.",
        gradeSummary: "Grades will be available after the evaluation stage.",
        profile: {
          name:
            formData.personal.nameEnglish ||
            formData.personal.nameKhmer ||
            "Applicant",
          email: resolvedEmail,
          phone: formData.personal.phoneNumber || "—",
          studentId: "APP-001",
        },
      },
      resolvedEmail,
    );
    setCompletedSteps(nextCompletedSteps);
    setFormData(nextSnapshot.applicationData ?? formData);
  };

  if (!isLoaded) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Ant Design Registration Header Card */}
      <div className="rounded-t-lg bg-gradient-to-r from-[#0F386C] to-[#1E3A5F] px-6 py-5 sm:px-6 sm:py-6 text-white relative overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] border border-primary/30">
        <div className="relative z-10">
          <div className="text-xs font-medium text-white/80">
            Registration Process
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
            New Candidate Registration
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-white/80 max-w-3xl leading-relaxed">
            Welcome to the admissions portal. Complete the form below to enter the evaluation pool for academic funding.
          </p>

          <div className="my-4 border-t border-white/20" />

          {/* Step Indicator */}
          <FormStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(step) => goToStep(step)}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-b-lg bg-card text-card-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] border border-border/80 border-t-0 overflow-hidden">
        {currentStep === 1 && (
          <>
            {/* Instructions */}
            <div className="px-6 py-4 border-b border-border/80 bg-muted/20">
              <div className="bg-card border border-border/80 rounded-[6px] p-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Application Instructions
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">
                  Please complete all required information accurately and upload the following documents:
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>Birth Certificate, National ID Card, or Passport (PDF/JPG)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>High school certificate, equivalent document, or grade 12 student ID card</span>
                  </li>
                </ul>
                <div className="flex items-start gap-2.5 bg-[#edf4fc] dark:bg-[#0f2238] border border-[#b8d4f6] dark:border-[#1e3f66] rounded-[6px] p-3">
                  <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-[#0F386C] dark:text-[#5a9be6] leading-relaxed">
                    <span className="font-semibold">Note:</span> Incomplete applications will be rejected. For assistance, contact 078 / 086 21 21 81.
                  </p>
                </div>
              </div>
            </div>

            <PersonalInfoStep
              key={`${userKey}-step-1`}
              defaultValues={formData.personal}
              onDraftChange={(personal) => {
                const next = { ...formData, personal };
                setFormData(next);
                persistForm(next, 1, completedSteps);
              }}
              onNext={(data) => {
                const next = { ...formData, personal: data };
                const nextCompleted = Array.from(new Set([...completedSteps, 1]));
                goToStep(2, next, nextCompleted);
              }}
            />
          </>
        )}

        {currentStep === 2 && (
          <ParentsGuardiansStep
            key={`${userKey}-step-2`}
            defaultValues={formData.parents}
            onDraftChange={(parents) => {
              const next = { ...formData, parents };
              setFormData(next);
              persistForm(next, 2, completedSteps);
            }}
            onNext={(data) => {
              const next = { ...formData, parents: data };
              const nextCompleted = Array.from(new Set([...completedSteps, 2]));
              goToStep(3, next, nextCompleted);
            }}
            onBack={goBack}
          />
        )}

        {currentStep === 3 && (
          <EducationStep
            key={`${userKey}-step-3`}
            defaultValues={formData.education}
            onDraftChange={(education) => {
              const next = { ...formData, education };
              setFormData(next);
              persistForm(next, 3, completedSteps);
            }}
            onNext={(data) => {
              const next = { ...formData, education: data };
              const nextCompleted = Array.from(new Set([...completedSteps, 3]));
              goToStep(4, next, nextCompleted);
            }}
            onBack={goBack}
          />
        )}

        {currentStep === 4 && (
          <AppliedProgramStep
            key={`${userKey}-step-4`}
            defaultValues={formData.program}
            onDraftChange={(program) => {
              const next = { ...formData, program };
              setFormData(next);
              persistForm(next, 4, completedSteps);
            }}
            onNext={(data) => {
              const next = { ...formData, program: data };
              const nextCompleted = Array.from(new Set([...completedSteps, 4]));
              goToStep(5, next, nextCompleted);
            }}
            onBack={goBack}
          />
        )}

        {currentStep === 5 && (
          <ReviewSubmitStep
            key={`${userKey}-step-5`}
            formData={formData}
            onBack={goBack}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}