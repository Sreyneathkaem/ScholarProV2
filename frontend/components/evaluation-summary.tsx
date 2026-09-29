"use client";

import * as React from "react";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ChevronRight, User } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

interface InterviewCriteria {
  criteriaId: number;
  criteriaName: string;
  weight: number;
  score: number;
}

interface InterviewCommittee {
  committeeId: string;
  committeeName: string;
  totalScore: number;
  criterias: InterviewCriteria[];
}

interface InterviewEvaluation {
  totalFinalScore?: number;
  averageCommitteeScore?: number;
  committees: InterviewCommittee[];
}

interface EvaluationSummaryProps {
  applicationId?: number | string;
  compact?: boolean;
}

export function EvaluationSummary({
  applicationId,
  compact = false,
}: EvaluationSummaryProps) {
  const [interview, setInterview] = React.useState<InterviewEvaluation | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      if (!applicationId) return;
      setLoading(true);
      try {
        const res = await apiClient.get(
          `${API_ENDPOINTS.FINAL_SCORE}?applicationId=${encodeURIComponent(String(applicationId))}`,
        );

        type ApiCriteria = {
          criteriaId?: number;
          criteriaName?: string;
          weight?: number;
          score?: number;
        };

        type ApiCommittee = {
          committeeId?: string;
          committeeName?: string;
          totalScore?: number;
          criterias?: ApiCriteria[];
        };

        type ApiSubject = {
          subjectId?: number;
          subjectName?: string;
          score?: number;
          committees?: ApiCommittee[];
        };

        type ApiApplication = {
          applicationId?: number | string;
          subjects?: ApiSubject[];
          totalFinalScore?: number;
        };

        const dataList: unknown = res.data?.data ?? res.data;
        if (!dataList) return;

        let application: ApiApplication | undefined;
        if (Array.isArray(dataList)) {
          const arr = dataList as ApiApplication[];
          application =
            arr.find(
              (a) => String(a.applicationId) === String(applicationId),
            ) || arr[0];
        } else {
          application = dataList as ApiApplication;
        }
        if (!application) return;

        const subject = (application.subjects ?? []).find((s) => {
          if (!s) return false;
          const name =
            typeof s.subjectName === "string"
              ? s.subjectName.toLowerCase()
              : "";
          return name.includes("interview") || s.subjectId === 3;
        });

        if (subject) {
          const committees: InterviewCommittee[] = (
            subject.committees ?? []
          ).map((c) => ({
            committeeId: String(c.committeeId ?? ""),
            committeeName: String(c.committeeName ?? ""),
            totalScore: typeof c.totalScore === "number" ? c.totalScore : 0,
            criterias: (c.criterias ?? []).map((cr) => ({
              criteriaId: Number(cr.criteriaId ?? 0),
              criteriaName: String(cr.criteriaName ?? ""),
              weight: typeof cr.weight === "number" ? cr.weight : 0,
              score: typeof cr.score === "number" ? cr.score : 0,
            })),
          }));

          const averageCommitteeScore =
            typeof subject.score === "number"
              ? subject.score
              : committees.length
                ? committees.reduce(
                    (s, c) =>
                      s + (typeof c.totalScore === "number" ? c.totalScore : 0),
                    0,
                  ) / committees.length
                : undefined;

          setInterview({
            totalFinalScore:
              typeof application.totalFinalScore === "number"
                ? application.totalFinalScore
                : undefined,
            averageCommitteeScore,
            committees,
          });
        } else if (typeof application.totalFinalScore === "number") {
          setInterview({
            totalFinalScore: application.totalFinalScore,
            averageCommitteeScore: application.totalFinalScore,
            committees: [],
          });
        }
      } catch (err) {
        console.error("Failed to load interview evaluation", err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [applicationId]);

  if (loading)
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Loading interview evaluation...
      </Card>
    );

  if (!interview) {
    return (
      <Card className="p-4 bg-muted border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ClipboardCheck className="h-4 w-4" />
          <span className="text-sm">No interview available</span>
        </div>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Interview Score</span>
          <Badge variant="outline" className="font-bold text-lg">
            {interview.averageCommitteeScore ??
              interview.totalFinalScore ??
              "-"}
          </Badge>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Interview Evaluation</h3>
      </div>

      <Card className="p-4 bg-muted">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Average Committee Score</span>
          <Badge className="text-base text-white font-bold">
            {interview.averageCommitteeScore ?? "-"}
          </Badge>
        </div>
        {typeof interview.averageCommitteeScore === "number" && (
          <div className="mt-2 text-sm text-muted-foreground">
            Total Final Score:{" "}
            <span className="font-medium">
              {interview.averageCommitteeScore}
            </span>
          </div>
        )}
      </Card>

      {interview.committees.map((committee) => (
        <Card key={committee.committeeId} className="p-4">
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-bold">
                    {committee.totalScore}
                  </Badge>
                  <div>
                    <div className="text-sm font-medium">
                      {committee.committeeName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Committee Evaluation
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform" />
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="mt-4 space-y-3 px-2">
                {committee.criterias.map((c) => (
                  <div
                    key={c.criteriaId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">
                      {c.criteriaName}
                    </span>
                    <span className="text-sm font-medium">
                      {typeof c.score === "number" ? `${c.score}/20` : ""}
                    </span>
                  </div>
                ))}

                <div className="pt-3 border-t text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Evaluated by{" "}
                  <span className="font-medium">{committee.committeeName}</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  );
}
