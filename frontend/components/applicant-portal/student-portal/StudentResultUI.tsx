"use client";

import { Trophy, CheckCircle2, Download, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SCORES = [
  { subject: "Mathematics", score: 82, total: 100, grade: "B+", passMark: 60 },
  { subject: "English", score: 91, total: 100, grade: "A", passMark: 60 },
  { subject: "Interview", score: 88, total: 100, grade: "A-", passMark: 60 },
];

const SCHOLARSHIP_AWARD = {
  type: "Full Scholarship",
  duration: "4 Years",
  coverage: ["Tuition (100%)", "Monthly Stipend $150", "Study Materials"],
};

const ANNOUNCED_DATE = "August 25, 2025";
const OVERALL_PASSED = true;

export default function StudentResultUI() {
  const handleDownload = () => {
    toast.success("Downloading official scholarship award letter...");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            Scholarship Results
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Announced on {ANNOUNCED_DATE}</p>
        </div>
      </div>

        {/* Overall Result Banner */}
        <div 
          className="relative overflow-hidden rounded-lg p-6 sm:p-7 text-white shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] border border-primary/30 bg-gradient-to-r from-[#0F386C] via-[#164a8a] to-[#1E3A5F]"
        >
          {/* Subtle decorative background shapes */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Elegant Trophy Icon */}
            <div className="shrink-0">
              <div className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-white/10 ring-1 ring-white/20 backdrop-blur-xs">
                <Trophy className="h-7 w-7 text-amber-300" strokeWidth={1.5} />
              </div>
            </div>
            
            {/* Banner Content */}
            <div className="flex-1">
              <p className="text-xs font-medium text-white/80">
                Official Status
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {OVERALL_PASSED ? "Congratulations!" : "Result: Not Passed"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/90 max-w-xl">
                You have successfully passed the evaluation and have been awarded a{" "}
                <span className="font-semibold text-white underline underline-offset-4 decoration-amber-300/80">
                  Full Scholarship
                </span>.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          
          {/* Score Breakdown */}
          <div className="lg:col-span-3 rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" />
                Score Breakdown
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {SCORES.length} Subjects
              </Badge>
            </div>
            
            <div className="space-y-5">
              {SCORES.map((item) => (
                <div key={item.subject} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground">
                      {item.subject}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-normal text-muted-foreground tabular-nums">
                        {item.score}
                        <span className="text-muted-foreground/50">/{item.total}</span>
                      </span>
                      <Badge
                        variant={item.grade.startsWith("A") ? "success" : "info"}
                      >
                        {item.grade}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
                      style={{ 
                        width: `${(item.score / item.total) * 100}%`
                      }}
                    />
                  </div>
                  
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Pass mark: {item.passMark}</span>
                    <span>{Math.round((item.score / item.total) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scholarship Award */}
          <div className="lg:col-span-2 rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] flex flex-col">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-5">
              <Award className="size-4 text-primary" />
              Award Details
            </h2>

            <div className="space-y-3.5 flex-1">
              <div className="flex items-center justify-between p-3 rounded-[6px] bg-muted/40 border border-border/80">
                <span className="text-xs text-muted-foreground">Award Type</span>
                <span className="text-xs font-semibold text-foreground">
                  {SCHOLARSHIP_AWARD.type}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[6px] bg-muted/40 border border-border/80">
                <span className="text-xs text-muted-foreground">Duration</span>
                <span className="text-xs font-semibold text-foreground">
                  {SCHOLARSHIP_AWARD.duration}
                </span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2.5">
                  Coverage Includes
                </p>
                <ul className="space-y-2">
                  {SCHOLARSHIP_AWARD.coverage.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-xs text-foreground"
                    >
                      <div 
                        className="flex size-4 items-center justify-center rounded-full bg-[#f6ffed] text-[#52c41a] dark:bg-[#162312] dark:text-[#49aa19] shrink-0"
                      >
                        <CheckCircle2 
                          className="size-3" 
                        />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Download Button */}
            <Button
              onClick={handleDownload}
              size="lg"
              className="mt-6 w-full gap-2 rounded-[6px]"
            >
              <Download className="size-4" />
              Download Award Letter
            </Button>
          </div>
        </div>
      </div>
  );
}