"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, GraduationCap, UserCircle2 } from "lucide-react";
import Link from "next/link";
import {
  getProgressItems,
  getProgressPercent,
  getStatusMeta,
  loadStudentPortalSnapshot,
  type StudentPortalSnapshot,
} from "@/lib/utils/student-portal";
import { Badge } from "@/components/ui/badge";

const sessionCards = [
  {
    key: "schedule",
    title: "Schedule",
    description: "View your interview and exam schedule.",
    icon: CalendarDays,
    href: "/students/exam",
  },
  {
    key: "enrollment",
    title: "Enrollment Tracking",
    description: "Follow your enrollment readiness.",
    icon: GraduationCap,
    href: "/students/progress",
  },
  {
    key: "result",
    title: "Result",
    description:
      "Check your official result summary when you become a student.",
    icon: GraduationCap,
    href: "/students/grade",
  },
  {
    key: "profile",
    title: "Profile",
    description: "Keep your personal and contact details up to date.",
    icon: UserCircle2,
    href: "/students/profile",
  },
];

export default function StudentPortalDashboard() {
  const [snapshot, setSnapshot] = useState<StudentPortalSnapshot | null>(null);

  useEffect(() => {
    const syncData = () => {
      setSnapshot(loadStudentPortalSnapshot());
    };

    syncData();

    window.addEventListener("student-portal-updated", syncData);
    window.addEventListener("student-profile-updated", syncData);
    return () => {
      window.removeEventListener("student-portal-updated", syncData);
      window.removeEventListener("student-profile-updated", syncData);
    };
  }, []);

  const progressItems = useMemo(
    () => (snapshot ? getProgressItems(snapshot) : []),
    [snapshot],
  );

  const percent = useMemo(
    () => (snapshot ? getProgressPercent(snapshot) : 0),
    [snapshot],
  );

  const statusMeta = snapshot
    ? getStatusMeta(snapshot.applicationStatus)
    : null;

  if (!snapshot) return null;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Admissions Overview
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Welcome back, {snapshot.profile.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Your current status is{" "}
              <span className="font-semibold text-foreground">{statusMeta?.label}</span>. See your progress,
              exam schedule, and result status in one place.
            </p>
          </div>
          <Badge
            variant={
              snapshot.applicationStatus === "admitted"
                ? "success"
                : snapshot.applicationStatus === "under_review" ||
                  snapshot.applicationStatus === "exam_scheduled"
                ? "info"
                : snapshot.applicationStatus === "submitted"
                ? "reject"
                : "secondary"
            }
            className="text-xs px-3 py-1 font-semibold"
          >
            {statusMeta?.label}
          </Badge>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                Application Progress
              </p>
              <p className="text-sm font-bold text-primary">{percent}%</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="space-y-2 pt-1">
              {progressItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5 shadow-xs"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                  <Badge
                    variant={item.completed ? "success" : "secondary"}
                    className="text-[11px]"
                  >
                    {item.completed ? "Completed" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Current Status Detail
              </p>
              <p className="mt-2 text-sm text-foreground leading-relaxed">
                {statusMeta?.detail}
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Next Milestone
              </p>
              <p className="mt-2 leading-relaxed">
                {(() => {
                  switch (snapshot.applicationStatus) {
                    case "new":
                      return "Complete the application steps and submit for review.";
                    case "submitted":
                      return "Your application is waiting for review by the admissions team.";
                    case "under_review":
                      return "The committee is reviewing your file. You will be notified regarding exam/interview scheduling.";
                    case "exam_scheduled":
                      return "Prepare for your exam or interview session.";
                    default:
                      return "Your admission result is ready to be reviewed.";
                  }
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {sessionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.key}
              href={card.href}
              className="group rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {card.description}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground shrink-0">
                  <Icon className="size-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
