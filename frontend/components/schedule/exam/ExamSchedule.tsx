// src/components/ExamSchedule.tsx

"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { scheduleService } from "@/api/service/schedule.service";

// Import types inferred from your Zod schemas
import type { Committee, Batch } from "@/lib/schema/schedule/common-schema";
import { GetAllSession } from "@/lib/schema/schedule/response-schema";

import { ExamFlowProvider } from "./flow/ExamFlowProvider";
import ExamFlowWizard, {
  type ExamScheduleData,
} from "@/components/schedule/exam/flow/ExamFlowWizard";
import {
  UpcomingSchedules,
  type UpcomingSchedule,
} from "@/components/schedule/exam/flow/UpcomingSchedules";
import { ExamDetails } from "./ExamDetails";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

export function ExamSchedule() {
  const [showWizard, setShowWizard] = useState(false);
  // ID is a string based on your Zod schema definition
  const [showExamDetails, setShowExamDetails] = useState<number | null>(null);
  const [upcomingSchedules, setUpcomingSchedules] = useState<
    UpcomingSchedule[]
  >([]);

  const [batches, setBatches] = useState<Batch[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null);

  const handleApiError = (error: unknown, context: string) => {
    console.error(`❌ Failed to ${context}:`, error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "An unknown error occurred";
    toast.error(`Failed to ${context}: ${errorMessage}`);
  };

  // 1. Load Batches & Committees on Mount, then load schedules for the first batch
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const [committeesRes, batchesRes] = await Promise.all([
          scheduleService.getAllCommittees(),
          scheduleService.listBatches(),
        ]);

        const mappedCommittees = (committeesRes.data || []).map((c) => ({
          ...c,
          department: c.department
            ? { ...c.department, name: c.department.name || "" }
            : null,
        }));
        setCommittees(mappedCommittees);

        const fetchedBatches = batchesRes.data || [];
        setBatches(fetchedBatches);

        if (fetchedBatches.length > 0) {
          // Fetch schedules for the first batch by default
          const firstBatchId = String(fetchedBatches[0].id);
          setSelectedBatchId(firstBatchId);
          await fetchRealSessions(firstBatchId);
        }
      } catch (error) {
        handleApiError(error, "load initial data");
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const fetchRealSessions = async (batchId: string) => {
    try {
      setIsLoading(true);
      const response = await scheduleService.getAllSessions(batchId);
      console.log(
        `[Debug] Response from getAllSessions for batch ${batchId}:`,
        response,
      );

      const realSessions: UpcomingSchedule[] = (response.data || []).map(
        (session: GetAllSession) => ({
          id: String(session.examSessionId), // The schema now parses this as a number
          name: session.examSessionName,
          rooms: [session.location],
          slots: session.capacity,
          status: "scheduled",
          date: new Date(session.examDate).toLocaleDateString(),
          // If you have a separate time field, use it here. Otherwise, use examDate or remove this line.
          // time: new Date(session.examDate).toLocaleTimeString(),
          committee: session.committees?.map((c) => c.name) || [], // FIX: Use 'committees' and map to names
        }),
      );

      setUpcomingSchedules(realSessions);
    } catch (error) {
      handleApiError(error, "fetch sessions");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handler: Wizard Finished
  const handleWizardComplete = async (examData: ExamScheduleData) => {
    setShowWizard(false);
    window.scrollTo(0, 0);

    const batchIdToFetch = examData?.selectedBatch;

    if (batchIdToFetch) {
      await fetchRealSessions(batchIdToFetch);
    } else {
      toast.info("No batch ID was provided, cannot refresh session list.");
    }
  };

  // 4. Handler: View Details
  const handleView = (schedule: UpcomingSchedule) => {
    if (schedule.id) {
      setShowExamDetails(Number(schedule.id));
      window.scrollTo(0, 0);
    }
  };

  // 5. Handler: Delete (opens confirmation)
  const handleDelete = (scheduleId: string) => {
    setScheduleToDelete(scheduleId);
    setIsDeleteDialogOpen(true);
  };

  // 6. Handler: Confirms and executes deletion
  const confirmDelete = async () => {
    if (!scheduleToDelete) return;
    try {
      await scheduleService.deleteExamSession(scheduleToDelete);
      setUpcomingSchedules((prev) =>
        prev.filter((s) => String(s.id) !== scheduleToDelete),
      );
      toast.success("Deleted successfully");
      if (String(showExamDetails) === scheduleToDelete) {
        setShowExamDetails(null);
      }
    } catch (error) {
      handleApiError(error, "delete session");
    } finally {
      setScheduleToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle batch change
  const handleBatchChange = (value: string) => {
    // Value is now the batch ID directly
    setSelectedBatchId(value);
    fetchRealSessions(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        Loading...
      </div>
    );
  }

  return (
    <div
      className={
        showExamDetails ? "w-full" : "grid grid-cols-1 lg:grid-cols-4 gap-6"
      }
    >
      <div className={showExamDetails ? "w-full" : "lg:col-span-3"}>
        {showWizard ? (
          <ExamFlowProvider>
            <ExamFlowWizard
              onClose={() => setShowWizard(false)}
              onComplete={handleWizardComplete}
              availableCommittees={committees}
            />
          </ExamFlowProvider>
        ) : showExamDetails ? (
          <ExamDetails
            onBack={() => setShowExamDetails(null)}
            examSessionId={String(showExamDetails)}
            onDelete={() => handleDelete(String(showExamDetails))}
          />
        ) : (
          <div className="space-y-4 p-6 bg-card border border-border rounded-xl shadow-sm">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Create Exam Schedule
              </h2>
              <p className="text-muted-foreground text-sm">
                Use our guided wizard to create comprehensive exam schedules
              </p>
            </div>

            <button
              onClick={() => {
                window.scrollTo(0, 0);
                setShowWizard(true);
              }}
              className="w-full bg-[#1E3A5F] hover:bg-[#2d4a6f] rounded-lg py-12 px-6 text-center transition-colors"
            >
              <Plus className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Start Exam Scheduling Wizard
              </h3>
              <p className="text-white/80 text-sm">3-step guided process</p>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  Batch & Date
                </h4>
                <p className="text-xs text-muted-foreground">Select Batch & Date</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  Create Rooms
                </h4>
                <p className="text-xs text-muted-foreground">Create Exam Schedule</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  Confirm
                </h4>
                <p className="text-xs text-muted-foreground">Confirm & Create</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {!showExamDetails && (
        <div className="lg:col-span-1 space-y-6">
          <UpcomingSchedules
            schedules={upcomingSchedules}
            onDelete={handleDelete}
            onView={handleView}
            availableBatches={batches.map((b) => ({
              id: String(b.id),
              label: b.batchName,
            }))}
            value={selectedBatchId}
            onValueChange={handleBatchChange}
            label="Filter by Batch"
            isLoading={isLoading}
          />
        </div>
      )}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete this exam schedule?"
        description="This action cannot be undone. This will permanently delete the schedule."
        confirmText="Delete"
      />
    </div>
  );
}
