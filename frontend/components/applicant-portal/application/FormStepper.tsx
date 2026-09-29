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
  const isStepAccessible = (stepNumber: number) => {
    if (stepNumber === currentStep) return true;
    if (completedSteps.includes(stepNumber)) return true;
    if (stepNumber < currentStep) return true;
    // To access a future step, all previous steps must be completed
    for (let i = 1; i < stepNumber; i++) {
      if (!completedSteps.includes(i)) return false;
    }
    return true;
  };

  return (
    <nav
      aria-label="Registration Progress"
      className="w-full overflow-x-auto py-2.5 px-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex items-center justify-center min-w-0 max-w-full">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isActive = currentStep === stepNumber;
          const isAccessible = isStepAccessible(stepNumber);
          const showConnectorAsComplete = completedSteps.includes(stepNumber);

          return (
            <div key={stepNumber} className="flex items-center">
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => {
                  if (isAccessible) {
                    onStepClick?.(stepNumber);
                  }
                }}
                className={cn(
                  "group flex flex-col items-center gap-1.5 focus:outline-none rounded-[6px] px-1.5 py-1 transition-all duration-200 select-none",
                  isAccessible
                    ? "cursor-pointer hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/80"
                    : "cursor-not-allowed opacity-40 hover:opacity-40 pointer-events-none sm:pointer-events-auto"
                )}
                title={
                  isAccessible
                    ? `Step ${stepNumber}: ${step.label}`
                    : `Step ${stepNumber}: ${step.label} (Complete previous steps first)`
                }
                aria-label={`Step ${stepNumber}: ${step.label}${isActive ? " (current step)" : isCompleted ? " (completed)" : !isAccessible ? " (locked)" : ""}`}
                aria-current={isActive ? "step" : undefined}
                aria-disabled={!isAccessible}
              >
                <div
                  className={cn(
                    "flex size-8 sm:size-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-200",
                    isActive
                      ? isCompleted
                        ? "border-white bg-[#52c41a] text-white shadow-sm ring-2 ring-white/30"
                        : "border-white bg-card text-[#0F386C] shadow-sm ring-2 ring-white/30"
                      : isCompleted
                        ? "border-[#52c41a] bg-[#52c41a] text-white"
                        : isAccessible
                          ? "border-white/60 bg-white/10 text-white/90 group-hover:border-white"
                          : "border-white/20 bg-white/5 text-white/40"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5 sm:size-4" strokeWidth={2.5} />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Full label - visible on sm+ */}
                <span
                  className={cn(
                    "hidden sm:block text-[11px] text-center w-20 leading-tight transition-colors duration-200",
                    isActive
                      ? "text-white font-semibold"
                      : isCompleted
                        ? "text-white/90 font-medium"
                        : isAccessible
                          ? "text-white/80 font-normal"
                          : "text-white/40 font-normal"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <div className="relative -mt-4 sm:-mt-5 h-[1.5px] w-6 sm:w-12 md:w-20 lg:w-28 mx-0.5 sm:mx-1.5">
                  <div className="absolute inset-0 bg-white/20 rounded-full" />
                  <div
                    className={cn(
                      "absolute inset-0 rounded-full transition-all duration-300",
                      showConnectorAsComplete ? "bg-[#52c41a] w-full" : "w-0"
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
