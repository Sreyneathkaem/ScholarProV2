
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderPlus,
  ListFilter,
  FileText,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { NewBatch } from "./batch/new-batch";
// import { ImportStudentCSVModal } from "./batch/new-import";

import BatchSelectorApi from "./batch-selector-api";
import { ExportStudent } from "./applicants/export-file";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  allData?: TData[]; // All unfiltered data for extracting batches
  searchPlaceholder?: string;
  showSearch?: boolean;
  showPagination?: boolean;
  showRowSelection?: boolean;
  showExportButton?: boolean;
  showCreateBatch?: boolean;
  showEnterScores?: boolean;
  showBatchFilter?: boolean;
  showStatusFilter?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  onExport?: () => void;
  onCreateBatch?: () => void;
  onEnterScores?: () => void;
  onBatchFilterChange?: (batch: string | null) => void;
  onStatusFilterChange?: (status: string) => void;
  onBatchCreated?: (batchData: unknown) => void;
  onImportFile?: () => void;
  showImportFile?: boolean;
  currentStatus?: string;
  emptyMessage?: string;
  className?: string;
  pageSize?: number;
  pageSizeOptions?: number[];
  // Server-side pagination
  serverSidePagination?: boolean;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
  onSearchChange?: (search: string) => void;
  searchValue?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,

  searchPlaceholder = "Search...",
  showSearch = true,
  showPagination = true,
  showRowSelection = false,

  // showCreateBatch = false,
  showEnterScores = false,
  showBatchFilter = false,
  showStatusFilter = false,
  showImportFile = false,
  onRowSelectionChange,

  // onBatchCreated,
  onEnterScores,
  onBatchFilterChange,
  onStatusFilterChange,
  currentStatus = "all",
  emptyMessage = "No results.",
  className,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  serverSidePagination = false,
  totalCount = 0,
  totalPages = 0,
  currentPage = 1,
  onPageChange,
  onPageSizeChange,
  isLoading = false,

  onImportFile,
  onSearchChange,
  searchValue,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState(searchValue || "");

  React.useEffect(() => {
    if (searchValue !== undefined) {
      setSearchTerm(searchValue);
    }
  }, [searchValue]);

  React.useEffect(() => {
    if (!onSearchChange) return;
    const timer = setTimeout(() => {
      onSearchChange(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  // const [showCreateBatchModal, setShowCreateBatchModal] = React.useState(false);
  const [showImportFileModal, setShowImportFileModal] = React.useState(false);
  const [selectedBatch, setSelectedBatch] = React.useState<string>("all");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // Extract unique batches from data as { id, label } entries.
  // Prefer `batchId` and `batchName` fields when available, otherwise fall back to `batch`.

  // Initialize selected batch from `batchId` query param (if present)
  const searchParams = useSearchParams();
  React.useEffect(() => {
    const batchId = searchParams?.get("batchId");
    if (batchId) {
      setSelectedBatch(batchId);
      if (onBatchFilterChange)
        onBatchFilterChange(batchId === "all" ? null : batchId);
    }
  }, [searchParams?.toString()]);

  // Client-side filtering by selectedBatch (skip when server-side pagination is enabled)
  const dataToDisplay = React.useMemo(() => {
    if (serverSidePagination) return data;
    if (!showBatchFilter || !selectedBatch || selectedBatch === "all")
      return data;
    return data.filter((row: TData) => {
      const r = row as Record<string, unknown>;
      const id = r.batchId ?? r.batch ?? null;
      return id != null && String(id) === selectedBatch;
    });
  }, [data, selectedBatch, serverSidePagination, showBatchFilter]);

  // Helper to find a user-friendly label for a batch id (looks in uniqueBatches then raw data)

  // Handle batch filter change
  const handleBatchChange = (batch: string) => {
    setSelectedBatch(batch);
    if (onBatchFilterChange) {
      onBatchFilterChange(batch === "all" ? null : batch);
    }
  };

  // Add selection column if row selection is enabled
  const tableColumns = React.useMemo(() => {
    if (!showRowSelection) return columns;

    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="border-white data-[state=checked]:text-white data-[state=checked]:border-white"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="border-[var(--primary)] data-[state=checked]:text-white data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    };

    return [selectionColumn, ...columns];
  }, [columns, showRowSelection]);

  const table = useReactTable({
    data:
      typeof dataToDisplay !== "undefined" ? (dataToDisplay as TData[]) : data,
    columns: tableColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    manualFiltering: Boolean(onSearchChange || serverSidePagination),
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
  });

  // Handle row selection change
  React.useEffect(() => {
    if (onRowSelectionChange && showRowSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, showRowSelection, table]);

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRowCount = table.getFilteredRowModel().rows.length;

  return (
    <div
      className={cn("flex flex-col h-full w-full min-w-0 space-y-4", className)}
    >
      <div className="flex items-center justify-end gap-2 flex-wrap flex-shrink-0">
        {/* {showCreateBatch && (
          <Button
            variant="default"
            size="default"
            onClick={() => {
              if (onCreateBatch) onCreateBatch();
              else setShowCreateBatchModal(true);
            }}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-10"
          >
            <Boxes className="mr-2 h-4 w-4" />
            Create Batch
          </Button>
        )} */}

        {showImportFile && (
          <Button
            variant="default"
            size="default"
            onClick={() => {
              if (onImportFile) onImportFile();
              else setShowImportFileModal(true);
            }}
            className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white h-10"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            Export File
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showSearch && (
            <div className="relative w-full sm:w-[280px] max-w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={onSearchChange ? searchTerm : globalFilter}
                onChange={(event) => {
                  const val = event.target.value;
                  if (onSearchChange) {
                    setSearchTerm(val);
                  } else {
                    setGlobalFilter(val);
                  }
                }}
                className="pl-8 w-full"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Status Filter */}
          {showStatusFilter && (
            <Select value={currentStatus} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 border-gray-300">
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {/* <SelectItem value="new-applicant">New Applicants</SelectItem> */}
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="graded">Grade</SelectItem>
                <SelectItem value="accepted">Awarded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="shortlisted_email_sent">
                  Shortlisted Email{" "}
                </SelectItem>
                <SelectItem value="accepted_email_sent">
                  Accepted Email{" "}
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          <BatchSelectorApi
            value={selectedBatch}
            onValueChange={handleBatchChange}
            includeAll={true}
            className="w-full sm:w-[180px]"
            label=""
            placeholder="Filter by Batch"
            showBatchCount={false}
          />

          {/* Enter Scores Button */}
          {showEnterScores && onEnterScores && (
            <Button
              variant="outline"
              size="default"
              onClick={onEnterScores}
              className="h-10 border-gray-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              Enter Scores
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-md border overflow-hidden relative w-full min-w-0"
        style={{ height: "430px" }}
      >
        <div className="overflow-x-auto overflow-y-auto w-full h-full">
          <table className="w-full min-w-max caption-bottom text-sm relative">
            <thead className="bg-[var(--primary)]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header, index) => {
                    const isFirst = index === 0;
                    const isLast = index === headerGroup.headers.length - 1;
                    return (
                      <th
                        key={header.id}
                        className={`sticky top-0 bg-[var(--primary)] z-20 text-white font-medium h-12 text-left whitespace-nowrap text-xs sm:text-sm ${isFirst ? "pl-4 sm:pl-6 pr-2 sm:pr-4" : isLast ? "pl-2 sm:pl-4 pr-4 sm:pr-6" : "px-2 sm:px-4"}`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      const isFirst = index === 0;
                      const isLast = index === row.getVisibleCells().length - 1;
                      return (
                        <td
                          key={cell.id}
                          className={`py-3 align-middle whitespace-nowrap text-xs sm:text-sm ${isFirst ? "pl-4 sm:pl-6 pr-2 sm:pr-4" : isLast ? "pl-2 sm:pl-4 pr-4 sm:pr-6" : "px-2 sm:px-4"}`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 px- flex-shrink-0">
          {/* Selection count on the left */}
          <div className="flex items-center">
            {showRowSelection && selectedRowCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedRowCount} of{" "}
                {serverSidePagination ? totalCount : totalRowCount} row(s)
                selected
              </span>
            )}
          </div>

          {/* Pagination controls on the right */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 lg:space-x-8 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <p className="text-sm font-medium whitespace-nowrap">
                Rows per page
              </p>
              <Select
                value={`${serverSidePagination ? initialPageSize : table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  const newSize = Number(value);
                  if (serverSidePagination) {
                    onPageSizeChange?.(newSize);
                  } else {
                    table.setPageSize(newSize);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue
                    placeholder={
                      serverSidePagination
                        ? initialPageSize
                        : table.getState().pagination.pageSize
                    }
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <div className="flex items-center justify-center text-sm font-medium min-w-[120px]">
                {serverSidePagination ? (
                  <>
                    Page {currentPage} of {totalPages || 1}
                  </>
                ) : (
                  <>
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount()}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 sm:flex"
                  onClick={() =>
                    serverSidePagination
                      ? onPageChange?.(1)
                      : table.setPageIndex(0)
                  }
                  disabled={
                    serverSidePagination
                      ? currentPage === 1
                      : !table.getCanPreviousPage()
                  }
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    serverSidePagination
                      ? onPageChange?.(currentPage - 1)
                      : table.previousPage()
                  }
                  disabled={
                    serverSidePagination
                      ? currentPage === 1
                      : !table.getCanPreviousPage()
                  }
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() =>
                    serverSidePagination
                      ? onPageChange?.(currentPage + 1)
                      : table.nextPage()
                  }
                  disabled={
                    serverSidePagination
                      ? currentPage >= totalPages
                      : !table.getCanNextPage()
                  }
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 sm:flex"
                  onClick={() =>
                    serverSidePagination
                      ? onPageChange?.(totalPages)
                      : table.setPageIndex(table.getPageCount() - 1)
                  }
                  disabled={
                    serverSidePagination
                      ? currentPage >= totalPages
                      : !table.getCanNextPage()
                  }
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {/* {showCreateBatch && (
        <NewBatch
          open={showCreateBatchModal}
          onOpenChange={setShowCreateBatchModal}
          onBatchCreated={onBatchCreated}
        />
      )} */}

      {/* Import File Modal */}
      {showImportFile && (
        <ExportStudent
          open={showImportFileModal}
          onOpenChange={setShowImportFileModal}
        />
      )}
    </div>
  );
}
