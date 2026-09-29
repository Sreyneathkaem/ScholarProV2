"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet } from "lucide-react";
import { useHeader } from "@/components/header/header-context";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";

import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  examId?: string;
  number: string;
  nameEn: string;
  batch?: string;
  totalScore?: number | null;
  email?: string;
  examDate?: Date;
  examScore?: number | null;
}

interface ScoreEntry {
  studentId: string;
  studentNumber: string;
  name: string;
  totalScore: string;
  email?: string;
  examDate?: Date;
  examScore?: number | null;
}

export default function SessionEntrySessionPage() {
  const { sessionId } = useParams();
  const { setTitle } = useHeader();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);

  const [selectedBatch] = useState("all");
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [, setScores] = useState<Record<string, ScoreEntry>>({});

  useEffect(() => {
    setTitle(`Interview Entry – Session ${sessionId}`);
  }, [setTitle, sessionId]);

  // Load students based on session ID
  useEffect(() => {
    async function loadStudents() {
      setLoadingStudents(true);

      try {
        const res = await apiClient.get(
          API_ENDPOINTS.LIST_STUDENTS(String(sessionId)),
        );
        const payload = res?.data?.data ?? res?.data ?? [];
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);

        const mapped: Student[] = items.map(
          (app: Record<string, unknown>, index: number) => {
            const rawId =
              app.applicationId ??
              app.id ??
              app.studentId ??
              app._id ??
              app.appId ??
              app.number ??
              "";

            const id = rawId ? String(rawId) : `${sessionId}-${index}`;

            return {
              id,
              examId: String(app.examId ?? app.sessionId ?? sessionId),
              number: app.number || app.appId || `APP-${id}`,
              nameEn: app.nameEn || app.name || "",
              batch: app.batch,
              totalScore: app.totalScore,
              email: app.email,
              examDate: app.examDate,
              examScore: app.examScore ?? null,
            };
          },
        );

        setStudents(mapped);

        // const uniqueBatches = Array.from(
        //   new Set(mapped.map(s => s.batch).filter(Boolean))
        // );

        // setBatches(uniqueBatches);

        // Prepare score map
        const initialScores: Record<string, ScoreEntry> = {};
        mapped.forEach((st) => {
          initialScores[st.id] = {
            studentId: st.id,
            studentNumber: st.number,
            name: st.nameEn,
            email: st.email,
            examDate: st.examDate,
            examScore: st.examScore,
            totalScore:
              st.totalScore !== undefined ? String(st.totalScore) : "",
          };
        });

        setScores(initialScores);
      } catch (err) {
        console.error("Failed to load students", err);
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, [sessionId]);

  // Save score with debounce

  // Note: score saving handled elsewhere; removed unused function to satisfy linter

  const filteredStudents =
    selectedBatch === "all"
      ? students
      : students.filter((s) => s.batch === selectedBatch);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Session {sessionId} Interviews
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate scheduled candidate interviews and input criteria scores
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-full border border-border/80">
            {filteredStudents.length} candidate{filteredStudents.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div
          className="overflow-auto"
          style={{ maxHeight: "calc(100vh - 250px)" }}
        >
          <table className="w-full text-sm">
            <thead className="bg-primary">
              <tr>
                <th className="px-6 py-3 text-left text-white">Applicant ID</th>
                <th className="px-6 py-3 text-left text-white">Name</th>
                <th className="px-6 py-3 text-left text-white"> Email</th>
                <th className="px-6 py-3 text-left text-white">ExamDate</th>
                <th className="px-6 py-3 text-left text-white">Score</th>
                <th className="px-6 py-3 text-left text-white">Input Score</th>
              </tr>
            </thead>

            <tbody>
              {loadingStudents ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center">
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-muted-foreground">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground" />
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-2">{student.number}</td>

                    <td className="px-6 py-2">
                      <Link
                        href={
                          student.examId
                            ? `/applicant/${student.id}?examId=${encodeURIComponent(String(student.examId))}`
                            : `/applicant/${student.id}`
                        }
                        className="text-blue-600 underline"
                      >
                        {student.nameEn}
                      </Link>
                    </td>

                    {/* <td className="px-6 py-2">{student.nameEn}</td> */}
                    <td className="px-6 py-2">{student.email}</td>
                    <td className="px-6 py-2">
                      {student.examDate
                        ? new Date(student.examDate).toLocaleDateString()
                        : ""}
                    </td>

                    <td className="px-6 py-2">{student.examScore}</td>
                    <td className="px-6 py-2">
                      {/* <Input
                        type="text"
                        value={scores[student.id]?.totalScore || ""}
                        placeholder="0-100"
                        onChange={(e) =>
                          handleScoreChange(student.id, e.target.value)
                        }
                        className="w-28"
                      /> */}

                      <Button
                        onClick={() =>
                          router.push(
                            student.examId
                              ? `/applicant/${student.id}?examId=${encodeURIComponent(
                                  String(student.examId),
                                )}`
                              : `/applicant/${student.id}`,
                          )
                        }
                        className="w-28 text-white"
                      >
                        Enter Score
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
