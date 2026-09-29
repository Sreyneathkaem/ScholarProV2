//new column

"use client";

import React from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ChevronsUpDown,
  MoreVertical,
  Eye,
  ArrowRightLeft,
  Check,
  Loader2,
  FileText,
  AlertCircle,
  Award,
  CheckCircle2,
  XCircle,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { toast } from "sonner";
import { StudentStatus } from "@/constants/enum";

export const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  submitted: {
    label: "Submitted",
    className: "bg-[#edf4fc] text-[#0F386C] border-[#b8d4f6]",
  },
  incomplete: {
    label: "Incomplete",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  shortlisted: {
    label: "Shortlisted",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  graded: {
    label: "Graded",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  accepted: {
    label: "Accepted",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  accepted_email_sent: {
    label: "Accepted Email Sent",
    className: "bg-teal-50 text-teal-700 border-teal-200",
  },
  shortlisted_email_sent: {
    label: "Shortlisted Email Sent",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  assessment_scheduled: {
    label: "Assessment Scheduled",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
};

export const StatusBadge = ({
  status,
  student,
}: {
  status: StudentStatus | string;
  student?: Student;
}) => {
  const normalizedKey = (status || student?.originalStatus || "submitted").toLowerCase();
  const config = STATUS_CONFIG[normalizedKey] || STATUS_CONFIG.submitted;

  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap font-medium text-xs px-2.5 py-0.5 rounded-full border shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
        config.className
      )}
    >
      {config.label}
    </Badge>
  );
};

export const STATUS_OPTIONS: {
  value: StudentStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}[] = [
  {
    value: "submitted",
    label: "Submitted",
    icon: FileText,
    color: "text-[#0F386C]",
  },
  {
    value: "incomplete",
    label: "Incomplete",
    icon: AlertCircle,
    color: "text-amber-600",
  },
  {
    value: "shortlisted",
    label: "Shortlisted",
    icon: CheckCircle2,
    color: "text-purple-600",
  },
  {
    value: "graded",
    label: "Graded",
    icon: Award,
    color: "text-blue-600",
  },
  {
    value: "accepted",
    label: "Accepted",
    icon: Award,
    color: "text-emerald-600",
  },
  {
    value: "rejected",
    label: "Rejected",
    icon: XCircle,
    color: "text-rose-600",
  },
  {
    value: "shortlisted_email_sent",
    label: "Shortlisted Email Sent",
    icon: Mail,
    color: "text-indigo-600",
  },
  {
    value: "accepted_email_sent",
    label: "Accepted Email Sent",
    icon: Mail,
    color: "text-teal-600",
  },
];

// Base columns that are common across all table variants
export const baseStudentColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "number",
    header: "Number",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("number")}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "nameEn",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Name
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => (
      <Link
        href={`/applicant/${row.original.id}`}
        className="font-medium text-primary cursor-pointer hover:underline"
      >
        {row.getValue("nameEn")}
      </Link>
    ),
  },
  {
    accessorKey: "gender",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Gender
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("gender")}</div>,
  },
  {
    accessorKey: "major",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Major
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("major")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Email
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },
  {
    accessorKey: "province",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Province
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("province")}</div>,
  },
  // {
  //   accessorKey: "email",
  //   header: ({ column }) => (
  //     <div
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       className="flex items-center cursor-pointer text-white font-medium"
  //     >
  //       Email
  //       <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
  //     </div>
  //   ),
  //   cell: ({ row }) => <div>{row.getValue("email")}</div>,
  // },

  {
    accessorKey: "dateApplied",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Date Applied
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => {
      const date = row.getValue("dateApplied") as Date;
      try {
        const validDate = new Date(date);
        if (isNaN(validDate.getTime())) {
          return <div>-</div>;
        }
        return <div>{format(validDate, "dd/MM/yyyy")}</div>;
      } catch {
        return <div>-</div>;
      }
    },
  },
];

