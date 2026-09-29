"use client";

import * as React from "react";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";

interface EvaluationFormProps {
  studentId: string;
  examId?: string;
  initialData?: EvaluationData;
  onSave?: (evaluation: EvaluationData) => void;
  className?: string;
}

export interface EvaluationData {
  // allow dynamic criterion keys from server
  [key: string]: unknown;
  totalScore: number;
  examId?: string;
  criteriaId?: string;
  comments: string;
  evaluatedBy: string;
  evaluatedAt: Date;
}
interface StoredStudent {
  id: string;
  name?: string;
  email?: string;
  status?: string;
  evaluation?: EvaluationData;
  evaluations?: EvaluationData[];
  [key: string]: unknown; // for other dynamic properties
}
export function EvaluationForm({
  studentId,
  examId,
  initialData,
  onSave,
  className,
}: EvaluationFormProps) {
  const [criteria, setCriteria] = React.useState<
    Array<{ id?: string; key: string; label: string; maxScore?: number }>
  >([]);
  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [, setLoadingCriteria] = React.useState(false);
  const [comments, setComments] = React.useState(initialData?.comments || "");
  const [evaluatedBy, setEvaluatedBy] = React.useState(
    initialData?.evaluatedBy || "",
  );
  const [isSaving, setIsSaving] = React.useState(false);

  // Calculate total score
  const totalScore = React.useMemo(() => {
    return Object.values(scores).reduce(
      (sum, score) => sum + (Number(score) || 0),
      0,
    );
  }, [scores]);

  // Handle score change with validation (0 - maxScore)
  const handleScoreChange = (criterionKey: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const crit = criteria.find((c) => c.key === criterionKey);
    const max = crit?.maxScore ?? 100;
    const validatedValue = Math.min(Math.max(numValue, 0), max);
    setScores((prev) => ({ ...prev, [criterionKey]: validatedValue }));
  };

  // helper: convert label to camelCase key
  const toKey = (label: string) =>
    label
      .replace(/[^a-zA-Z0-9 ]/g, " ")
      .split(/\s+/)
      .map((w, i) =>
        i === 0
          ? w.toLowerCase()
          : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
      )
      .join("");

  // Load criteria from API on mount
  React.useEffect(() => {
    let mounted = true;
    async function loadCriteria() {
      setLoadingCriteria(true);
      try {
        const res = await apiClient.get(API_ENDPOINTS.CITERIA as string);
        const payload = res?.data?.data ?? res?.data ?? [];
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);

        const mapped = (items as Array<Record<string, unknown>>).map(
          (c: Record<string, unknown>) => {
            const label = String(c.name ?? c.label ?? c.title ?? c);
            const rawId = c.id ?? c.criteriaId ?? c._id;
            const id = rawId != null ? String(rawId) : undefined;
            const rawMax = c.maxScore ?? 20;
            const maxScore = Number(rawMax) || 20;
            return { id, key: toKey(label), label, maxScore };
          },
        );

        if (!mounted) return;
        setCriteria(mapped);

        // Initialize scores using fetched criteria and any initialData matching keys
        const initialScores: Record<string, number> = {};
        mapped.forEach(
          (m: { key: string; label: string; maxScore?: number }) => {
            initialScores[m.key] =
              (initialData &&
                Number((initialData as Record<string, unknown>)[m.key])) ||
              0;
          },
        );
        setScores(initialScores);
      } catch (err) {
        console.error("Failed to load evaluation criteria", err);
      } finally {
        setLoadingCriteria(false);
      }
    }

    loadCriteria();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const evaluationData: EvaluationData = {
      ...scores,
      totalScore,
      examId,
      comments,
      evaluatedBy,
      evaluatedAt: new Date(),
    };

    try {
      // Get existing students from localStorage
      const storedStudents = localStorage.getItem("applicants");
      if (storedStudents) {
        const students = JSON.parse(storedStudents);

        // Find and update the student's evaluation(s)
        const updatedStudents = students.map((student: StoredStudent) => {
          if (student.id === studentId) {
            const existingEvals =
              (student.evaluations as EvaluationData[]) || [];
            const newEvals = [...existingEvals, evaluationData];
            return {
              ...student,
              evaluation: evaluationData, // keep latest for compatibility
              evaluations: newEvals,
            };
          }
          return student;
        });

        // Save back to localStorage
        localStorage.setItem("applicants", JSON.stringify(updatedStudents));
      }

      // Call API for each criterion score in sequence
      for (const criterion of criteria) {
        const score = scores[criterion.key];
        if (score !== undefined && score !== null) {
          const payload = {
            examId,
            criteriaId: criterion.id ?? criterion.key,
            score,
          };
          try {
            await apiClient.put(API_ENDPOINTS.EVALUATION as string, payload);
          } catch (err) {
            console.error("Failed to save criterion score", payload, err);
            throw err; // Re-throw to trigger error handling below
          }
        }
      }

      // Call parent callback if provided
      if (onSave) {
        onSave(evaluationData);
      }

      // Clear the form after successful save so the evaluator can enter a new one
      setScores({
        attitudeAndLeadership: 0,
        academicPreparation: 0,
        programFit: 0,
        motivationAndInterests: 0,
        communicationSkills: 0,
      });
      setComments("");
      setEvaluatedBy("");

      toast.success("Evaluation saved successfully!");
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast.error("Failed to save evaluation. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // If criteria haven't loaded yet, show placeholders (optional)
  const renderCriteria =
    criteria.length > 0
      ? criteria
      : [{ key: "loading1", label: "Criterion 1", maxScore: 20 }];

  return (
    <div className={className}>
      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Interview Evaluation</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Score each criterion from 0 to 20 points
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Evaluator Name */}
          {/* <div>
            <Label
              htmlFor="evaluatedBy"
              className="text-sm font-medium mb-2 block"
            >
              Evaluator Na *
            </Label>
            <Input
              id="evaluatedBy"
              value={evaluatedBy}
              onChange={(e) => setEvaluatedBy(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full"
            />
          </div> */}

          {/* Evaluation Criteria */}
          <div className="space-y-4">
            {renderCriteria.map((criterion) => (
              <div key={criterion.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={criterion.key}
                    className="text-sm font-medium"
                  >
                    {criterion.label}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={criterion.key}
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      value={scores[criterion.key] ?? ""}
                      onChange={(e) =>
                        handleScoreChange(criterion.key, e.target.value)
                      }
                      className="w-16 h-9 text-center text-sm"
                      required
                    />
                    <span className="text-xs text-muted-foreground w-8">/ 20</span>
                  </div>
                </div>
                {/* Score bar visualization */}
                <div className="w-full bg-accent rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${((scores[criterion.key] ?? 0) / (criterion.maxScore ?? 20)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Total Score */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total Score</span>
              <span className="text-2xl font-bold text-primary">
                {totalScore} / 100
              </span>
            </div>
            <div className="w-full bg-card rounded-full h-3 mt-2">
              <div
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${totalScore}%` }}
              />
            </div>
          </div>

          {/* Comments */}
          {/* <div>
            <Label
              htmlFor="comments"
              className="text-sm font-medium mb-2 block"
            >
              Additional Comments
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any additional observations or comments about the candidate..."
              className="min-h-[120px] resize-none"
            />
          </div> */}

          {/* Previous Evaluation Info */}
          {initialData?.evaluatedAt && (
            <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
              <p>
                Last evaluated by{" "}
                <span className="font-medium">{initialData.evaluatedBy}</span>{" "}
                on{" "}
                {new Date(initialData.evaluatedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            {isSaving ? "Saving..." : "Save Evaluation"}
          </Button>
        </form>
      </div>
    </div>
  );
}
