"use client";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { QUERY_KEY_ENUM } from "@/constants/query-key-enum";
import { ColumnDef } from "@tanstack/react-table";
import { TableMenu } from "../table-menu";
import { formatDate } from "@/lib/utils/helper";

export const AdminColumns: ColumnDef<Admin>[] = [
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
    accessorKey: "admin.name",
    header: "Full Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },

  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "phoneNumber",
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
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      // Support both boolean isActive and string status (legacy)
      const rawActive = (row.original as Admin).isActive;
      const rawStatus = (row.original as Admin).status;
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
      else if ((row.original as Admin).status)
        cellValue = String((row.original as Admin).status).toLowerCase();
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
        (row.original as Admin & { user?: { id?: string | number } }).user?.id ??
        row.original.user_id ??
        row.original.id;

      return (
        <TableMenu
          id={String(userId)}
          invalidateKey={QUERY_KEY_ENUM.ADMINS}
          deleteEndpoint="/users"
        />
      );
    },
  },
];
