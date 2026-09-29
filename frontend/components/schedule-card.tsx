"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  Clock,
  MoreVertical,
  Eye,
  Trash2,
  UserRound,
  BookOpen,
  Boxes,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate, formatTime } from "@/lib/utils/helper";

export interface UpcomingSchedule {
  sessionId: number;
  id: number;
  name: string;
  rooms: string[];
  slots: number;
  status: string;
  date?: string;
  time?: string;
  location?: string;
  sessionName?: string;
  startTime?: string;
  endTime?: string;
  examDate?: string;
  capacity?: number;
  batch: { id: number; batchName: string };
  subject: { id: number; subjectName: string };
}

interface UpcomingSchedulesProps {
  schedules: UpcomingSchedule[];
  onEdit?: (schedule: UpcomingSchedule) => void;
  onDelete?: (scheduleId: number) => void;
  onView?: (schedule: UpcomingSchedule) => void;
}

export function ScheduleCard({
  schedules,
  onDelete,
  onView,
}: UpcomingSchedulesProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    schedule: UpcomingSchedule | null;
  }>({
    isOpen: false,
    schedule: null,
  });

  const handleDeleteClick = (schedule: UpcomingSchedule) => {
    setDeleteDialog({
      isOpen: true,
      schedule,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.schedule && onDelete) {
      onDelete(deleteDialog.schedule.id);
    }
    setDeleteDialog({
      isOpen: false,
      schedule: null,
    });
  };

  const handleCancelDelete = () => {
    setDeleteDialog({
      isOpen: false,
      schedule: null,
    });
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-md font-semibold text-foreground">
            Exams Schedule
          </h3>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {schedules.length}
          </Badge>
        </div>

        <div className="space-y-3 grid grid-cols-2 gap-4 mt-4 justify-center">
          {schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 text-center" />
              <p className="text-muted-foreground text-sm text-center">
                No exams scheduled
              </p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="border border-border rounded-lg p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => onView && onView(schedule)}
                    onKeyDown={(e) => {
                      if ((e as React.KeyboardEvent).key === "Enter" && onView)
                        onView(schedule);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className=" font-medium text-foreground">
                        {schedule.sessionName}
                      </h4>
                      <Badge
                        variant="outline"
                        className={
                          schedule.status === "upcoming"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-muted text-foreground"
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{schedule.location}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(schedule.startTime) || schedule.startTime}{" "}
                          - {formatTime(schedule.endTime) || schedule.endTime}
                        </span>
                      </div>

                      {schedule.examDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(schedule.examDate)}</span>
                        </div>
                      )}

                      {schedule.capacity && (
                        <div className="flex items-center gap-1">
                          <UserRound className="h-4 w-4" />
                          <span>{schedule.capacity}</span>
                        </div>
                      )}

                      {schedule.batch.batchName && (
                        <div className="flex items-center gap-1">
                          <Boxes className="h-4 w-4" />
                          <span>{schedule.batch.batchName}</span>
                        </div>
                      )}

                      {schedule.subject.subjectName && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{schedule.subject.subjectName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem
                          onClick={() => onView(schedule)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(schedule)}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                          Delete Schedule
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={handleCancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Exam Schedule
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the exam schedule{" "}
              <b>{deleteDialog.schedule?.name}</b>?
              <div className="bg-red-50 border border-red-200 rounded-md p-3 flex gap-2.5 mt-4">
                <Trash2 className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">
                  This action cannot be undone and will remove all associated
                  data related to this exam schedule.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Schedule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
