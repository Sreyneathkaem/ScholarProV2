import TitleSetter from "@/components/header/tittle-setter";

export default function ApplicantProgressPage() {
  return (
    <div className="p-6 bg-background text-foreground transition-colors min-h-screen">
      <TitleSetter title="Enrollment Progress" />
      <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card p-6 shadow-sm">
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
