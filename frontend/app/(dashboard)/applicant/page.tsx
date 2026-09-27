"use client";

import { useEffect, useState } from "react";
import { StudentTable } from "@/components/tables/student-table";
import { useHeader } from "@/components/header/header-context";

import { useRole } from "@/lib/context/auth-context";
import { ExportStudent } from "@/components/applicants/export-file";

export default function Applicant() {
  const { setTitle } = useHeader();
  // const [isModalOpen, setIsModalOpen] = useState(false);
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
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="flex-1 w-full min-w-0 overflow-hidden px-4 md:px-8 py-6">
        {/* 🧾 Student Table */}
        <StudentTable
          key={refreshKey}
          title="Students"
          defaultTab="all"
          showTabs={true}
          onRowSelect={handleRowSelection}
          onExport={handleExport}
          // onCreateBatch={isAdmin ? () => setIsModalOpen(true) : undefined}
          showImportFile={isAdmin}
          className="h-full w-full"
          showEmailButton={true}
        />

        {/* Import File Modal */}
        {isAdmin && (
          <>
            <ExportStudent
              open={showExportModal}
              onOpenChange={setShowExportModal}
            />

            {/* <NewBatch
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
              onBatchCreated={handleBatchCreated}
            /> */}
          </>
        )}
      </div>
    </div>
  );
}
