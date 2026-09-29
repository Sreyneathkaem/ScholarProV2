"use client";

import { useContext, useState, useRef } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ExamFlowContext,
  type RoomSchedule,
  type RoomScheduleForm,
} from "@/components/schedule/exam/flow/ExamFlowProvider";
import BatchSelectionStep from "@/components/schedule/exam/flow/steps/BatchSelectionStep";
import RoomScheduleConfirmation from "@/components/schedule/exam/flow/steps/RoomScheduleConfirmation";
import RoomScheduleCreator, {
  type RoomScheduleCreatorRef,
} from "@/components/schedule/exam/flow/steps/RoomScheduleCreator";
import type { Committee } from "@/types/committee";
import type { CreateExamSessionPayload } from "@/types/schedule";
import { scheduleService } from "@/api/service/schedule.service";
import { toast } from "sonner";

// Type guard for Axios errors with a response property
function isAxiosErrorWithResponse(error: unknown): error is {
  response: { status: number; data: { message: string; data: unknown } };
} {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const err = error as Record<string, unknown>; // Cast to a more general object type
  if (
    !("response" in err) ||
    typeof err.response !== "object" ||
    err.response === null
  ) {
    return false;
  }
  const response = err.response as Record<string, unknown>;
  if (
    !("status" in response) ||
    !("data" in response) ||
    typeof response.data !== "object" ||
    response.data === null
  ) {
    return false;
  }
  const data = response.data as Record<string, unknown>;
  return "message" in data;
}

export interface ExamScheduleData {
  selectedBatch: string; // Keep as string to match context
  selectedDate: Date | undefined;
  selectedRooms: string[];
  selectedCommittee: string[];
  mathStartTime: string;
  mathEndTime: string;
  mathBreakTime: string;
  englishStartTime: string;
  englishEndTime: string;
  englishBreakTime: string;
  roomSchedules: RoomSchedule[];
  // Removed students - this will come from backend when creating exam session
}

interface ExamFlowWizardProps {
  onClose: () => void;
  onComplete: (data: ExamScheduleData) => void;
  // Real API data props (batches now fetched directly in BatchSelectionStep)
  availableCommittees: Committee[];
  // availableFaculties: Faculty[]
  // Helper functions for ID lookup
}

