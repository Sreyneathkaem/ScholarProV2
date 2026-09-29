"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Clock,
  MoreVertical,
  Eye,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { BatchSelector } from "@/components/batch-selector";

// Hybrid Interface (Wizard + API)
export interface UpcomingSchedule {
  id: string;
  name?: string;
  rooms?: string[] | string;
  slots?: number;
  date?: string;
  time?: string;
  sessionName?: string;
  location?: string;
  capacity?: number;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  committee: string[];
}

interface UpcomingSchedulesProps {
  schedules: UpcomingSchedule[];
  onDelete?: (scheduleId: string) => void;
  // Change 'number' to 'UpcomingSchedule' (The whole object)
  onView?: (schedule: UpcomingSchedule) => void;
  availableBatches: { id: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  isLoading: boolean;
}

export function UpcomingSchedules({
  schedules,
  onDelete,
  onView,
  availableBatches,
  value,
  onValueChange,
  label,
  isLoading,
}: UpcomingSchedulesProps) {
  const handleViewClick = (schedule: UpcomingSchedule) => {
    if (onView) {
      // FIX: Use 'schedule', not 'scheduleId' (which was undefined)
      onView(schedule);
    }
  };

  // Helper to safely format dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "PPP");
    } catch {
      return dateStr;
    }
  };

  // Helper to safely format time
  const formatTimeRange = (
    start?: string,
    end?: string,
    manualTime?: string,
  ) => {
    if (manualTime) return manualTime;
    if (!start || !end) return null;
    try {
      return `${format(new Date(start), "p")} - ${format(new Date(end), "p")}`;
    } catch {
      return null;
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-foreground">
            Upcoming Exams
          </h3>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {schedules.length} schedule{schedules.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Full-width Batch Selector */}
        <div className="w-full mb-2">
          <BatchSelector
            availableBatches={availableBatches}
            value={value}
            onValueChange={onValueChange}
            label={label}
            placeholder={value || "Select a batch to view schedules"}
            className="w-full"
          />
        </div>

        <div className="space-y-3 mt-2">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                No upcoming exams scheduled
              </p>
            </div>
          ) : (
            schedules.map((schedule) => {
              // Resolve Display Values
              const displayName =
                schedule.sessionName || schedule.name || "Untitled Exam";
              const displayLocation =
                schedule.location ||
                (Array.isArray(schedule.rooms)
                  ? schedule.rooms.join(", ")
                  : schedule.rooms) ||
                "TBD";
              const displayDate =
                formatDate(schedule.examDate) || schedule.date;
              const displayTime = formatTimeRange(
                schedule.startTime,
                schedule.endTime,
                schedule.time,
              );
              const displayCapacity = schedule.capacity;

              return (
                <div
                  key={schedule.id}
                  className="border border-border rounded-lg p-4 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Name & Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-foreground">
                          {displayName}
                        </h4>
                        <Badge
                          variant="outline"
                          className={
                            schedule.status === "scheduled" ||
                            schedule.status === "upcoming"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-muted text-foreground"
                          }
                        >
                          {schedule.status}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span
                            className="truncate max-w-[150px]"
                            title={displayLocation}
                          >
                            {displayLocation}
                          </span>
                        </div>

                        {displayCapacity ? (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{displayCapacity} seats</span>
                          </div>
                        ) : schedule.slots ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{schedule.slots} slots</span>
                          </div>
                        ) : null}

                        {displayDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{displayDate}</span>
                          </div>
                        )}

                        {displayTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{displayTime}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          // ✅ FIX 2: Use onSelect and the local wrapper
                          <DropdownMenuItem
                            onSelect={() => handleViewClick(schedule)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onSelect={() => onDelete(String(schedule.id))}
                            className="flex items-center gap-2 text-red-600 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                            Delete Schedule
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </>
  );
}
