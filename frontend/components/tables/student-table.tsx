//student table
"use client";

import * as React from "react";

import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";

import { DataTable } from "@/components/data-table";
import { getColumnsForTableType } from "@/components/tables/data-table/new-colum";
import { StudentStatus } from "../../constants/enum";

interface StudentTableProps {
  type?: StudentStatus | "all";
  title?: string;
  showTabs?: boolean;
  initialData?: Student[];
  defaultTab?: StudentStatus | "all";
  onRowSelect?: (selectedRows: Student[]) => void;
  onExport?: () => void;
  onCreateBatch?: () => void;
  onBatchCreated?: (batchData: unknown) => void;
  onEnterScores?: () => void;
  className?: string;
  showEmailButton?: boolean;
  showImportFile?: boolean;
}

export function StudentTable({
  type = "all",
  title = "Students",
  showTabs = false,
  initialData,
  defaultTab,
  onRowSelect,
  onExport,
  onCreateBatch,

  onEnterScores,
  className,

  showImportFile = true,
}: StudentTableProps) {
  const [activeTab, setActiveTab] = React.useState<StudentStatus | "all">(
    defaultTab || (showTabs ? "all" : type),
  );
  const [, setSelectedStudents] = React.useState<Student[]>([]);
  const [fetchedStudents, setFetchedStudents] = React.useState<
    Student[] | null
  >(null);
  const [isClient, setIsClient] = React.useState(false);
  const [selectedBatch, setSelectedBatch] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearchChange = React.useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Update active tab when defaultTab changes (e.g., after import)
  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Ensure component is hydrated
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Get data based on active tab - memoized to prevent infinite loops
  const data = React.useMemo(() => {
    if (!isClient) return []; // Return empty array during SSR

    // Use initialData if provided; otherwise fall back to fetchedStudents
    const sourceData = initialData ?? fetchedStudents ?? [];

    // If using initialData (client-side filtering), apply filters
    // If using fetchedStudents (server-side filtering via API), data is already filtered
    if (!initialData && fetchedStudents) {
      // Server-side filtering: API already filtered by status and batch, just return as-is
      return sourceData;
    }

    // Client-side filtering (when initialData is provided)
    let filteredData: Student[] = [];
    switch (activeTab) {
      // case "new-applicant":
      //   filteredData = sourceData.filter(
      //     (student) => student.status === "new-applicant",
      //   );
      //   break;

      case "submitted":
        filteredData = sourceData.filter(
          (student) => student.status === "submitted",
        );
        break;
      case "shortlisted":
        filteredData = sourceData.filter(
          (student) => student.status === "shortlisted",
        );
        break;
      case "graded":
        // Show both exam-scheduled AND awarded students in Result tab
        filteredData = sourceData.filter(
          (student) => student.status === "graded",
        );
        break;
      case "accepted":
        filteredData = sourceData.filter(
          (student) => student.status === "accepted",
        );
        break;
      case "rejected":
        filteredData = sourceData.filter(
          (student) => student.status === "rejected",
        );
        break;
      case "all":
      default:
        // For "all" view with batch filter, show all students from that batch
        // For "all" view without batch filter, get the latest status for each unique student
        if (selectedBatch) {
          // If batch is selected, show ALL students from that batch regardless of status
          filteredData = sourceData.filter(
            (student) => student.batch === selectedBatch,
          );
        } else {
          // No batch selected: deduplicate by student number, showing highest priority status
          const studentMap = new Map<string, Student>();

          // Status priority: awarded > rejected > exam-scheduled > shortlisted > new-applicant
          const statusPriority: Record<StudentStatus, number> = {
            accepted_email_sent: 8,
            shortlisted_email_sent: 7,
            submitted: 6,
            accepted: 5,
            rejected: 4,
            graded: 3,
            shortlisted: 2,
            incomplete: 1,

            // "new-applicant": 1,
          };

          sourceData.forEach((student) => {
            const existing = studentMap.get(student.number);
            if (
              !existing ||
              statusPriority[student.status as StudentStatus] >
              statusPriority[existing.status as StudentStatus]
            ) {
              studentMap.set(student.number, student);
            }
          });

          filteredData = Array.from(studentMap.values());
        }
    }

    // Further filter by selected batch if one is selected (for non-"all" tabs)
    if (selectedBatch && activeTab !== "all") {
      filteredData = filteredData.filter(
        (student) => student.batch === selectedBatch,
      );
    }

    return filteredData;
  }, [initialData, fetchedStudents, isClient, activeTab, selectedBatch]);

  // Get ALL students (across all statuses) for batch extraction
  // This ensures batch dropdown shows all available batches regardless of status filter
  const allStudentsForBatches = React.useMemo(() => {
    if (!isClient) return [];
    return initialData ?? fetchedStudents ?? [];
  }, [initialData, fetchedStudents, isClient]);

  // Fetch applicants from API if initialData is not provided
  React.useEffect(() => {
    let cancelled = false;
    async function fetchApplicants() {
      try {
        if (initialData && initialData.length > 0) return;

        setIsLoading(true);

        // Build query parameters for pagination
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
        });

        // Add status filter if not "all"
        if (activeTab !== "all") {
          params.append("status", activeTab);
        }

        // Add batch filter if selected (use batchId param)
        if (selectedBatch) {
          params.append("batchId", selectedBatch);
        }

        // Add search query if provided
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }

        const fullUrl = `${API_ENDPOINTS.APPLICANT}?${params.toString()}`;

        const res = await apiClient.get(fullUrl);

        const payload = res?.data?.data ?? res?.data ?? [];
        const items = Array.isArray(payload) ? payload : (payload?.items ?? []);

        // Extract pagination info
        const pagination = res?.data?.pagination ?? {};
        const total = pagination.total ?? pagination.totalCount ?? 0;
        const pages = pagination.totalPages ?? Math.ceil(total / pageSize);

        // Map API response to local Student shape
        const mapped = items.map((app: ApiApplicant) => {
          const id = String(app.applicationId ?? app.id ?? app.applicationId);
          const number = app.number || `${id}`;
          const name = app.nameEn || app.name || app.full_name || "";
          const gender = app.gender || "Male";
          const email = app.email || "";
          const major = app.major || app.program || "";
          const province = app.placeOfBirth || app.province || "";
          const dateApplied = app.dateApplied
            ? new Date(String(app.dateApplied))
            : app.createdAt
              ? new Date(String(app.createdAt))
              : app.date
                ? new Date(String(app.date))
                : new Date();
          const statusRaw = (app.applicationStatus || app.status || "")
            .toString()
            .toLowerCase();
          const totalApplicationScore = app.totalApplicationScore ?? 0;
          const rank = app.rank ?? 0;
          const subjects = app.subjects || [];

          const status = ((): StudentStatus => {
            switch (statusRaw) {
              // case "new-applicant":
              //   return "new-applicant";
              // case "new":
              // case "pending":
              //   return "new-applicant";
              case "shortlisted":
                return "shortlisted";
              case "graded":
                return "graded";
              case "accepted":
                return "accepted";
              case "rejected":
                return "rejected";
              case "submitted":
                return "submitted";
              case "incomplete":
                return "incomplete";
              case "shortlisted_email_sent":
                return "shortlisted_email_sent";
              case "accepted_email_sent":
                return "accepted_email_sent";
              default:
                console.warn(
                  `Unknown status "${statusRaw}" for student ${number}, defaulting to submitted`,
                );
                // return "new-applicant";
                return "submitted";
            }
          })();

          return {
            id,
            number,
            nameEn: name,
            name,
            gender,
            email,
            major,
            province,
            dateApplied,
            phoneNumber: app.phoneNumber || "",
            overAllGrade: app.overAllGrade,
            requestTerm: app.requestTerm,
            status,
            totalApplicationScore,
            rank,
            subjects,
            originalStatus: app.status, // Preserve the original API status
            _raw: app,
            // Add batch fields for filtering
            batch: String(app.batchId ?? app.batch ?? ""),
            batchId: app.batchId ?? app.batch ?? null,
            batchName: app.batchName ?? app.batch ?? "",
            scholarshipPercentage: app.scholarshipPercentage,
          } as Student;
        });

        if (!cancelled) {
          setFetchedStudents(mapped);
          setTotalCount(total);
          setTotalPages(pages);
        }
      } catch (err) {
        console.error(" Failed to fetch applicants:", err);
        console.error("Error details:", {
          message: (err as Error).message,
          response: (err as { response?: { data?: unknown; status?: number } })
            .response?.data,
          status: (err as { response?: { data?: unknown; status?: number } })
            .response?.status,
          currentPage,
          pageSize,
          activeTab,
          selectedBatch,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchApplicants();
    return () => {
      cancelled = true;
    };
  }, [initialData, currentPage, pageSize, activeTab, selectedBatch, searchQuery]);

  const columns = React.useMemo(
    () => getColumnsForTableType(activeTab),
    [activeTab],
  );

  // Handle row selection - memoized to prevent infinite loops
  const handleRowSelection = React.useCallback(
    (selectedRows: Student[]) => {
      setSelectedStudents(selectedRows);
      onRowSelect?.(selectedRows);
    },
    [onRowSelect],
  );

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setActiveTab(status as StudentStatus | "all");
    setCurrentPage(1); // Reset to first page when changing status
  };

  // Handle pagination change
  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = React.useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Handle export - memoized to prevent infinite loops
  const handleExport = React.useCallback(() => {
    if (onExport) {
      onExport();
    } else {
      // Default export functionality
      if (data.length === 0) return;

      const csvContent = [
        // CSV headers
        Object.keys(data[0]).join(","),
        // CSV data
        ...data.map((student) =>
          Object.values(student)
            .map((value) =>
              typeof value === "object" && value instanceof Date
                ? value.toISOString().split("T")[0]
                : `"${String(value).replace(/"/g, '""')}"`,
            )
            .join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students-${activeTab}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [data, activeTab, onExport]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground">Loading student data...</p>
          </div>
        </div>
        <div className="rounded-md border p-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // function handleBatchCreated(batchData: unknown): void {
  //   try {
  //     if (!batchData) return;
  //     const payload = batchData as BatchData;
  //     const newStudents: Student[] = Array.isArray(payload?.students)
  //       ? (payload!.students as Student[])
  //       : [];

  //     if (initialData && initialData.length > 0) {

  //       onBatchCreated?.(batchData);
  //       return;
  //     }

  //     setFetchedStudents((prev) => {
  //       const curr = prev ?? [];
  //       const existingIds = new Set(curr.map((s) => s.id || s.number));
  //       const merged = [...curr];
  //       newStudents.forEach((s) => {
  //         const id = s.id || s.number;
  //         if (!existingIds.has(id)) {
  //           merged.push(s);
  //           existingIds.add(id);
  //         }
  //       });
  //       try {
  //         localStorage.setItem("applicants", JSON.stringify(merged));
  //       } catch {
  //         /* ignore */
  //       }
  //       return merged;
  //     });

  //     setActiveTab("submitted");

  //     if (onBatchCreated) {
  //       onBatchCreated(batchData);
  //     }
  //   } catch (err) {
  //     console.error("Error handling onBatchCreated", err);
  //   }
  // }

  return (
    <div className={className}>
      {/* Data Table */}
      <div className="relative h-full w-full min-w-0">
        <DataTable
          columns={columns}
          data={data}
          allData={allStudentsForBatches}
          searchPlaceholder="Search by ID, name, gender..."
          showSearch={true}
          showPagination={true}
          showRowSelection={true}
          showExportButton={true}
          showCreateBatch={!!onCreateBatch}
          showEnterScores={!!onEnterScores}
          showBatchFilter={true}
          showImportFile={showImportFile}
          showStatusFilter={showTabs}
          currentStatus={activeTab}
          onStatusFilterChange={handleStatusChange}
          onRowSelectionChange={handleRowSelection}
          onExport={handleExport}
          onCreateBatch={onCreateBatch}
          // onBatchCreated={handleBatchCreated}
          onEnterScores={onEnterScores}
          onBatchFilterChange={setSelectedBatch}
          emptyMessage={`No ${activeTab === "all" ? "students" : activeTab.replace("-", " ")} found.`}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 30, 50, 100]}
          serverSidePagination={!initialData}
          totalCount={totalCount}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={isLoading}
          onSearchChange={handleSearchChange}
          searchValue={searchQuery}
        />
      </div>

      {/* Send Email Button - Appears under pagination when students are selected */}
    </div>
  );
}

// Hook for data fetching (ready for API integration)
export function useStudentData() {
  const [data, setData] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // For now, return empty data until API is connected
      setTimeout(() => {
        setData([]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
