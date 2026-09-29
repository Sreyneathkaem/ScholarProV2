"use client";
import * as React from "react";
import { Section } from "./Section";
import { useFinalScore } from "@/hooks/useFinalScore";

interface ResultSectionProps {
  applicationId?: string;
  evaluations?: { totalScore: number }[];
  evaluation?: { totalScore: number };
  mathScore?: number;
  englishScore?: number;
}

export function ResultSection({ data }: { data: ResultSectionProps }) {
  const evals = data.evaluations || (data.evaluation ? [data.evaluation] : []);
  const evalCount = evals?.length || 0;

  // Local fallbacks (used if API doesn't return some fields)
  const localInterviewAvg = evalCount
    ? Math.round(
        evals.reduce((s, e) => s + (e?.totalScore || 0), 0) / evalCount,
      )
    : data.evaluation?.totalScore || 0;

  const localMathScore = Number(data.mathScore || 0);
  const localEnglishScore = Number(data.englishScore || 0);
  const localFinalTotal =
    localInterviewAvg + localMathScore + localEnglishScore;

  const {
    data: finalData,
    loading: loadingFinal,
    error,
  } = useFinalScore(data.applicationId);

  const remoteInterview = finalData?.interviewScore ?? null;
  const remoteMath = finalData?.mathScore ?? null;
  const remoteEnglish = finalData?.englishScore ?? null;
  const remoteFinal = finalData?.finalScore ?? null;
  // const remoteBatchRank = finalData?.batchRank ?? null;
  const remoteBatchTotal = finalData?.batchTotal ?? null;

  const displayedInterview = remoteInterview ?? localInterviewAvg;
  const displayedMath = remoteMath ?? localMathScore;
  const displayedEnglish = remoteEnglish ?? localEnglishScore;
  const displayedFinal = remoteFinal ?? localFinalTotal;
  // const displayedRank = remoteBatchRank ?? null;
  const displayedTotal = remoteBatchTotal ?? null;

  React.useEffect(() => {
    console.debug("useFinalScore result:", finalData, "error:", error);
  }, [finalData, error]);

  return (
    <>
      <Section title="Result" defaultOpen={true}>
        <div className="col-span-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <div>
                <div className="text-sm text-muted-foreground">Interview Score</div>
                <div className="text-lg text-foreground">
                  {loadingFinal ? "—" : displayedInterview}/100
                </div>
                {/* {displayedInterviewWeight != null && (
                  <div className="text-xs text-muted-foreground">
                    Weight: {displayedInterviewWeight}
                  </div>
                )} */}
                {evalCount > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Based on {evalCount} committee{evalCount > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1">
              <p className="text-sm text-muted-foreground mb-1">Math Score</p>
              <p className="text-lg text-foreground">
                {loadingFinal ? "—" : `${displayedMath}/100`}
              </p>
            </div>

            <div className="col-span-1">
              <p className="text-sm text-muted-foreground mb-1">English Score</p>
              <p className="text-lg text-foreground">
                {loadingFinal ? "—" : `${displayedEnglish}/100`}
              </p>
            </div>

            <div className="col-span-3">
              <div className="pt-4 border-t flex items-center justify-between">
                <div>
                  <span className="text-sm text-muted-foreground">Final Total</span>
                  <div className="text-3xl font-extrabold">
                    {loadingFinal ? "—" : displayedFinal}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    {/* <div className="bg-[var(--primary)] text-white px-4 py-2 mt-4 rounded-full text-sm font-semibold shadow">
                      {loadingFinal
                        ? "—"
                        : displayedRank != null
                          ? `Rank ${displayedRank}`
                          : "Rank —"}
                    </div> */}
                    <div className="text-xs text-muted-foreground mt-2">
                      {/* of{" "} */}
                      {loadingFinal
                        ? "—"
                        : displayedTotal != null
                          ? displayedTotal
                          : "—"}{" "}
                      {/* in this batch */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