// Evaluation score column - shows interview evaluation total
export const evaluationColumn: ColumnDef<Student> = {
  id: "evaluation",
  header: ({ column }) => (
    <div
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center cursor-pointer text-white font-medium"
    >
      Evaluation
      <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
    </div>
  ),
  // cell: ({ row }) => {
  //   const student = row.original;
  //   const evaluation = student.evaluation;

  //   if (!evaluation || !evaluation.totalScore) {
  //     return (
  //       <div className="flex items-center gap-2">
  //         <Badge variant="outline" className="text-gray-400">
  //           Not Evaluated
  //         </Badge>
  //       </div>
  //     );
  //   }

  cell: ({ row }) => {
    return (
      <div className="font-semibold">
        {row.original.evaluation?.totalScore || "-"}
      </div>
    );

    // Color based on score
    // const score = evaluation.totalScore;
    // let colorClass = "bg-red-100 text-red-700 border-red-300";
    // if (score >= 80)
    //   colorClass = "bg-green-100 text-green-700 border-green-300";
    // else if (score >= 60)
    //   colorClass = "bg-blue-100 text-blue-700 border-blue-300";
    // else if (score >= 40)
    //   colorClass = "bg-yellow-100 text-yellow-700 border-yellow-300";

    // return (
    //   <div className="flex items-center gap-2">
    //     <Badge variant="outline" className={`${colorClass} font-semibold`}>
    //       {score}/100
    //     </Badge>
    //   </div>
    // );
  },
  sortingFn: (rowA, rowB) => {
    const scoreA = rowA.original.evaluation?.totalScore || 0;
    const scoreB = rowB.original.evaluation?.totalScore || 0;
    return scoreA - scoreB;
  },
};

// Status column for tables that need it
export const statusColumn: ColumnDef<Student> = {
  accessorKey: "status",
  header: ({ column }) => (
    <div
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center cursor-pointer text-white font-medium"
    >
      Status
      <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
    </div>
  ),
  cell: ({ row }) => {
    const status = row.getValue("status") as StudentStatus;
    return <StatusBadge status={status} student={row.original} />;
  },
};

export interface ActionsCellProps {
  student: Student;
  onStatusUpdated?: (studentId: string, newStatus: StudentStatus) => void;
}

