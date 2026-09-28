"use client";

import { useEffect, useState } from "react";
import { StudentTable } from "@/components/tables/student-table";
import { useHeader } from "@/components/header/header-context";
import { PageHero } from "@/components/common/page-hero";
import { useRole } from "@/lib/context/auth-context";
import { ExportStudent } from "@/components/applicants/export-file";

export default function Applicant() {
  const { setTitle } = useHeader();
  const [showExportModal, setShowExportModal] = useState(false);
  const [refreshKey] = useState(0);

  const { isAdmin } = useRole();

  useEffect(() => {
    setTitle("Applicant");
  }, [setTitle]);

  const handleRowSelection = (selectedStudents: unknown[]) => {
    console.log("Selected students:", selectedStudents);
  };

  const handleExport = () => {
    console.log("Exporting data");
  };

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Applicant Registry"
        subtitle="Review candidate profiles, filter across admission statuses, and manage candidate progression"
      />

      {/* 🧾 Student Table */}
      <StudentTable
        key={refreshKey}
        title="Students"
        defaultTab="all"
        showTabs={true}
        onRowSelect={handleRowSelection}
        onExport={handleExport}
        showImportFile={isAdmin}
        className="h-full w-full"
        showEmailButton={true}
      />

      {/* Import File Modal */}
      {isAdmin && (
        <ExportStudent
          open={showExportModal}
          onOpenChange={setShowExportModal}
        />
      )}
    </div>
  );
}
