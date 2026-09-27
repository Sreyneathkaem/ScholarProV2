"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Batch } from "@/api/service/email.service";
import { Search } from "lucide-react";
import { BatchSelectorSkeleton } from "@/components/communications/EmailSkeletons";

interface FilterPanelProps {
  selectedBatch: string;
  selectedBatchId: string;
  selectedMajor: string;
  selectedStatus: string;
  selectedScholarshipPercentage?: string | null;
  hasSearchTerm: boolean;
  batches: Batch[];
  isBatchesLoading: boolean;
  isSearching: boolean;
  onBatchChange: (batchName: string, batchId: string) => void;
  onMajorChange: (major: string) => void;
  onStatusChange: (status: string) => void;
  onScholarshipChange: (percentage: string | null) => void;
  onSearchClick: () => void;
}

export function FilterPanel({
  selectedBatch,
  selectedBatchId,
  selectedMajor,
  selectedStatus,
  selectedScholarshipPercentage,
  hasSearchTerm,
  batches,
  isBatchesLoading,
  isSearching,
  onBatchChange,
  onMajorChange,
  onStatusChange,
  onScholarshipChange,
  onSearchClick,
}: FilterPanelProps) {
  return (
    <div className="flex flex-horizontal gap-4 items-end flex-wrap">
      {/* Batch Selector */}
      {isBatchesLoading ? (
        <BatchSelectorSkeleton />
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Batch</label>
          <Select
            value={selectedBatch}
            onValueChange={(value) => {
              const batch = batches.find((b: Batch) => b.batchName === value);
              onBatchChange(value, batch?.id.toString() || "");
            }}
            disabled={isBatchesLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isBatchesLoading ? "Loading batches..." : "Choose a batch"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {batches.length === 0 ? (
                <SelectItem value="no-batches" disabled>
                  No batches available
                </SelectItem>
              ) : (
                batches.map((batch: Batch) => (
                  <SelectItem key={batch.id} value={batch.batchName}>
                    {batch.batchName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Status Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select
          value={selectedStatus || "all"}
          onValueChange={(value) =>
            onStatusChange(value === "all" ? "" : value)
          }
          disabled={!selectedBatchId}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="submitted">submitted</SelectItem>
            <SelectItem value="shortlisted">shortlisted</SelectItem>
            <SelectItem value="assessment_scheduled">
              assessment_scheduled
            </SelectItem>
            <SelectItem value="graded">graded</SelectItem>
            <SelectItem value="accepted">accepted</SelectItem>
            <SelectItem value="rejected">rejected</SelectItem>
            <SelectItem value="incomplete">incomplete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scholarship Percentage */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Scholarship %</label>
        <Select
          value={selectedScholarshipPercentage || "all"}
          onValueChange={(value) =>
            onScholarshipChange(value === "all" ? null : value)
          }
          disabled={!selectedBatchId}
        >
          <SelectTrigger>
            <SelectValue placeholder="All percentages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All percentages</SelectItem>
            <SelectItem value="25">25%</SelectItem>
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="75">75%</SelectItem>
            <SelectItem value="75-assistantship">
              75% + Assistantship
            </SelectItem>
            <SelectItem value="100">100%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Major Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Filter by Major (Optional)
        </label>
        <Select
          value={selectedMajor || "all"}
          onValueChange={(value) => onMajorChange(value === "all" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All majors" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Majors</SelectItem>
            <SelectItem value="Software Engineering">
              Software Engineering
            </SelectItem>
            <SelectItem value="Cyber Security">Cyber Security</SelectItem>
            <SelectItem value="Robotics and Automation Engineering">
              Robotics and Automation Engineering
            </SelectItem>
            <SelectItem value="Data Science and Artificial Intelligence">
              Data Science and Artificial Intelligence
            </SelectItem>
            <SelectItem value="Business Intelligence">
              Business Intelligence
            </SelectItem>
            <SelectItem value="Architecture">Architecture</SelectItem>
            <SelectItem value="Interior Design">Interior Design</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipient Group Selector removed: explicit filters are used */}

      {/* Search Button */}
      <div className="space-y-2">
        <label className="text-sm font-medium">&nbsp;</label>
        <Button
          onClick={onSearchClick}
          disabled={
            (!selectedBatch && !hasSearchTerm) ||
            isBatchesLoading ||
            isSearching
          }
          className="bg-[#0F386C] hover:bg-[#0a2a4f] text-white"
        >
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? "Searching..." : "Search Recipients"}
        </Button>
      </div>
    </div>
  );
}
