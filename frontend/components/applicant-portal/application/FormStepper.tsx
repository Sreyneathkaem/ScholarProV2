"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Personal Info", shortLabel: "1" },
  { label: "Parents/Guardians", shortLabel: "2" },
  { label: "Education", shortLabel: "3" },
  { label: "Applied Program", shortLabel: "4" },
  { label: "Review & Submit", shortLabel: "5" },
];

interface FormStepperProps {
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
}

export default function FormStepper({
  currentStep,
  completedSteps = [],
  onStepClick,
}: FormStepperProps) {
  return (
    <nav
      aria-label="Registration Progress"
      className="w-full overflow-x-auto py-6 px-2 sm:px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex items-center justify-center min-w-0 max-w-full">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isActive = currentStep === stepNumber;
          const showConnectorAsComplete =
            completedSteps.includes(stepNumber) || stepNumber < currentStep;

          return (
            <div key={stepNumber} className="flex items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(stepNumber)}
                className={cn(
                  "group flex flex-col items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e2d6b] rounded-xl px-1.5 py-1 transition-all duration-200 cursor-pointer touch-manipulation select-none",
                  "hover:scale-105 active:scale-95"
                )}
                title={`Step ${stepNumber}: ${step.label}`}
                aria-label={`Go to step ${stepNumber}: ${step.label}${isActive ? " (current step)" : isCompleted ? " (completed)" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex size-9 sm:size-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300",
                    isActive
                      ? isCompleted
                        ? "border-white bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110 ring-4 ring-white/30"
                        : "border-white bg-white text-[#1e2d6b] shadow-lg shadow-white/25 scale-110 ring-4 ring-white/30"
                      : isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30 group-hover:ring-4 group-hover:ring-emerald-400/20"
                        : "border-amber-400/70 bg-amber-400/20 text-amber-200 group-hover:bg-amber-400/30 group-hover:border-amber-400 group-hover:ring-2 group-hover:ring-amber-400/20"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4 sm:size-5" strokeWidth={2.5} />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Full label - visible on sm+ */}
                <span
                  className={cn(
                    "hidden sm:block text-[11px] font-medium text-center w-20 leading-tight transition-colors duration-300",
                    isActive
                      ? "text-white font-bold drop-shadow-xs"
                      : isCompleted
                        ? "text-emerald-300 group-hover:text-emerald-200"
                        : "text-amber-200/80 group-hover:text-amber-100"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <div className="relative -mt-4 sm:-mt-5 h-0.5 w-6 sm:w-10 md:w-16 mx-0.5 sm:mx-1">
                  <div className="absolute inset-0 bg-amber-400/30 rounded-full" />
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full transition-all duration-500",
                      showConnectorAsComplete || isCompleted ? "bg-emerald-500 w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}