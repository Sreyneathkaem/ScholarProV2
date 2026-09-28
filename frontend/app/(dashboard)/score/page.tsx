"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { useHeader } from "@/components/header/header-context";
import { PageHero } from "@/components/common/page-hero";
import { useRouter } from "next/navigation";
import { ScheduleCard, UpcomingSchedule } from "@/components/schedule-card";

export default function ScoreEntry() {
  const { setTitle } = useHeader();
  const [upcomingSchedules, setUpcomingSchedules] = useState<
    UpcomingSchedule[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    setTitle("Score Entry");
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
        title="Score Entry Sessions"
        subtitle="Select a scheduled examination session to input, verify, or review candidate exam scores"
      />

      <ScheduleCard
        schedules={upcomingSchedules.filter(
          (s) => String((s as UpcomingSchedule).subject.id) !== "3",
        )}
        onView={(schedule) => {
          router.push(`/score/${schedule.id}`);
        }}
      />
    </div>
  );
}
