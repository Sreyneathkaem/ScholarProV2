"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApplicationFormData } from "@/types/application";
import { SectionHeader } from "./PersonalInfoStep";
import { cn } from "@/lib/utils";

interface ReviewSubmitStepProps {
  formData: ApplicationFormData;
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

export default function ReviewSubmitStep({
  formData,
  onBack,
  onSubmit,
}: ReviewSubmitStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("personal");

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-5">
        <CheckCircle2 className="size-20 text-emerald-500" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-primary">
          Application Submitted!
        </h2>
        <p className="max-w-md text-muted-foreground text-sm leading-relaxed">
          Thank you for applying to CamTech University. We have received your
          application and will review it shortly. You will be notified via email
          about the next steps.
        </p>
        <p className="text-xs text-muted-foreground">
          Please keep your reference number for future correspondence.
        </p>
      </div>
    );
  }

  const { personal, parents, education, program } = formData;

  return (
    <div className="space-y-0">
      <SectionHeader
        title="Section 5: Review & Submit"
        subtitle="Please review your information carefully before submitting"
      />

      <div className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Click on each section to expand and review your answers.
        </p>

        {/* Personal Info */}
        <ReviewSection
          id="personal"
          title="1. Personal Information"
          isOpen={openSection === "personal"}
          onToggle={() =>
            setOpenSection(openSection === "personal" ? null : "personal")
          }
        >
          <ReviewGrid>
            <ReviewItem label="Full Name (Khmer)" value={personal.nameKhmer} />
            <ReviewItem
              label="Full Name (English)"
              value={personal.nameEnglish}
            />
            <ReviewItem label="Nationality" value={personal.nationality} />
            <ReviewItem label="Gender" value={personal.gender} />
            <ReviewItem label="Date of Birth" value={personal.dateOfBirth} />
            <ReviewItem label="Place of Birth" value={personal.placeOfBirth} />
            <ReviewItem label="Country" value={personal.country} />
            <ReviewItem label="Phone Number" value={personal.phoneNumber} />
            <ReviewItem label="Email" value={personal.email} />
            <ReviewItem
              label="Current Address"
              value={personal.currentAddress}
              fullWidth
            />
            <ReviewItem
              label="Identity Document"
              value={
                personal.identityDocument.length > 0
                  ? `${personal.identityDocument.length} file(s) uploaded`
                  : "—"
              }
            />
          </ReviewGrid>
        </ReviewSection>

        {/* Parents / Guardians */}
        <ReviewSection
          id="parents"
          title="2. Parents / Guardians"
          isOpen={openSection === "parents"}
          onToggle={() =>
            setOpenSection(openSection === "parents" ? null : "parents")
          }
        >
          <ReviewGrid>
            <ReviewItem label="Name" value={parents.name} />
            <ReviewItem label="Relationship" value={parents.relationship} />
            <ReviewItem label="Nationality" value={parents.nationality} />
            <ReviewItem label="Job Position" value={parents.jobPosition} />
            <ReviewItem label="Phone Number" value={parents.phoneNumber} />
            <ReviewItem
              label="Current Address"
              value={parents.currentAddress}
              fullWidth
            />
          </ReviewGrid>
        </ReviewSection>

        {/* Education */}
        <ReviewSection
          id="education"
          title="3. Educational Background"
          isOpen={openSection === "education"}
          onToggle={() =>
            setOpenSection(openSection === "education" ? null : "education")
          }
        >
          <ReviewGrid>
            <ReviewItem
              label="Education Level"
              value={formatEducationLevel(education.currentEducationLevel)}
              fullWidth
            />
          </ReviewGrid>

          {education.currentEducationLevel === "university" && (
            <>
              <SubSectionHeader>Current University</SubSectionHeader>
              <ReviewGrid>
                <ReviewItem
                  label="Current Major"
                  value={education.university.currentMajor}
                />
                <ReviewItem
                  label="Institution Name"
                  value={education.university.institutionName}
                />
                <ReviewItem
                  label="Year of Study"
                  value={education.university.yearOfStudy}
                />
              </ReviewGrid>
            </>
          )}

          <SubSectionHeader>High School</SubSectionHeader>
          <ReviewGrid>
            <ReviewItem
              label="Academic Year"
              value={education.highSchool.academicYear}
            />
            <ReviewItem
              label="School Name"
              value={education.highSchool.schoolName}
            />
            {education.currentEducationLevel === "university" && (
              <>
                <ReviewItem
                  label="City & Country"
                  value={education.highSchool.cityAndCountry}
                />
                <ReviewItem
                  label="Overall Grade"
                  value={education.highSchool.overallGrade}
                />
                <ReviewItem
                  label="Math Grade"
                  value={education.highSchool.mathGrade}
                />
                <ReviewItem
                  label="English Grade"
                  value={education.highSchool.englishGrade}
                />
              </>
            )}
            {education.currentEducationLevel !== "university" && (
              <ReviewItem
                label="Overall Grade"
                value={education.highSchool.overallGrade}
              />
            )}
          </ReviewGrid>

          {education.currentEducationLevel === "university" &&
            education.hasIeltsOrToefl && (
              <>
                <SubSectionHeader>English Proficiency</SubSectionHeader>
                <ReviewGrid>
                  <ReviewItem
                    label="IELTS / TOEFL Certificate"
                    value={capitalise(education.hasIeltsOrToefl)}
                  />
                </ReviewGrid>
              </>
            )}
        </ReviewSection>

        {/* Applied Program */}
        <ReviewSection
          id="program"
          title="4. Applied Program"
          isOpen={openSection === "program"}
          onToggle={() =>
            setOpenSection(openSection === "program" ? null : "program")
          }
        >
          <ReviewGrid>
            <ReviewItem
              label="Interested Major(s)"
              value={program.interestedMajors.join(", ")}
              fullWidth
            />
            <ReviewItem
              label="Applying for Scholarship"
              value={capitalise(program.applyingForScholarship)}
            />
            <ReviewItem
              label="Requested Academic Term"
              value={program.requestedAcademicTerm}
            />
            <ReviewItem
              label="Consider Next Intake"
              value={capitalise(program.considerNextIntake)}
            />
            <ReviewItem
              label="How Did You Know CamTech"
              value={program.howDidYouKnow.join(", ")}
              fullWidth
            />
            <ReviewItem
              label="Data Consent"
              value={
                program.dataConsent === "yes"
                  ? "Yes, I give my consent"
                  : "No, I do not give my consent"
              }
              fullWidth
            />
            <ReviewItem
              label="Payment Proof"
              value={
                program.paymentProof.length > 0
                  ? `${program.paymentProof.length} file(s) uploaded`
                  : "—"
              }
            />
          </ReviewGrid>
        </ReviewSection>

        {/* Disclaimer */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-5 py-4 text-sm text-amber-900 dark:text-amber-200">
          <p className="font-semibold mb-1">Before you submit:</p>
          <p className="leading-relaxed">
            Please ensure all information is accurate. Once submitted, changes
            can only be made by contacting the admissions office. Applications
            with false or misleading information will be rejected.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border bg-card pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6"
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────── Helpers ────────────────────

function formatEducationLevel(level: string) {
  switch (level) {
    case "university":
      return "University";
    case "high_school_graduate":
      return "High School Graduate";
    case "current_12th_grader":
      return "Current 12th Grader";
    default:
      return level;
  }
}

function capitalise(str: string) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ──────────────────── Sub-components ────────────────────

function ReviewSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
        aria-expanded={isOpen}
        aria-controls={`section-${id}`}
      >
        <span className="font-semibold text-foreground text-sm">{title}</span>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground shrink-0" />
        )}
      </button>

      <div
        id={`section-${id}`}
        className={cn(
          "transition-all duration-200 overflow-hidden",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="border-t border-border/80 bg-card px-5 py-4 space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function SubSectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h5 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-2">
      {children}
    </h5>
  );
}

function ReviewGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
  );
}

function ReviewItem({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn("space-y-0.5", fullWidth && "sm:col-span-2")}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </p>
      <p className="text-sm text-foreground font-medium break-words">
        {value || "—"}
      </p>
    </div>
  );
}
