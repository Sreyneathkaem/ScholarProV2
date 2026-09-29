import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { scheduleService } from "@/api/service/schedule.service";
import type { InterviewDetailResponse } from "@/types/schedule";
import type { Batch } from "@/types/batch";
import type { Committee } from "@/types/committee";
import type { Faculty } from "@/types/faculty";
import { CreateInterviewSessionPayload } from "@/lib/schema/schedule/schedule-schema";

interface EditInterviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  interview: InterviewDetailResponse;
  onSuccess: () => void; // To refetch data on parent
}

export function EditInterviewDialog({
  isOpen,
  onOpenChange,
  interview,
  onSuccess,
}: EditInterviewDialogProps) {
  // Form State
  const [editedRoomName, setEditedRoomName] = useState("");
  const [editedDate, setEditedDate] = useState<Date | undefined>();
  const [editedBatch, setEditedBatch] = useState("");
  const [editedStartTime, setEditedStartTime] = useState("");
  const [editedEndTime, setEditedEndTime] = useState("");
  const [editedBreakStart, setEditedBreakStart] = useState<string>("");
  const [editedBreakEnd, setEditedBreakEnd] = useState<string>("");
  const [editedMembers, setEditedMembers] = useState<string[]>([]);
  const [editedCommitteeSearchQuery, setEditedCommitteeSearchQuery] =
    useState<string>("");
  const [isEditCommitteeOpen, setIsEditCommitteeOpen] = useState(false);
  const [editedFacultyId, setEditedFacultyId] = useState<string>("");

  // Live Data State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Effect to populate form when dialog opens or interview data changes
  useEffect(() => {
    if (interview && isOpen && batches.length > 0 && faculties.length > 0) {
      const exam = interview.examSession;
      const currentBatch = batches.find((b) => b.id === interview.batchId);
      const faculty = faculties.find(
        (f) => f.facultyName === interview.faculty?.facultyName,
      );

      setEditedRoomName(exam.sessionName || "");
      setEditedDate(new Date(exam.startTime));
      setEditedBatch(currentBatch?.batchName || "");
      setEditedStartTime(format(new Date(exam.startTime), "HH:mm"));
      setEditedEndTime(format(new Date(exam.endTime), "HH:mm"));
      setEditedMembers(interview.committees.map((c) => c.committeeName));
      setEditedFacultyId(String(faculty?.id || ""));
      setEditedBreakStart(
        exam.breakStart ? format(new Date(exam.breakStart), "HH:mm") : "",
      );
      setEditedBreakEnd(
        exam.breakEnd ? format(new Date(exam.breakEnd), "HH:mm") : "",
      );
    }
  }, [interview, isOpen, batches, faculties]);

  // Fetch data on dialog open
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const [batchesRes, committeesRes, facultiesRes] = await Promise.all([
            scheduleService.listBatches(),
            scheduleService.getAllCommittees(),
            scheduleService.getFaculties(),
          ]);

          setBatches(batchesRes.data || []);
          setCommittees(committeesRes.data || []);
          const mappedFaculties = (facultiesRes.data || []).map((f) => ({
            ...f,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setFaculties(mappedFaculties);
        } catch (error) {
          console.error("Failed to load data for edit dialog", error);
          toast.error("Failed to load necessary data for editing.");
        }
      };
      loadData();
    }
  }, [isOpen]);

  const timeOptions = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
  ];

  const filteredCommitteeMembers = useMemo(
    () =>
      committees.filter((member) =>
        member.name
          .toLowerCase()
          .includes(editedCommitteeSearchQuery.toLowerCase()),
      ),
    [committees, editedCommitteeSearchQuery],
  );

  const handleCommitteeToggle = (member: string) => {
    if (editedMembers.includes(member)) {
      setEditedMembers(editedMembers.filter((m) => m !== member));
    } else {
      setEditedMembers([...editedMembers, member]);
    }
  };

  const handleRemoveCommitteeMember = (member: string) => {
    setEditedMembers(editedMembers.filter((m) => m !== member));
  };

  const handleSave = async () => {
    if (
      !editedDate ||
      !editedRoomName.trim() ||
      editedMembers.length === 0 ||
      !editedStartTime ||
      !editedEndTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editedStartTime >= editedEndTime) {
      toast.error("Start time must be before end time");
      return;
    }

    if (
      editedBreakStart &&
      editedBreakEnd &&
      editedBreakStart >= editedBreakEnd
    ) {
      toast.error("Break start time must be before break end time");
      return;
    }

    if (editedRoomName.trim().length < 3) {
      toast.error("Room name must be at least 3 characters");
      return;
    }

    if (editedRoomName.trim().length > 100) {
      toast.error("Room name must be at most 100 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      // Find the selected batch object to get its ID
      const selectedBatch = batches.find((b) => b.batchName === editedBatch);
      if (!selectedBatch) {
        toast.error("Invalid batch selected.");
        setIsSubmitting(false);
        return;
      }

      // Convert committee names to IDs
      const committeeIds = editedMembers
        .map((name) => committees.find((c) => c.name === name)?.id)
        .filter((id): id is string => !!id);

      if (committeeIds.length !== editedMembers.length) {
        toast.error("Some committee members could not be found.");
        setIsSubmitting(false);
        return;
      }

      // Construct payload for the update endpoint
      const payload: CreateInterviewSessionPayload = {
        batchId: selectedBatch.id,
        sessionName: editedRoomName,
        location: editedRoomName, // Assuming location is same as room name
        subjectId: interview.subject.subjectId,
        facultyId: parseInt(editedFacultyId),
        examDate: editedDate.toISOString(),
        startTime: new Date(
          `${editedDate.toDateString()} ${editedStartTime}`,
        ).toISOString(),
        endTime: new Date(
          `${editedDate.toDateString()} ${editedEndTime}`,
        ).toISOString(),
        breakStart: editedBreakStart
          ? new Date(
              `${editedDate.toDateString()} ${editedBreakStart}`,
            ).toISOString()
          : null,
        breakEnd: editedBreakEnd
          ? new Date(
              `${editedDate.toDateString()} ${editedBreakEnd}`,
            ).toISOString()
          : null,
        committeeIds,
      };

      await scheduleService.updateInterviewSession(
        String(interview.examSession.sessionId),
        payload,
      );

      toast.success("Interview schedule updated successfully!");
      onSuccess(); // Notify parent to refetch data
      onOpenChange(false); // Close dialog
    } catch (error) {
      console.error("Failed to update interview session:", error);
      toast.error("Failed to update schedule.", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Interview Schedule</DialogTitle>
          <DialogDescription>
            Update interview schedule details including room name, date, batch,
            times, and committee members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Room Name and Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Room Name
              </label>
              <Input
                value={editedRoomName}
                onChange={(e) => setEditedRoomName(e.target.value)}
                placeholder="e.g., Interview Room 1"
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Interview Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !editedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editedDate ? format(editedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={editedDate}
                    onSelect={setEditedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Select Batch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Select Batch
              </label>
              <Select value={editedBatch} onValueChange={setEditedBatch}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((batch) => (
                    <SelectItem key={batch.id} value={batch.batchName}>
                      {batch.batchName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Select Faculty
              </label>
              <Select
                value={editedFacultyId}
                onValueChange={setEditedFacultyId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Faculty" />
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty.id} value={String(faculty.id)}>
                      {faculty.facultyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Start Time
              </label>
              <Select
                value={editedStartTime}
                onValueChange={setEditedStartTime}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                End Time
              </label>
              <Select value={editedEndTime} onValueChange={setEditedEndTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Start Break
              </label>
              <Select
                value={editedBreakStart}
                onValueChange={setEditedBreakStart}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start Break" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                End Break
              </label>
              <Select value={editedBreakEnd} onValueChange={setEditedBreakEnd}>
                <SelectTrigger>
                  <SelectValue placeholder="End Break" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Committee Members */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Committee Members
            </label>
            <Popover
              open={isEditCommitteeOpen}
              onOpenChange={setIsEditCommitteeOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal h-auto min-h-10 bg-transparent"
                >
                  {editedMembers.length > 0 ? (
                    <span className="text-sm">
                      {editedMembers.length} member
                      {editedMembers.length > 1 ? "s" : ""} selected
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      Select committee members
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex flex-col">
                  <div className="p-3 border-b border-border">
                    <Input
                      placeholder="Search committee members..."
                      value={editedCommitteeSearchQuery}
                      onChange={(e) =>
                        setEditedCommitteeSearchQuery(e.target.value)
                      }
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="max-h-[280px] overflow-y-auto p-2">
                    {filteredCommitteeMembers.length > 0 ? (
                      <div className="space-y-1">
                        {filteredCommitteeMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-2 rounded-md px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
                            onClick={() => handleCommitteeToggle(member.name)}
                          >
                            <input
                              type="checkbox"
                              checked={editedMembers.includes(member.name)}
                              onChange={() => {}}
                              className="w-4 h-4 text-[#0F386C] border-border rounded focus:ring-[#0F386C] cursor-pointer"
                            />
                            <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                              {member.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No committee members found
                      </div>
                    )}
                  </div>

                  {editedMembers.length > 0 && (
                    <div className="p-3 border-t border-border bg-muted">
                      <p className="text-xs text-muted-foreground">
                        {editedMembers.length} member
                        {editedMembers.length > 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {editedMembers.length > 0 && (
              <div className="mt-3 p-3 bg-muted rounded-lg border border-border">
                <div className="flex flex-wrap gap-2">
                  {editedMembers.map((member) => (
                    <Badge
                      key={member}
                      variant="outline"
                      className="bg-card text-foreground border-border hover:bg-muted pl-2.5 pr-1.5 py-1"
                    >
                      <span className="text-xs">{member}</span>
                      <button
                        onClick={() => handleRemoveCommitteeMember(member)}
                        className="ml-1.5 hover:bg-accent rounded-full p-0.5 transition-colors"
                      >
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-[#0F386C] text-white hover:bg-[#0955b1]"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
