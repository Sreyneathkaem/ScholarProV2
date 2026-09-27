"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import { InterviewDetails } from "@/components/schedule/interview/details/InterviewDetails";
import { CreateInterviewForm } from "@/components/schedule/interview/CreateInterviewForm";
import { InterviewSidebar } from "@/components/schedule/interview/InterviewSidebar";
import { scheduleService } from "@/api/service/schedule.service";
import {
  CreateInterviewSessionPayloadSchema,
  type CreateInterviewSessionPayload,
} from "@/lib/schema/schedule/schedule-schema";
import { z } from "zod";
import type { Committee } from "@/types/committee";
import type { Faculty } from "@/types/faculty";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import type {
  InterviewDetailResponse,
  InterviewSessionResponse,
  GetAllSession,
} from "@/types/schedule";
import type { Batch } from "@/types/batch";

interface AxiosErrorResponse {
  response?: {
    data?: {
      message?: string;
      errors?: string[];
    };
  };
}

function isAxiosErrorWithResponse(error: unknown): error is AxiosErrorResponse {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as AxiosErrorResponse).response?.data === "object" &&
    (error as AxiosErrorResponse).response?.data !== null
  );
}

interface InterviewScheduleProps {
  readonly onScheduleCreated?: (scheduleData: InterviewSessionResponse) => void;
}

