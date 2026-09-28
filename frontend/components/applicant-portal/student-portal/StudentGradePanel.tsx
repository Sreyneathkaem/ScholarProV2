"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Download, GraduationCap } from "lucide-react";
import {
  loadStudentPortalSnapshot,
  type StudentPortalSnapshot,
} from "@/lib/utils/student-portal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const sampleTerms = [
  {
    name: "Term 1",
    courses: [
      { name: "English", credit: 3, grade: "A" },
      { name: "Math", credit: 3, grade: "B+" },
      { name: "Science", credit: 3, grade: "A-" },
    ],
    gpa: "3.8",
  },
  {
    name: "Term 2",
    courses: [
      { name: "History", credit: 2, grade: "A" },
      { name: "Computer", credit: 3, grade: "B" },
      { name: "Art", credit: 1, grade: "A-" },
    ],
    gpa: "3.6",
  },
];

export default function StudentGradePanel() {
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

  const totals = useMemo(() => {
    const totalCredits = sampleTerms.reduce(
      (sum, term) =>
        sum +
        term.courses.reduce(
          (courseSum, course) => courseSum + course.credit,
          0,
        ),
      0,
    );

    return { totalCredits };
  }, []);

  const exportGrades = () => {
    const rows = [
      ["Term", "Course", "Credit", "Result"],
      ...sampleTerms.flatMap((term) =>
        term.courses.map((course) => [
          term.name,
          course.name,
          course.credit,
          course.grade,
        ]),
      ),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-results.csv";
    link.click();
    globalThis.URL.revokeObjectURL(url);
  };

  if (!snapshot) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Result
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Result Report
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Review your academic outcomes and keep track of your current
              standing.
            </p>
          </div>
          <Button
            onClick={exportGrades}
            variant="outline"
            className="gap-2 self-start lg:self-auto rounded-md"
          >
            <Download className="size-4" />
            Export Result
          </Button>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {sampleTerms.map((term) => (
              <div
                key={term.name}
                className="rounded-lg border border-border/80 bg-muted/20 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 text-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpenCheck className="size-4 text-primary" />
                    <p className="font-semibold text-sm">{term.name}</p>
                  </div>
                  <Badge variant="secondary" className="font-medium text-xs">
                    GPA {term.gpa}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {term.courses.map((course) => (
                    <div
                      key={course.name}
                      className="flex items-center justify-between rounded-lg border border-border/80 bg-card px-3.5 py-2.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]"
                    >
                      <span className="text-foreground font-medium">{course.name}</span>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="text-xs">{course.credit} credits</span>
                        <span className="font-bold text-foreground">
                          {course.grade}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border/80 bg-card p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center gap-2 text-foreground">
              <GraduationCap className="size-5 text-emerald-600 dark:text-emerald-400" />
              <p className="font-semibold text-sm">Academic Summary</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Total credits
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  {totals.totalCredits}
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Cumulative GPA
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">
                  3.7 / 4.0
                </p>
              </div>
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Academic Status
                </p>
                <div className="mt-1">
                  <Badge variant="success" className="text-xs font-semibold">
                    Good Standing
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
