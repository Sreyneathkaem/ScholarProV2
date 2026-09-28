"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useHeader } from "@/components/header/header-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { toast } from "sonner";

interface Student {
  id: string;
  examId?: string;
  number: string;
  nameEn: string;
  batch?: string;
  email?: string;
  examDate?: Date;
  totalScore?: number | null;
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

export default function ScoreEntrySessionPage() {
  const { sessionId } = useParams();
  const { setTitle } = useHeader();

  const [students, setStudents] = useState<Student[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingScore, setEditingScore] = useState<string>("");
  const [, setEditingLoading] = useState(false);

  const [selectedBatch] = useState("all");
  const [, setScores] = useState<Record<string, ScoreEntry>>({});
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    setTitle(`Score Entry – Session ${sessionId}`);
  }, [setTitle, sessionId]);

  const router = useRouter();

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
            examScore: st.examScore ?? null,

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

  const filteredStudents =
    selectedBatch === "all"
      ? students
      : students.filter((s) => s.batch === selectedBatch);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Session {sessionId} Scores
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage applicant examinees and update examination session test results
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-full border border-border/80">
            {filteredStudents.length} candidate{filteredStudents.length === 1 ? "" : "s"}
          </Badge>
          <Button
            variant="default"
            onClick={() => router.push(`/score/${sessionId}/input`)}
            className="h-9 px-4 text-xs font-medium bg-primary text-white hover:bg-primary/90 rounded-[6px] shadow-sm cursor-pointer"
          >
            Input Scores
          </Button>
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
                  <td colSpan={3} className="py-10 text-center text-gray-500">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300" />
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-2">{student.number}</td>
                    <td className="px-6 py-2">{student.nameEn}</td>
                    <td className="px-6 py-2">{student.email}</td>
                    <td className="px-6 py-2">
                      {student.examDate
                        ? new Date(student.examDate).toLocaleDateString()
                        : ""}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-5">
                        <span>{student.examScore}</span>
                        <Button
                          className="text-primary"
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setEditingId(student.id);
                            setEditingLoading(true);
                            try {
                              const res = await apiClient.get(
                                API_ENDPOINTS.LIST_STUDENTS(
                                  String(sessionId),
                                ) as string,
                              );
                              const payload =
                                res?.data?.data ?? res?.data ?? [];
                              const items = Array.isArray(payload)
                                ? payload
                                : (payload?.items ?? []);
                              const found = items.find(
                                (it: Record<string, unknown>) =>
                                  String(
                                    it["applicationId"] ??
                                      it["id"] ??
                                      it["studentId"] ??
                                      it["appId"] ??
                                      it["number"],
                                  ) === String(student.id),
                              );
                              const defaultScore =
                                (found &&
                                  (found["totalScore"] ??
                                    found["score"] ??
                                    found["examScore"])) ??
                                student.totalScore ??
                                "";
                              setEditingScore(
                                defaultScore !== undefined &&
                                  defaultScore !== null
                                  ? String(defaultScore)
                                  : "",
                              );
                            } catch (err) {
                              console.error(
                                "Failed to load default score",
                                err,
                              );
                              setEditingScore(
                                student.totalScore !== undefined &&
                                  student.totalScore !== null
                                  ? String(student.totalScore)
                                  : "",
                              );
                            } finally {
                              setEditingLoading(false);
                            }
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-black">Edit Score</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={editingScore}
              onChange={(e) => setEditingScore(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button
              className="text-white"
              onClick={async () => {
                if (!editingId) return;
                if (editingScore !== "" && !/^\d*\.?\d*$/.test(editingScore))
                  return toast.error("Invalid score");
                const student = students.find((s) => s.id === editingId);
                if (!student) return;
                try {
                  await apiClient.put(
                    API_ENDPOINTS.UPDATE_SCORE(String(student.examId)),
                    {
                      applicationId: student.id,
                      totalScore: editingScore ? parseFloat(editingScore) : 0,
                    },
                  );
                  toast.success("Score updated");
                  setStudents((prev) =>
                    prev.map((s) =>
                      s.id === student.id
                        ? {
                            ...s,
                            totalScore: editingScore
                              ? parseFloat(editingScore)
                              : 0,
                          }
                        : s,
                    ),
                  );
                  setEditingId(null);
                } catch (err) {
                  console.error("Failed to update score", err);
                  toast.error("Failed to update score");
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
