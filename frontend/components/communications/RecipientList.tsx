"use client";

import { Card } from "@/components/ui/card";
import { Users, Mail, CheckSquare, Square } from "lucide-react";
import { RecipientListSkeleton } from "@/components/communications/EmailSkeletons";

interface LocalApplicant {
  id: number;
  nameEn: string;
  email: string;
  status: string;
  batchId?: string;
  batchName?: string;
  scholarshipPercentage?: number;
  major?: string;
  gender?: string;
}

interface RecipientListProps {
  applicants: LocalApplicant[];
  isLoadingApplicants: boolean;
  selectedBatch: string;
  hasSearched: boolean;
  searchError: string;
  selectedRecipientIds: number[];
  onToggleRecipient: (id: number) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  manualEmails: string;
  onManualEmailsChange: (value: string) => void;
}

export function RecipientList({
  applicants,
  isLoadingApplicants,
  selectedBatch,
  hasSearched,
  searchError,
  selectedRecipientIds,
  onToggleRecipient,
  searchTerm,
  onSearchTermChange,
  manualEmails,
  onManualEmailsChange,
}: RecipientListProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recipients</h3>
      </div>

      <div className="mt-4">
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Find a registered applicant
        </label>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          placeholder="Search by applicant name or email"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="mt-4 border rounded-lg p-3 bg-muted/20">
        <label className="text-xs font-medium text-muted-foreground block mb-2">
          Test real email(s) - comma separated
        </label>
        <input
          value={manualEmails}
          onChange={(event) => onManualEmailsChange(event.target.value)}
          placeholder="rv6024010101@camtech.edu.kh, rangsey.virak@camtech.edu"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {searchError ? (
        <div className="text-center py-8 text-red-500">
          <p>{searchError}</p>
        </div>
      ) : !selectedBatch && !searchTerm.trim() ? (
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-2" />
          <p className="text-sm text-muted-foreground">
            Please select a batch first
          </p>
        </div>
      ) : isLoadingApplicants ? (
        <RecipientListSkeleton />
      ) : !hasSearched ? (
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-2" />
          <p className="text-sm text-muted-foreground">
            Click "Search Recipients" to load applicants
          </p>
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-2" />
          <p className="text-sm text-muted-foreground">
            No applicants found matching the filters
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {applicants.map((applicant, index) => {
            return (
              <div
                key={`recipient-${applicant.id}-${index}`}
                className="p-3 border rounded-lg bg-card transition-all hover:border-primary/50"
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleRecipient(Number(applicant.id))}
                    className="mt-1 text-muted-foreground hover:text-primary"
                    aria-label={`Select ${applicant.nameEn}`}
                  >
                    {selectedRecipientIds.includes(Number(applicant.id)) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-medium text-sm truncate">
                        {applicant.nameEn}
                      </p>
                      {applicant.scholarshipPercentage !== undefined && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200 flex-shrink-0">
                          {applicant.scholarshipPercentage}% Scholarship
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {applicant.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {applicant.major && (
                        <span className="truncate">
                          Major: {applicant.major}
                        </span>
                      )}
                      {applicant.major && applicant.gender && <span>•</span>}
                      {applicant.gender && (
                        <span className="capitalize">{applicant.gender}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
