"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useHeader } from "@/components/header/header-context";

interface Student {
  id: string;
  examId?: string;
  number: string;
  nameEn: string;
  batch?: string;
  email?: string;
  examDate?: Date;
  totalScore?: number | null;
}

export default function ScoreInputPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const { setTitle } = useHeader();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    setTitle(`Input Scores – Session ${sessionId}`);
  }, [setTitle, sessionId]);

  // Set a back button in header

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(
          API_ENDPOINTS.LIST_STUDENTS(String(sessionId)),
        );
        const payload = res?.data?.data ?? res?.data ?? [];
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);

        const mapped: Student[] = items.map(
          (app: Record<string, unknown>, idx: number) => {
            const rawId =
              app.applicationId ??
              app.id ??
              app.studentId ??
              app._id ??
              app.appId ??
              app.number ??
              "";
            const id = rawId ? String(rawId) : `${sessionId}-${idx}`;
            return {
              id,
              examId: String(app.examId ?? app.sessionId ?? sessionId),
              number: app.number || app.appId || `APP-${id}`,
              nameEn: app.nameEn || app.name || "",
              batch: app.batch,
              totalScore: app.totalScore,
              email: app.email,
              examDate: app.examDate,
            };
          },
        );

        if (mounted) {
          setStudents(mapped);
          const initial: Record<string, string> = {};
          mapped.forEach((s) => {
            initial[s.id] =
              s.totalScore !== undefined && s.totalScore !== null
                ? String(s.totalScore)
                : "";
          });
          setScores(initial);
        }
      } catch (err) {
        console.error("Failed to load students for input", err);
        toast.error("Failed to load students");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const handleSaveAll = async () => {
    // Save all current scores
    if (students.length === 0) return;
    setSavingAll(true);
    try {
      const calls = students.map((student) => {
        const raw = scores[student.id];
        const num = raw !== undefined && raw !== "" ? parseFloat(raw) : 0;
        return apiClient.put(
          API_ENDPOINTS.UPDATE_SCORE(String(student.examId)),
          {
            applicationId: student.id,
            totalScore: num,
          },
        );
      });

      const results = await Promise.allSettled(calls);
      const successCount = results.filter(
        (r) => r.status === "fulfilled",
      ).length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(`Saved ${successCount} score(s)`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} save(s) failed`);
        console.error(
          "Some saves failed",
          results.filter((r) => r.status === "rejected"),
        );
      }
    } catch (err) {
      console.error("Failed to save all scores", err);
      toast.error("Failed to save scores");
    } finally {
      setSavingAll(false);
    }
  };

  const handleChange = (studentId: string, val: string) => {
    if (val !== "" && !/^\d*\.?\d*$/.test(val)) return;
    if (val !== "" && parseFloat(val) > 100) return;
    // Only update local state; do not auto-save per-row. Use "Save All" to persist.
    setScores((prev) => ({ ...prev, [studentId]: val }));
  };

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Input Scores (Session {sessionId})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record and persist examination grades for candidate examinees
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-full border border-border/80">
            {students.length} student{students.length === 1 ? "" : "s"}
          </Badge>
          <Button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="h-9 px-4 text-xs font-medium bg-primary text-white hover:bg-primary/90 rounded-[6px] shadow-sm cursor-pointer"
          >
            {savingAll ? "Saving..." : "Save All"}
          </Button>
        </div>
      </div>

      <div
        className="rounded-md border overflow-auto"
        style={{ maxHeight: "calc(100vh - 250px)" }}
      >
        <table className="w-full text-sm">
          <thead className="bg-primary">
            <tr>
              <th className="px-6 py-3 text-left text-white">ID</th>
              <th className="px-6 py-3 text-left text-white">Name</th>
              <th className="px-6 py-3 text-left text-white">Email</th>
              <th className="px-6 py-3 text-left text-white">Exam Date</th>
              <th className="px-6 py-3 text-left text-white">Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td className="px-6 py-2">{s.number}</td>
                  <td className="px-6 py-2">{s.nameEn}</td>
                  <td className="px-6 py-2">{s.email}</td>
                  <td className="px-6 py-2">
                    {s.examDate
                      ? new Date(s.examDate).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="px-6 py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={scores[s.id] ?? ""}
                        onChange={(e) => handleChange(s.id, e.target.value)}
                        className="w-28"
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end text-white">
        <Button onClick={() => router.back()}>Done</Button>
      </div>
    </div>
  );
}
