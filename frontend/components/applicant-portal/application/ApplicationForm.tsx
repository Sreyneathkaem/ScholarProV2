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
import axios from "axios";
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
        // User already has a saved draft/record
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
        setCurrentStep(saved.currentStep || 1);
        setCompletedSteps(saved.completedSteps ?? []);
      } else {
        // Brand new registration: provide fresh clean form
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

  const goToStep = (nextStep: number, nextData?: ApplicationFormData) => {
    const activeData = nextData ?? formData;
    const safeStep = Math.min(Math.max(nextStep, 1), 5);
    const nextCompletedSteps =
      safeStep > currentStep
        ? Array.from(new Set([...completedSteps, currentStep]))
        : completedSteps;

    setCurrentStep(safeStep);
    persistForm(activeData, safeStep, nextCompletedSteps);

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
      const response = axios.isAxiosError(error) ? error.response?.data : null;
      const message = response?.message || response?.errors?.join(", ") || "Unable to submit your application";
      toast.error(message);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e2d6b]" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      {/* Brand Blue Registration Header Card */}
      <div className="rounded-t-2xl bg-gradient-to-br from-[#1e2d6b] to-[#141f4d] px-6 py-8 sm:px-10 sm:py-10 text-white relative overflow-hidden shadow-lg">
        {/* Subtle background pattern for a premium feel */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGllcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

        <div className="relative z-10">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-blue-300/80 uppercase">
            Registration Process
          </div>

          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            New Candidate Registration
          </h1>
          <p className="mt-3 text-sm text-blue-100/70 max-w-2xl leading-relaxed">
            Welcome to the CamTech admissions portal. Complete the form below to enter the evaluation pool for academic funding.
          </p>

          <div className="my-8 border-t border-white/10" />

          {/* Step Indicator */}
          <FormStepper
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(step) => goToStep(step)}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-b-2xl bg-white shadow-lg border border-slate-200/60 border-t-0 overflow-hidden">
        {currentStep === 1 && (
          <>
            {/* Instructions */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-100 bg-slate-50/40">
              <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1e2d6b]" />
                  Application Instructions
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Please complete all required information accurately and upload the following documents:
                </p>
                <ul className="space-y-2.5 text-sm text-slate-600 mb-5">
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>Birth Certificate, National ID Card, or Passport (PDF/JPG)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>High school certificate, equivalent document, or grade 12 student ID card</span>
                  </li>
                </ul>
                <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-lg p-3.5">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">
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
                goToStep(2, next);
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
              goToStep(3, next);
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
              goToStep(4, next);
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
              goToStep(5, next);
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