export const ActionsCell: React.FC<ActionsCellProps> = ({
  student,
  onStatusUpdated,
}) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleStatusChange = async (
    newStatus: StudentStatus,
    label: string,
  ) => {
    const currentStatus = (student.status || student.originalStatus || "").toLowerCase();
    if (currentStatus === newStatus.toLowerCase()) {
      toast.info(`${student.nameEn || "Applicant"} is already ${label}.`);
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.patch(`${API_ENDPOINTS.APPLICANT}/${student.id}`, {
        status: newStatus,
      });
      toast.success(`Applicant moved to ${label}`);
      onStatusUpdated?.(student.id, newStatus);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("refresh-applicant-table", {
            detail: { studentId: student.id, status: newStatus },
          }),
        );
      }
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        apiError.response?.data?.message || "Failed to update applicant status",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={isUpdating}
        >
          <span className="sr-only">Open menu</span>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => router.push(`/applicant/${student.id}`)}
          className="cursor-pointer flex items-center gap-2"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span>View details</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <span>Move to status</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-1">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Select Status
            </DropdownMenuLabel>
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const currentStatus = (student.status || student.originalStatus || "").toLowerCase();
              const isCurrent = currentStatus === opt.value.toLowerCase();
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value, opt.label)}
                  className={cn(
                    "cursor-pointer flex items-center justify-between text-xs py-2 px-2 rounded-sm",
                    isCurrent && "bg-accent/60 font-semibold text-primary",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", opt.color)} />
                    <span>{opt.label}</span>
                  </div>
                  {isCurrent && (
                    <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createActionsColumn = (
  onStatusUpdated?: (studentId: string, newStatus: StudentStatus) => void,
): ColumnDef<Student> => ({
  id: "actions",
  enableHiding: true,
  cell: ({ row }) => (
    <ActionsCell student={row.original} onStatusUpdated={onStatusUpdated} />
  ),
});

export const actionsColumn: ColumnDef<Student> = createActionsColumn();

// Actions column for Result/Exam tab with scholarship award options
export const examActionsColumn: ColumnDef<Student> = {
  id: "actions",
  enableHiding: true,
  meta: {
    isSticky: true,
  },
  cell: ({ row }) => {
    const student = row.original;
    return <ExamActionsCell student={student} />;
  },
};

const ExamActionsCell: React.FC<{
  student: Student;
  onStatusUpdated?: (studentId: string, newStatus: StudentStatus) => void;
}> = ({ student, onStatusUpdated }) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleScholarshipAward = async (percentage: number) => {
    setIsUpdating(true);
    try {
      await apiClient.patch(`${API_ENDPOINTS.APPLICANT}/${student.id}`, {
        scholarshipPercentage: percentage,
        status: "accepted",
      });
      toast.success(`Awarded ${percentage}% scholarship to applicant`);
      onStatusUpdated?.(student.id, "accepted");
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("refresh-applicant-table", {
            detail: { studentId: student.id, status: "accepted" },
          }),
        );
      }
    } catch (error) {
      console.error("Error updating scholarship:", error);
      toast.error("Failed to update scholarship award");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (
    newStatus: StudentStatus,
    label: string,
  ) => {
    const currentStatus = (student.status || student.originalStatus || "").toLowerCase();
    if (currentStatus === newStatus.toLowerCase()) {
      toast.info(`${student.nameEn || "Applicant"} is already ${label}.`);
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.patch(`${API_ENDPOINTS.APPLICANT}/${student.id}`, {
        status: newStatus,
      });
      toast.success(`Applicant moved to ${label}`);
      onStatusUpdated?.(student.id, newStatus);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("refresh-applicant-table", {
            detail: { studentId: student.id, status: newStatus },
          }),
        );
      }
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { message?: string } };
      };
      toast.error(
        apiError.response?.data?.message || "Failed to update applicant status",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          disabled={isUpdating}
        >
          <span className="sr-only">Open menu</span>
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Actions
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => router.push(`/applicant/${student.id}`)}
          className="cursor-pointer flex items-center gap-2"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span>View details</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <span>Move to status</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-1">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
              Select Status
            </DropdownMenuLabel>
            {STATUS_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const currentStatus = (student.status || student.originalStatus || "").toLowerCase();
              const isCurrent = currentStatus === opt.value.toLowerCase();
              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value, opt.label)}
                  className={cn(
                    "cursor-pointer flex items-center justify-between text-xs py-2 px-2 rounded-sm",
                    isCurrent && "bg-accent/60 font-semibold text-primary",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", opt.color)} />
                    <span>{opt.label}</span>
                  </div>
                  {isCurrent && (
                    <Check className="h-3.5 w-3.5 text-primary ml-auto" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Award Scholarship
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => handleScholarshipAward(100)}
          className="cursor-pointer"
        >
          Award 100%
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleScholarshipAward(75)}
          className="cursor-pointer"
        >
          Award 75%
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleScholarshipAward(50)}
          className="cursor-pointer"
        >
          Award 50%
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleScholarshipAward(25)}
          className="cursor-pointer"
        >
          Award 25%
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Core columns without Province for most tables
export const coreStudentColumns: ColumnDef<Student>[] = [
  {
    accessorKey: "number",
    header: "Number",
    cell: ({ row }) => (
      <div className="font-medium"> {row.getValue("number")}</div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "nameEn",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Name
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => (
      <Link
        href={`/applicant/${row.original.id}`}
        className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
      >
        {row.getValue("nameEn")}
      </Link>
    ),
  },
  {
    accessorKey: "gender",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Gender
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("gender")}</div>,
  },
  {
    accessorKey: "major",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Major
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("major")}</div>,
  },

  {
    accessorKey: "email",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Email
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("email")}</div>,
  },

  {
    accessorKey: "province",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Province
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("province")}</div>,
  },

  {
    accessorKey: "requestTerm",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Request Term
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),

    cell: ({ row }) => {
      const date = row.getValue("requestTerm") as Date;
      try {
        const validDate = new Date(date);
        if (isNaN(validDate.getTime())) {
          return <div>-</div>;
        }
        return <div>{format(validDate, "dd/MM/yyyy")}</div>;
      } catch {
        return <div>-</div>;
      }
    },
    // cell: ({ row }) => <div>{row.getValue("requestTerm")}</div>,
  },

  {
    accessorKey: "overAllGrade",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Overall Grade
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("overAllGrade")}</div>,
  },

  {
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <div
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center cursor-pointer text-white font-medium"
      >
        Phone Number
        <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
      </div>
    ),
    cell: ({ row }) => <div>{row.getValue("phoneNumber")}</div>,
  },

  // {
  //   accessorKey: "status",
  //   header: ({ column }) => (
  //     <div
  //       onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
  //       className="flex items-center cursor-pointer text-white font-medium"
  //     >
  //       Status
  //       <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
  //     </div>
  //   ),
  //   cell: ({ row }) => {
  //     const status = row.getValue("status") as StudentStatus;
  //     return <StatusBadge status={status} student={row.original} />;
  //   },
  // },
];

