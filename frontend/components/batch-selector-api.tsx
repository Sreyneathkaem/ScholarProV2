"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";

interface BatchSelectorApiProps {
  value: string;
  onValueChange: (value: string) => void;
  includeAll?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  showBatchCount?: boolean;
}

export function BatchSelectorApi({
  value,
  onValueChange,
  includeAll = false,
  placeholder = "Select Batch",
  label = "Batch",
  className = "",
  disabled = false,
  required = false,
  showBatchCount = false,
}: BatchSelectorApiProps) {
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(API_ENDPOINTS.LIST_BATCH as string);
        // Support several shapes: { data: { batches: [] } }, { batches: [] }, or plain array
        const payload =
          res?.data?.data?.batches ?? res?.data?.batches ?? res?.data ?? [];
        const items: unknown[] = Array.isArray(payload) ? payload : [];

        const isRecord = (v: unknown): v is Record<string, unknown> =>
          typeof v === "object" && v !== null;

        const mapped = items.map((item) => {
          if (!isRecord(item)) {
            return { id: "", label: "Unnamed Batch" };
          }

          const rawId = item.id ?? item.batchId ?? item.batchName ?? "";
          const rawLabel =
            item.batchName ?? item.batch ?? item.id ?? "Unnamed Batch";

          return { id: String(rawId), label: String(rawLabel) };
        });

        const validOptions = mapped.filter((o) => o.id.trim() !== "");

        if (mounted) setOptions(validOptions);
      } catch (err) {
        console.error("Failed to load batches", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const batchCount = options.length;

  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium text-foreground/80 mb-1 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
          {showBatchCount && (
            <span className="text-muted-foreground font-normal ml-2">
              ({batchCount} available)
            </span>
          )}
        </label>
      )}

      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="all">All Batches</SelectItem>}
          {options.length === 0 ? (
            <SelectItem value="no-batches" disabled>
              {loading ? "Loading..." : "No batches available"}
            </SelectItem>
          ) : (
            options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label}
              </SelectItem>
            ))
          )}
          {/* If a current value is set but not present in the fetched options, render it so the Select displays a label */}
          {value && value !== "all" && !options.find((o) => o.id === value) && (
            <SelectItem key={`selected-${value}`} value={value}>
              {value}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default BatchSelectorApi;
