"use client";

import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";

import { ColumnDef } from "@tanstack/react-table";
import { TableMenu } from "../table-menu";
import { QUERY_KEY_ENUM } from "@/constants/query-key-enum";
import { formatDate } from "@/lib/utils/helper";

export const CommitteeColumns: ColumnDef<Commitee>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        className="text-white"
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "name",
    header: "Name",
  },

  {
    accessorKey: "user.email",
    header: "Email",
  },

  {
    accessorKey: "user.role",
    header: "Role",
  },
  {
    accessorKey: "user.phoneNumber",
    header: "Phone Number",
  },

  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return formatDate(createdAt);
    },
  },

  {
    accessorKey: "user.isActive",
    header: "Status",
    cell: ({ row }) => {
      // Support both boolean isActive and string status (legacy)
      const rawActive = (row.original as Commitee).user.isActive;
      const rawStatus = (row.original as Commitee).status;
      const isActive =
        typeof rawActive === "boolean"
          ? rawActive
          : String(rawStatus || "").toLowerCase() === "active";
      const label = isActive ? "Active" : "Inactive";
      const variant = isActive ? "approve" : "reject";
      return <Badge variant={variant}>{label}</Badge>;
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === "all") return true;
      const raw = row.getValue(columnId);
      let cellValue = "";
      if (typeof raw === "boolean") cellValue = raw ? "active" : "inactive";
      else if (typeof raw === "string") cellValue = raw.toLowerCase();
      else if ((row.original as Commitee).status)
        cellValue = String((row.original as Commitee).status).toLowerCase();
      else cellValue = "";
      return cellValue === String(filterValue).toLowerCase();
    },
  },

  {
    id: "actions",
    enableHiding: true,
    meta: {
      isSticky: true,
    },
    cell: ({ row }) => {
      const userId =
        row.original.user?.id ??
        (row.original as Commitee & { user_id?: string | number }).user_id ??
        row.original.id;

      return (
        <TableMenu
          id={String(userId)}
          invalidateKey={QUERY_KEY_ENUM.COMMITTEES}
          deleteEndpoint="/users"
        />
      );
    },
  },
];
