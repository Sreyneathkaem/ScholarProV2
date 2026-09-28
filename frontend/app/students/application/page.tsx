import ApplicationForm from "@/components/applicant-portal/application/ApplicationForm";
import TitleSetter from "@/components/header/tittle-setter";

export default function ApplicantApplicationPage() {
  return (
    <div className="p-6 space-y-6">
      <TitleSetter title="Registration" />
      <ApplicationForm />
    </div>
  );
}
