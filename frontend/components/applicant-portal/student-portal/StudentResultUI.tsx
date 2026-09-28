"use client";

import { Trophy, CheckCircle2, Download, Award, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// Score breakdown data
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
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8 font-sans antialiased text-foreground">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Page Header */}
        <header className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-primary">
            <Award className="size-5" />
            <span className="text-xs font-bold tracking-widest uppercase">
              Academic Outcomes
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Scholarship Results
          </h1>
          <p className="text-muted-foreground text-sm">Announced on {ANNOUNCED_DATE}</p>
        </header>

        {/* Overall Result Banner */}
        <div 
          className="relative overflow-hidden rounded-3xl p-8 text-white shadow-xl border border-primary/20 bg-gradient-to-br from-[#10386B] via-[#162e58] to-[#141f4d] dark:from-[#0c203b] dark:via-[#10294d] dark:to-[#071324]"
        >
          {/* Subtle decorative background shapes */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            {/* Elegant Trophy Icon */}
            <div className="shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm shadow-inner">
                <Trophy className="h-8 w-8 text-amber-300" strokeWidth={1.5} />
              </div>
            </div>
            
            {/* Banner Content */}
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">
                Official Status
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {OVERALL_PASSED ? "Congratulations!" : "Result: Not Passed"}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-blue-100/90 max-w-xl">
                You have successfully passed the evaluation and have been awarded a{" "}
                <span className="font-semibold text-white underline underline-offset-4 decoration-amber-400/60">
                  Full Scholarship
                </span>.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid gap-6 lg:grid-cols-5">
          
          {/* Score Breakdown */}
          <div className="lg:col-span-3 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="size-5 text-primary" />
                Score Breakdown
              </h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {SCORES.length} Subjects
              </Badge>
            </div>
            
            <div className="space-y-6">
              {SCORES.map((item) => (
                <div key={item.subject} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">
                      {item.subject}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground tabular-nums">
                        {item.score}
                        <span className="text-muted-foreground/50">/{item.total}</span>
                      </span>
                      <Badge
                        variant={item.grade.startsWith("A") ? "success" : "info"}
                        className="font-bold"
                      >
                        {item.grade}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-700 ease-out"
                      style={{ 
                        width: `${(item.score / item.total) * 100}%`
                      }}
                    />
                  </div>
                  
                  <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                    <span>Pass mark: {item.passMark}</span>
                    <span>{Math.round((item.score / item.total) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scholarship Award */}
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs flex flex-col">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
              <Award className="size-5 text-primary" />
              Award Details
            </h2>

            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-sm text-muted-foreground">Award Type</span>
                <span className="text-sm font-bold text-foreground">
                  {SCHOLARSHIP_AWARD.type}
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-bold text-foreground">
                  {SCHOLARSHIP_AWARD.duration}
                </span>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Coverage Includes
                </p>
                <ul className="space-y-2.5">
                  {SCHOLARSHIP_AWARD.coverage.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 text-sm text-foreground"
                    >
                      <div 
                        className="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shrink-0"
                      >
                        <CheckCircle2 
                          className="size-3.5" 
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
              className="mt-8 w-full gap-2"
            >
              <Download className="size-4" />
              Download Award Letter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}