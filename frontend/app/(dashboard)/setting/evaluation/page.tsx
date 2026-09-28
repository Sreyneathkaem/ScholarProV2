"use client";

import { useEffect, useState } from "react";
import EvaluationCriteria from "@/components/settings/EvaluationCriteria";
import { useHeader } from "@/components/header/header-context";
import EvaluationTabs from "@/components/settings/Evaluation-tab";
import SubjectCriteria from "@/components/settings/Subject";
import { PageHero } from "@/components/common/page-hero";

export default function EvaluationSettingsPage() {
  const { setTitle } = useHeader();
  const [activeTab, setActiveTab] = useState("criteria");

  useEffect(() => {
    setTitle("Evaluation Settings");
  }, [setTitle]);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Evaluation & Scoring Criteria"
        subtitle="Manage interview scoring rubrics, subject weightings, and assessment criteria"
      />

      <EvaluationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "criteria" ? (
        <EvaluationCriteria />
      ) : activeTab === "subject" ? (
        <SubjectCriteria />
      ) : null}
    </div>
  );
}