export function InterviewSchedule({
  onScheduleCreated,
}: Readonly<InterviewScheduleProps>) {
  const [viewMode, setViewMode] = useState<"list" | "details">("list");
  const [selectedInterviewDetail, setSelectedInterviewDetail] =
    useState<InterviewDetailResponse | null>(null);

  // Real API data state
  const [batches, setBatches] = useState<Batch[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<
    GetAllSession[]
  >([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [interviewToDelete, setInterviewToDelete] = useState<string | null>(
    null,
  );

  // Load initial data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        const [batchesRes, committeesRes, facultiesRes] = await Promise.all([
          scheduleService.listBatches(),
          scheduleService.getAllCommittees(),
          scheduleService.getFaculties(),
        ]);

        console.log("✅ Fetched data from services:", {
          batchesRes,
          committeesRes,
          facultiesRes,
        });

        const batchesData = batchesRes.data || [];
        setBatches(batchesData);

        // Map committee data to match expected structure
        const mappedCommittees: Committee[] =
          committeesRes.data?.map((c) => ({
            ...c,
            department: c.department
              ? {
                  id: c.department.id,
                  name: c.department.name || "",
                }
              : null,
          })) || [];
        setCommittees(mappedCommittees);

        // Map faculty data with timestamps
        const mappedFaculties: Faculty[] = (facultiesRes.data || []).map(
          (f) => ({
            id: f.id,
            facultyName: f.facultyName,
            createdAt: (f as Faculty).createdAt || new Date().toISOString(),
            updatedAt: (f as Faculty).updatedAt || new Date().toISOString(),
          }),
        );
        setFaculties(mappedFaculties);

        // Auto-select first batch and fetch its sessions
        if (batchesData.length > 0) {
          const firstBatchId = String(batchesData[0].id);
          setSelectedBatchId(firstBatchId);
          await fetchInterviewSessions(firstBatchId);
        }

        console.log("✅ Loaded interview data:", {
          batches: batchesRes.data?.length || 0,
          committees: committeesRes.data?.length || 0,
          faculties: facultiesRes.data?.length || 0,
        });
      } catch (error) {
        console.error("❌ Failed to load initial data:", error);
        toast.error("Failed to load initial data", {
          description: "Please refresh the page to try again",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Fetch interview sessions for a specific batch
  const fetchInterviewSessions = async (batchId: string) => {
    try {
      setIsSidebarLoading(true);
      const response = await scheduleService.getAllSessions(batchId);
      console.log(
        `[Debug] Response from getAllSessions for batch ${batchId}:`,
        response,
      );

      // Filter for interview sessions (subjectName === "Interview")
      interface RawSessionData {
        examSessionId: number;
        examSessionName: string;
        location: string;
        capacity: number;
        subjectName: string;
        examDate: string;
        committees?: { id: string; name: string }[];
      }

      const interviewSessions: GetAllSession[] = (response.data || [])
        .filter(
          (session: RawSessionData) => session.subjectName === "Interview",
        )
        .map((session: RawSessionData) => ({
          examSessionsId: String(session.examSessionId),
          examSessionName: session.examSessionName,
          location: session.location,
          capacity: session.capacity,
          subjectName: session.subjectName,
          examDate: session.examDate,
          committee: session.committees || [],
        }));

      setScheduledInterviews(interviewSessions);
    } catch (error) {
      console.error("❌ Failed to fetch interview sessions:", error);
      toast.error("Failed to load interview schedules");
    } finally {
      setIsSidebarLoading(false);
    }
  };

  // Handle batch change
  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId);
    fetchInterviewSessions(batchId);
  };

  const handleScheduleCreated = async (
    payload: CreateInterviewSessionPayload,
  ) => {
    try {
      const validatedPayload =
        CreateInterviewSessionPayloadSchema.parse(payload);
      console.log(
        "📤 Received payload from CreateInterviewForm:",
        validatedPayload,
      );

      const response = await scheduleService.createInterviewSession(
        String(validatedPayload.batchId),
        validatedPayload,
      );

      if (!response.success) {
        throw new Error(
          response.message || "Failed to create session due to backend issue.",
        );
      }

      // Ensure sessionData is present before proceeding
      if (!response.data) {
        throw new Error("API returned success but no session data.");
      }

      console.log("✅ Interview session created:", response.data);

      // Refresh the interview sessions list
      if (selectedBatchId) {
        await fetchInterviewSessions(selectedBatchId);
      }

      if (onScheduleCreated)
        onScheduleCreated(response.data as InterviewSessionResponse);

      toast.success("Interview session created successfully!", {
        description: `${validatedPayload.sessionName} scheduled successfully`,
      });
    } catch (error) {
      console.error("❌ Failed to create interview session:", error);

      let description = "An unknown error occurred";
      if (isAxiosErrorWithResponse(error)) {
        const data = error.response?.data;
        if (data?.message) {
          description = data.message;
        } else if (Array.isArray(data?.errors) && data.errors.length > 0) {
          description = data.errors.join("\n");
        }
      } else if (error instanceof z.ZodError) {
        description = error.issues.map((e) => e.message).join("\n");
      } else if (error instanceof Error) {
        description = error.message;
      }

      toast.error("Failed to create interview session", {
        description,
      });
    }
  };

  const handleDeleteInterview = (id: string) => {
    setInterviewToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!interviewToDelete) return;

    try {
      await scheduleService.deleteExamSession(interviewToDelete);

      // Refresh the list
      if (selectedBatchId) {
        await fetchInterviewSessions(selectedBatchId);
      }

      // If we are in the details view and deleting the current item, navigate back
      if (
        selectedInterviewDetail?.examSession.sessionId ===
        Number(interviewToDelete)
      ) {
        setViewMode("list");
        setSelectedInterviewDetail(null);
      }

      toast.success("Interview schedule deleted successfully");
    } catch (error) {
      console.error("❌ Failed to delete interview:", error);
      toast.error("Failed to delete interview schedule");
    } finally {
      setIsDeleteDialogOpen(false);
      setInterviewToDelete(null);
    }
  };

  const handleViewDetails = async (interview: GetAllSession) => {
    try {
      setIsLoadingDetails(true);
      setViewMode("details");

      console.log("👁️ Viewing interview details (sidebar):", interview);
      const resp = await scheduleService.getExamSessionDetail(
        interview.examSessionsId,
      );
      const sessionData = resp.data;

      // Ensure sessionData exists
      if (!sessionData) {
        throw new Error("No session data returned from API");
      }

      // Create proper InterviewDetailResponse from the API response
      const detail: InterviewDetailResponse = {
        batchId: Number(selectedBatchId),
        examSession: {
          sessionId: sessionData.examSession.sessionId,
          sessionName: sessionData.examSession.sessionName,
          location: sessionData.examSession.location,
          capacity: sessionData.examSession.capacity,
          startTime: sessionData.examSession.startTime,
          endTime: sessionData.examSession.endTime,
          breakStart: sessionData.examSession.breakStart,
          breakEnd: sessionData.examSession.breakEnd,
        },
        faculty: {
          facultyName: "TBD",
        },
        committees:
          sessionData.committees.length > 0
            ? sessionData.committees
            : [
                {
                  committeeId: "0",
                  committeeName: "No committee assigned",
                },
              ],
        subject: {
          subjectId: sessionData.subject.subjectId,
          subjectName: sessionData.subject.subjectName || "Interview",
        },
        applications:
          sessionData.applications.length > 0
            ? sessionData.applications
            : [
                {
                  applicationId: 0,
                  applicantName: "No applications assigned",
                  interviewSlotStart: new Date().toISOString(),
                  interviewSlotEnd: new Date().toISOString(),
                },
              ],
      };

      setSelectedInterviewDetail(detail);
    } catch (error) {
      console.error("Failed to load interview detail:", error);
      toast.error("Failed to load interview details");
      setViewMode("list");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleBackToList = () => {
    console.log("⬅️ Back to interview list");
    setViewMode("list");
    setSelectedInterviewDetail(null);
  };

  // Skeleton Loading State
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 min-h-0">
        <div className="xl:col-span-3">
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-6">
            <div>
              <div className="h-7 w-56 bg-muted rounded animate-pulse mb-2" />
              <div className="h-4 w-80 bg-muted rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="p-4 bg-muted/20 rounded-lg space-y-4">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-10 bg-muted rounded animate-pulse" />
                <div className="h-10 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 space-y-3 animate-pulse"
                >
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-muted rounded" />
                    <div className="h-10 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="xl:col-span-1">
          <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-40 bg-muted rounded animate-pulse" />
              <div className="h-6 w-8 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border rounded-lg animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-5 bg-muted rounded w-20" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-8 w-8 bg-muted rounded" />
                      <div className="h-8 w-8 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewMode === "details" && selectedInterviewDetail ? (
        isLoadingDetails ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-7 w-64 bg-muted rounded" />
                    <div className="h-4 w-40 bg-muted rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                  <div className="h-10 w-10 bg-muted rounded-lg" />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-6 w-32 bg-muted rounded" />
                  </div>
                ))}
              </div>
              <div className="h-px bg-muted" />
              <div className="space-y-4">
                <div className="h-5 w-40 bg-muted rounded" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 w-32 bg-muted rounded-full" />
                  ))}
                </div>
              </div>
              <div className="h-px bg-muted" />
              <div className="space-y-4">
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="border rounded-lg">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-muted/20 border-b">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-muted rounded" />
                    ))}
                  </div>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 gap-4 p-4 border-b last:border-b-0"
                    >
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 bg-muted rounded" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <InterviewDetails
            interview={selectedInterviewDetail}
            onBack={handleBackToList}
            onDelete={() =>
              handleDeleteInterview(
                String(selectedInterviewDetail.examSession.sessionId),
              )
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 min-h-0">
          <CreateInterviewForm
            onScheduleCreated={handleScheduleCreated}
            availableBatches={batches}
            availableCommittees={committees}
            availableFaculties={faculties}
          />
          <InterviewSidebar
            interviews={scheduledInterviews}
            onViewDetails={handleViewDetails}
            onDelete={handleDeleteInterview}
            isLoading={isSidebarLoading}
            availableBatches={batches}
            selectedBatchId={selectedBatchId}
            onBatchChange={handleBatchChange}
          />
        </div>
      )}

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Are you sure you want to delete this schedule?"
        description="This action cannot be undone. This will permanently delete the interview schedule and all associated data."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
