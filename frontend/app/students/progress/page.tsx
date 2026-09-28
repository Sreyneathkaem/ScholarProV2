import TitleSetter from "@/components/header/tittle-setter";

export default function ApplicantProgressPage() {
  return (
    <div className="p-6 space-y-6">
      <TitleSetter title="Enrollment Progress" />
      <div className="rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-2">
          Admissions Onboarding
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Enrollment Tracking
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Your admission and enrollment onboarding milestones will be updated once application evaluation is completed.
        </p>
      </div>
    </div>
  );
}
