"use client";

import React from "react";
import { Users, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getFacultyByMajor } from "@/lib/utils/department-mapper";

interface Student {
  id: string;
  name: string;
  major?: string;
  mathStatus?: string;
  englishStatus?: string;
}

interface InterviewCandidateListProps {
  students: Student[];
  startTime: string;
  breakTimeInfo: { start: string; end: string } | null;
  batchName?: string;
  slotsAvailable: number;
  selectedDepartment: string;
}

export function ApplicantsList({
  students,
  startTime,
  breakTimeInfo,
  slotsAvailable,
  selectedDepartment,
}: InterviewCandidateListProps) {
  // Helper function to calculate time slot
  const calculateTimeSlot = (index: number) => {
    if (!startTime) return "Not set";

    const [startHour, startMin] = startTime.split(":").map(Number);
    let currentSlotMin = startHour * 60 + startMin;
    let slotsPlaced = 0;

    while (slotsPlaced <= index) {
      const slotEndMin = currentSlotMin + 15;

      if (breakTimeInfo) {
        const [breakStartHour, breakStartMin] = breakTimeInfo.start
          .split(":")
          .map(Number);
        const [breakEndHour, breakEndMin] = breakTimeInfo.end
          .split(":")
          .map(Number);

        const breakStartTotal = breakStartHour * 60 + breakStartMin;
        const breakEndTotal = breakEndHour * 60 + breakEndMin;

        // If overlap with break, jump to end of break
        if (currentSlotMin < breakEndTotal && slotEndMin > breakStartTotal) {
          currentSlotMin = breakEndTotal;
          continue;
        }
      }

      if (slotsPlaced === index) {
        const format = (m: number) => {
          const h = Math.floor(m / 60)
            .toString()
            .padStart(2, "0");
          const mn = (m % 60).toString().padStart(2, "0");
          return `${h}:${mn}`;
        };
        return `${format(currentSlotMin)} - ${format(currentSlotMin + 15)}`;
      }

      slotsPlaced++;
      currentSlotMin += 15;
    }
    return "";
  };

  // Helper to check for break gaps in UI
  const hasBreakBefore = (index: number) => {
    if (index === 0) return false;
    const curr = calculateTimeSlot(index);
    const prev = calculateTimeSlot(index - 1);
    if (!curr || !prev) return false;

    const currStart = curr.split(" - ")[0];
    const prevEnd = prev.split(" - ")[1];
    return currStart !== prevEnd;
  };

  if (slotsAvailable === 0) {
    return (
      <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <div className="text-yellow-600">⚠️</div>
          <div>
            <h4 className="text-sm font-medium text-yellow-800">
              Invalid duration
            </h4>
            <p className="text-xs text-yellow-600">
              The selected time range is too short. Each interview requires 15
              minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 text-center">
        <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h4 className="text-sm font-medium text-foreground mb-1">
          No matching students
        </h4>
        <p className="text-xs text-muted-foreground">
          No qualified{" "}
          <strong>
            {selectedDepartment !== "Mixed" ? selectedDepartment : ""}
          </strong>{" "}
          students found in this batch.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h4 className="font-medium text-foreground text-sm">
            Interview Candidates
          </h4>
          <Badge variant="outline" className="ml-auto">
            {students.length} students
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          15 minutes/candidate •
          {breakTimeInfo && (
            <span className="ml-1 text-orange-600 font-medium">
              Break: {breakTimeInfo.start} - {breakTimeInfo.end}
            </span>
          )}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full min-w-full table-fixed">
          <thead className="bg-muted border-b border-border sticky top-0 z-10">
            <tr>
              <th className="w-12 px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                #
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                ID
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Department
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">
                Time Slot
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student, index) => {
              const timeSlot = calculateTimeSlot(index);
              const studentDept = getFacultyByMajor(student.major || "");
              const isMismatch =
                selectedDepartment !== "Mixed" &&
                studentDept !== selectedDepartment;
              const showBreak = hasBreakBefore(index);

              return (
                <React.Fragment key={student.id}>
                  {showBreak && (
                    <tr className="bg-orange-50 border-orange-200">
                      <td colSpan={5} className="px-2 py-2 text-center">
                        <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                          🍽️ Break Time
                        </span>
                      </td>
                    </tr>
                  )}
                  <tr
                    className={cn(
                      "hover:bg-muted",
                      isMismatch && "bg-yellow-50/50",
                    )}
                  >
                    <td className="px-2 py-2 text-sm text-foreground">
                      {index + 1}
                    </td>
                    <td className="px-2 py-2 text-sm text-foreground">
                      {student.id}
                    </td>
                    <td className="px-2 py-2 text-sm font-medium text-foreground">
                      {student.name}
                    </td>
                    <td className="px-2 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs font-normal",
                            studentDept === "Engineering" &&
                              "bg-blue-50 text-blue-700 border-blue-200",
                            studentDept === "Business" &&
                              "bg-green-50 text-green-700 border-green-200",
                            studentDept === "Architecture" &&
                              "bg-orange-50 text-orange-700 border-orange-200",
                          )}
                        >
                          {studentDept}
                        </Badge>
                        {isMismatch && (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-muted-foreground truncate">
                      {timeSlot}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