// Date Applied column
export const dateAppliedColumn: ColumnDef<Student> = {
  accessorKey: "dateApplied",
  header: ({ column }) => (
    <div
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center cursor-pointer text-white font-medium"
    >
      Date Applied
      <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
    </div>
  ),
  cell: ({ row }) => {
    const date = row.getValue("dateApplied") as Date;
    try {
      const validDate = new Date(date);
      if (isNaN(validDate.getTime())) {
        return <div>-</div>;
      }
      return <div>{format(validDate, "dd/MM/yyyy")}</div>;
    } catch {
      return <div>-</div>;
    }
  },
};

// Exam Score column (renamed from Exam Date) for Awards and Rejected tabs
export const examDateColumn: ColumnDef<Student> = {
  accessorKey: "interviewDate",
  header: ({ column }) => (
    <div
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center cursor-pointer text-white font-medium"
    >
      Exam Score
      <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
    </div>
  ),
  cell: ({ row }) => {
    const date = row.getValue("interviewDate") as Date;
    if (!date) return <div>-</div>;
    try {
      const validDate = new Date(date);
      if (isNaN(validDate.getTime())) {
        return <div>-</div>;
      }
      return <div>{format(validDate, "dd/MM/yyyy")}</div>;
    } catch {
      return <div>-</div>;
    }
  },
};

// Exam Score column for Result tab (exam-scheduled) - fetches total from student data
export const examScoreColumn: ColumnDef<Student> = {
  id: "totalScore",
  header: ({ column }) => (
    <div
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center cursor-pointer text-white font-medium"
    >
      Exam Score
      <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
    </div>
  ),
  // cell: ({ row }) => {
  //   const student = row.original;
  //   const mathScore = student.mathScore || 0;
  //   const englishScore = student.englishScore || 0;
  //   const total = mathScore + englishScore;
  //   return total > 0 ? (
  //     <div className="font-semibold">{total}</div>
  //   ) : (
  //     <div>-</div>
  //   );
  // },

  cell: ({ row }) => {
    return (
      <div className="font-semibold">{row.original.totalApplicationScore}</div>
    );
  },

  sortingFn: (rowA, rowB) => {
    const getTotalA = rowA.original.totalApplicationScore || 0;
    const getTotalB = rowB.original.totalApplicationScore || 0;
    return getTotalA - getTotalB;
  },
};

// Scholarship % column for Awards tab
export const scholarshipColumn: ColumnDef<Student> = {
  accessorKey: "scholarshipPercentage",
  header: ({ column }) => (
    <div
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center cursor-pointer text-white font-medium"
    >
      Scholarship
      <ChevronsUpDown className="ml-2 h-4 w-4 text-white" />
    </div>
  ),
  cell: ({ row }) => {
    const amount = row.original.scholarshipPercentage as number;

    return <div>{amount}%</div>;
  },
};

