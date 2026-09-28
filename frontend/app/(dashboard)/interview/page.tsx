"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { useHeader } from "@/components/header/header-context";
import { PageHero } from "@/components/common/page-hero";
import { useRouter } from "next/navigation";
import { UpcomingSchedule, ScheduleCard } from "@/components/schedule-card";

export default function Interview() {
  const { setTitle } = useHeader();
  const [upcomingSchedules, setUpcomingSchedules] = useState<
    UpcomingSchedule[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    setTitle("Interview Entry");
  }, [setTitle]);

  useEffect(() => {
    async function loadSchedules() {
      try {
        const res = await apiClient.get(API_ENDPOINTS.GET_ALL_EXAM_SESSIONS);
        const payload = res?.data?.data ?? res?.data ?? [];

        const normalized = payload.map((it: Record<string, unknown>) => ({
          ...it,
          id: String(it.id ?? it._id ?? it.sessionId ?? ""),
        })) as UpcomingSchedule[];

        setUpcomingSchedules(normalized);
      } catch (err) {
        console.error("Failed to load schedules", err);
      }
    }

    loadSchedules();
  }, []);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Interview Evaluation Sessions"
        subtitle="Select a scheduled oral interview panel to evaluate candidates and input criteria ratings"
      />

      {/* Only show schedules for subjectId === 3 */}
      <ScheduleCard
        schedules={upcomingSchedules.filter(
          (s) => String((s as UpcomingSchedule).subject.id) === "3",
        )}
        onView={(schedule) => {
          router.push(`/interview/${schedule.id}`);
        }}
      />
    </div>
  );
}