const ExamFlowWizard = ({
  onClose,
  onComplete,
  availableCommittees,
}: ExamFlowWizardProps) => {
  const roomCreatorRef = useRef<RoomScheduleCreatorRef>(null);
  const [isCreating, setIsCreating] = useState(false);

  const examFlowContext = useContext(ExamFlowContext);

  if (!examFlowContext) {
    throw new Error("ExamFlowWizard must be used within an ExamFlowProvider");
  }

  const {
    currentStep,
    setCurrentStep,
    selectedBatch,
    selectedDate,
    selectedRooms,
    roomSchedules,
    selectedCommittee,
    mathStartTime,
    mathEndTime,
    mathBreakTime,
    englishStartTime,
    englishEndTime,
    englishBreakTime,
    roomForm,
  } = examFlowContext;

  const steps = [
    { number: 1, label: "Batch & Date", completed: currentStep > 1 },
    { number: 2, label: "Create Room Schedules", completed: currentStep > 2 },
    { number: 3, label: "Confirm", completed: currentStep > 3 },
  ];

  const handleNext = async () => {
    // Logic for Step 2: Create room before proceeding
    if (currentStep === 2) {
      const isFormEmpty = Object.values(roomForm).every(
        (val) => val === "" || (Array.isArray(val) && val.length === 0),
      );

      // If the form is not empty, it means the user has entered data
      // for a new room. We should try to create it.
      if (!isFormEmpty) {
        // We also check if the form is valid before attempting to create.
        if (isRoomFormValid(roomForm)) {
          const success =
            await roomCreatorRef.current?.handleCreateRoomSchedule();
          // If creation failed (e.g., validation error toast), we stop and don't go to the next step.
          if (!success) {
            return;
          }
        } else {
          // If the form has data but is invalid, we shouldn't proceed.
          // The `canProceed` function already disables the button, but this is a safeguard.
          toast.error(
            "Please fill out all fields correctly before proceeding.",
          );
          return;
        }
      }
    }

    // Proceed to the next step if not blocked
    if (currentStep < 3) {
      window.scrollTo(0, 0);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      window.scrollTo(0, 0);
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to convert time string to ISO string
  const convertTimeToISO = (dateStr: string, timeStr: string): string => {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  // REPLACE the old getCommitteeIds function with this robust version
  const getCommitteeIds = (committeeNames: string[]): string[] => {
    // 1. Log what we are looking for
    console.log("🔍 Looking up IDs for names:", committeeNames);
    console.log("📋 Available Committees:", availableCommittees);

    const ids = committeeNames
      .map((name) => {
        const member = availableCommittees.find((c) => c.name === name);
        if (!member) return undefined;
        return member.id; // This is now a string
      })
      .filter((id): id is string => id !== undefined); // TS Guard: Ensure it's string

    return ids;
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedBatch) {
      toast.error("Missing required data: batch or date");
      return;
    }

    setIsCreating(true);

    try {
      const dateStr = selectedDate.toISOString();
      const batchIdNumber = parseInt(selectedBatch, 10);

      // map returns an array of promises
      const sessionPromises = roomSchedules.map(async (schedule) => {
        // CALCULATE IDs HERE using the new function
        const calculatedCommitteeIds = getCommitteeIds(schedule.committee);

        // BLOCK the request if IDs are missing
        if (calculatedCommitteeIds.length === 0) {
          toast.error(
            `Error: Could not find committee member IDs for room ${schedule.roomName}`,
          );
          setIsCreating(false); // Stop the spinner
          return; // STOP execution
        }
        // Fail early if we lost the committees
        if (
          schedule.committee.length > 0 &&
          calculatedCommitteeIds.length === 0
        ) {
          throw new Error(
            `Could not map committee names to IDs for room: ${schedule.roomName}. Please re-select committees.`,
          );
        }
        const payload: CreateExamSessionPayload = {
          batchId: batchIdNumber,
          sessionName: `${schedule.examType.toUpperCase()} - ${schedule.roomName}`,
          capacity: schedule.capacity,
          location: schedule.location,
          subjectId: schedule.examType === "math" ? 1 : 2,
          examDate: dateStr,
          startTime: convertTimeToISO(dateStr, schedule.startTime),
          endTime: convertTimeToISO(dateStr, schedule.endTime),
          committeeIds: calculatedCommitteeIds, // Convert numbers to strings
        };

        try {
          // Attempt the request - URL parameter should be string, payload batchId should be number
          const response = await scheduleService.createExamSession(
            selectedBatch, // Use original string for URL parameter
            payload,
          );
          if (!response.success) throw new Error(response.message);
          return response.data;
        } catch (err: unknown) {
          // CHECK: If it's a 400 error but the backend said "Create session successfully"
          // We manually extract the data and treat it as success
          if (
            isAxiosErrorWithResponse(err) &&
            err.response.status === 400 &&
            err.response.data?.message === "Create session successfully"
          ) {
            console.warn(
              "Backend returned 400 but with success message. Treating as success.",
            );
            return err.response.data.data;
          }

          // Otherwise, throw the real error
          throw err;
        }
      });

      // Wait for all sessions to be created
      const createdSessions = await Promise.all(sessionPromises);

      toast.success(
        `Successfully created ${createdSessions.length} exam session(s)`,
      );

      // Call the original onComplete with the created data
      const examData: ExamScheduleData = {
        selectedBatch, // Keep as string for consistency
        selectedDate,
        selectedRooms,
        selectedCommittee,
        mathStartTime,
        mathEndTime,
        mathBreakTime,
        englishStartTime,
        englishEndTime,
        englishBreakTime,
        roomSchedules,
      };

      onComplete(examData);
    } catch (error: unknown) {
      console.error("❌ Error creating exam sessions:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create exam sessions",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const isRoomScheduleValid = (schedule: RoomSchedule): boolean => {
    return (
      schedule.roomName.trim() !== "" &&
      schedule.capacity > 0 &&
      schedule.location.trim() !== "" &&
      (schedule.examType === "math" || schedule.examType === "english") &&
      schedule.startTime !== "" &&
      schedule.endTime !== "" &&
      schedule.startTime < schedule.endTime &&
      schedule.committee.length > 0
    );
  };

  const isRoomFormValid = (form: RoomScheduleForm): boolean => {
    return (
      form.roomName.trim() !== "" &&
      form.capacity !== "" &&
      parseInt(form.capacity) > 0 &&
      form.location.trim() !== "" &&
      form.examType !== "" &&
      form.startTime !== "" &&
      form.endTime !== "" &&
      form.startTime < form.endTime &&
      form.committee.length > 0
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedBatch !== "" && selectedDate !== undefined;
      case 2: {
        const isFormEmpty = Object.values(roomForm).every(
          (val) => val === "" || (Array.isArray(val) && val.length === 0),
        );
        return (
          (roomSchedules.length > 0 &&
            roomSchedules.every(isRoomScheduleValid) &&
            isFormEmpty) ||
          isRoomFormValid(roomForm)
        );
      }
      default:
        return true;
    }
  };

  return (
    <Card className="w-full bg-card">
      {/* Header */}
      <div className="bg-card border-b border-border py-3 px-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Create Exam Schedule
            </h2>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>

        {/* Step Indicator - Centered */}
        <div className="flex items-center justify-center max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                    step.completed
                      ? "bg-[#0F386C] text-white"
                      : currentStep === step.number
                        ? "bg-[#0F386C] text-white"
                        : "bg-accent text-muted-foreground"
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className="text-xs mt-2 text-muted-foreground text-center whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-24 mx-4 transition-colors ${
                    step.completed ? "bg-[#0F386C]" : "bg-accent"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {currentStep === 1 && <BatchSelectionStep />}
        {currentStep === 2 && (
          <RoomScheduleCreator
            ref={roomCreatorRef}
            availableCommittees={availableCommittees}
          />
        )}
        {currentStep === 3 && (
          <RoomScheduleConfirmation
            selectedBatch={selectedBatch}
            selectedDate={selectedDate}
            roomSchedules={roomSchedules}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-card border-t border-border px-6 py-2.5 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-[#0F386C] hover:bg-[#334155] text-white"
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Schedule"
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ExamFlowWizard;