// Specific column combinations for different table types matching UI
// export const newApplicantColumns: ColumnDef<Student>[] = [
//   ...coreStudentColumns, // All core columns including new fields
//   dateAppliedColumn,
//   actionsColumn,
// ];

export const scoreColumn: ColumnDef<Student>[] = [
  {
    id: "mathScore",
    header: "Math",
    cell: ({ row }) => {
      const student = row.original;
      const mathSubject = student.subjects?.find(
        (s) => s.subjectName === "Math",
      );
      return (
        <div className="font-medium">{mathSubject?.totalScore ?? "-"}</div>
      );
    },
    enableSorting: false,
  },

  {
    id: "englishScore",
    header: "English",
    cell: ({ row }) => {
      const student = row.original;
      const englishSubject = student.subjects?.find(
        (s) => s.subjectName === "English",
      );
      return (
        <div className="font-medium">{englishSubject?.totalScore ?? "-"}</div>
      );
    },
    enableSorting: false,
  },

  {
    id: "interviewScore",
    header: "Interview",
    cell: ({ row }) => {
      const student = row.original;
      const interviewSubject = student.subjects?.find(
        (s) => s.subjectName === "Interview",
      );
      return (
        <div className="font-medium">{interviewSubject?.totalScore ?? "-"}</div>
      );
    },
    enableSorting: false,
  },

  {
    accessorKey: "totalApplicationScore",
    header: "Total score",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("totalApplicationScore") ?? "-"}
      </div>
    ),
    enableSorting: false,
  },

  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("rank") ?? "-"}</div>
    ),
    enableSorting: false,
  },
];

export const sumittedColumns: ColumnDef<Student>[] = [
  ...coreStudentColumns, // All core columns including new fields
  dateAppliedColumn,

  statusColumn,
  actionsColumn,
];

export const shortlistedColumns: ColumnDef<Student>[] = [
  ...coreStudentColumns, // Number, Name, Gender, Major, Email
  dateAppliedColumn,
  statusColumn,
  actionsColumn,
];

export const examColumns: ColumnDef<Student>[] = [
  ...coreStudentColumns, // All core columns including new fields
  ...scoreColumn,
  // Show interview evaluation score
  // Use regular actions column (View details, Send email, Delete)
  statusColumn,
  actionsColumn,
];

export const awardedColumns: ColumnDef<Student>[] = [
  ...coreStudentColumns, // Number, Name, Gender, Major, Email
  scholarshipColumn,

  statusColumn,

  actionsColumn,
];

export const rejectedColumns: ColumnDef<Student>[] = [
  ...coreStudentColumns, // Number, Name, Gender, Major, Email
  statusColumn,
  actionsColumn,
];

// Helper function to get columns based on table type
export const getColumnsForTableType = (
  type: StudentStatus | "all",
  onStatusUpdated?: (studentId: string, newStatus: StudentStatus) => void,
): ColumnDef<Student>[] => {
  const actions = onStatusUpdated
    ? createActionsColumn(onStatusUpdated)
    : actionsColumn;

  switch (type) {
    case "incomplete":
    case "submitted":
      return [...coreStudentColumns, dateAppliedColumn, statusColumn, actions];
    case "shortlisted":
    case "shortlisted_email_sent":
      return [...coreStudentColumns, dateAppliedColumn, statusColumn, actions];
    case "graded":
      return [...coreStudentColumns, ...scoreColumn, statusColumn, actions];
    case "accepted":
    case "accepted_email_sent":
      return [...coreStudentColumns, scholarshipColumn, statusColumn, actions];
    case "rejected":
      return [...coreStudentColumns, statusColumn, actions];
    case "all":
    default:
      // For "all" view, show all core columns with status and action menu
      return [...baseStudentColumns, statusColumn, actions];
  }
};
