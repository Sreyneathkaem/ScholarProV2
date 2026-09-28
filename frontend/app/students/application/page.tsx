import ApplicationForm from "@/components/applicant-portal/application/ApplicationForm";
import TitleSetter from "@/components/header/tittle-setter";

export default function ApplicantApplicationPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 transition-colors">
      <TitleSetter title="Registration" />
      <ApplicationForm />
    </div>
  );
}
