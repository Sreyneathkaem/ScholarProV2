"use client";

import { useEffect, useState } from "react";
import ScheduleTabs from "@/components/schedule/common/ScheduleTabs";
import { ExamSchedule } from "@/components/schedule/exam/ExamSchedule";
import { InterviewSchedule } from "@/components/schedule/interview/InterviewSchedule";
import { useHeader } from "@/components/header/header-context";
import { PageHero } from "@/components/common/page-hero";

export default function ExamSchedulePage() {
  const { setTitle } = useHeader();
  const [activeTab, setActiveTab] = useState("exam");

  useEffect(() => {
    setTitle("Schedule");
  }, [setTitle]);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Exam & Interview Schedule"
        subtitle="Organize examination timetables, room capacities, and committee interview appointments"
      />

      {/* Navigation Tabs */}
      <ScheduleTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content with conditional layout */}
      {activeTab === "exam" ? (
        <ExamSchedule />
      ) : activeTab === "interview" ? (
        <InterviewSchedule />
      ) : null}
    </div>
  );
}
