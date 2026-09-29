"use client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
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
import type { GetAllSession } from "@/types/schedule";
import type { Batch } from "@/types/batch";

interface InterviewSidebarProps {
  readonly interviews: GetAllSession[];
  readonly onViewDetails: (interview: GetAllSession) => void;
  readonly onDelete: (id: string) => void;
  readonly isLoading?: boolean;
  readonly availableBatches: Batch[];
  readonly selectedBatchId: string;
  readonly onBatchChange: (batchId: string) => void;
}

export function InterviewSidebar({
  interviews,
  onViewDetails,
  onDelete,
  isLoading = false,
  availableBatches,
  selectedBatchId,
  onBatchChange,
}: Readonly<InterviewSidebarProps>) {
  const handleViewClick = (interview: GetAllSession) => {
    onViewDetails(interview);
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

  // Get selected batch name - add defensive check
  const selectedBatch = availableBatches?.find(
    (b) => String(b.id) === selectedBatchId,
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-semibold text-foreground">
          Scheduled Interviews
        </h3>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          {interviews.length} interview{interviews.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {/* Full-width Batch Selector */}
      <div className="w-full mb-2">
        <BatchSelector
          availableBatches={(availableBatches || []).map((b) => ({
            id: String(b.id),
            label: b.batchName,
          }))}
          value={String(selectedBatch?.id || "")}
          onValueChange={(batchId) => {
            onBatchChange(batchId);
          }}
          label="Filter by Batch"
          placeholder="Select a batch to view interviews"
          className="w-full"
        />
      </div>

      <div className="space-y-3 mt-2">
        {isLoading ? (
          <>
            {new Array(3).fill(null).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="border border-border rounded-lg p-4"
              >
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
        ) : interviews.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No interviews scheduled</p>
            <p className="text-muted-foreground text-xs mt-1">
              {selectedBatchId
                ? "Select a different batch or create a new interview"
                : "Select a batch to view scheduled interviews"}
            </p>
          </div>
        ) : (
          interviews.map((interview) => {
            const displayDate = formatDate(interview.examDate);
            const displayLocation = interview.location || "TBD";
            const displayCapacity = interview.capacity;
            const committeeCount = interview.committee?.length || 0;

            return (
              <div
                key={interview.examSessionsId}
                className="border border-border rounded-lg p-4 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Name & Subject Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-foreground">
                        {interview.examSessionName}
                      </h4>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {interview.subjectName || "Interview"}
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

                      {Boolean(displayCapacity) && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{displayCapacity} seats</span>
                        </div>
                      )}

                      {Boolean(displayDate) && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{displayDate}</span>
                        </div>
                      )}

                      {committeeCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-orange-600" />
                          <span className="text-orange-600 font-medium">
                            {committeeCount} committee
                            {committeeCount === 1 ? "" : "s"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => handleViewClick(interview)}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => onDelete(interview.examSessionsId)}
                        className="flex items-center gap-2 text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                        Delete Schedule
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
