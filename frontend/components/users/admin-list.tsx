"use client";

import React from "react";
import { DataTable } from "@/components/tables/data-table/data-table";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminColumns } from "../tables/data-table/admin-column";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY_ENUM } from "@/constants/query-key-enum";

const ROLE = "admin";

export default function AdminClient({
  statusFilter = "all",
}: {
  statusFilter?: "all" | "active" | "inactive";
}) {
  const { data: items = [], isLoading, error } = useQuery<Admin[]>({
    queryKey: [QUERY_KEY_ENUM.ADMINS],
    queryFn: async () => {
      const res = await apiClient.get(`${API_ENDPOINTS.USER}/${ROLE}`);
      const data = res.data?.data ?? res.data ?? [];
      return Array.isArray(data) ? data : [];
    },
  });

  if (isLoading) {
    const cols = AdminColumns.length || 6;
    const rows = 6;
    return (
      <div className="overflow-hidden rounded-md border">
        <div className="p-4 space-y-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-2 items-center">
              {Array.from({ length: cols }).map((__, j) => (
                <div key={j} className="flex-1">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error: {error instanceof Error ? error.message : "Failed to fetch"}
      </div>
    );
  }

  const displayed = items.filter((it) => {
    if (statusFilter === "all") return true;
    const rawActive = (it as Admin).isActive;
    const rawStatus = (it as Admin).status;
    const isActive =
      typeof rawActive === "boolean"
        ? rawActive
        : String(rawStatus || "").toLowerCase() === "active";
    return statusFilter === "active" ? isActive : !isActive;
  });

  return <DataTable columns={AdminColumns} data={displayed} />;
}
