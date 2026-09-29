"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BatchOption {
  id: string;
  label: string;
}

interface BatchSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  availableBatches?: BatchOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  showBatchCount?: boolean;
}

const DEFAULT_BATCHES: BatchOption[] = [
  { id: "cs-2025", label: "Computer Science 2025" },
  { id: "eng-2025", label: "Engineering 2025" },
  { id: "ba-2025", label: "Business Administration 2025" },
  { id: "it-2025", label: "Information Technology 2025" },
];

export function BatchSelector({
  value,
  onValueChange,
  availableBatches = DEFAULT_BATCHES,
  placeholder = "Choose a batch",
  label = "Select Batch",
  className = "",
  disabled = false,
  required = false,
  error,
  helperText,
  showBatchCount = false,
}: BatchSelectorProps) {
  const batchCount = availableBatches.length;
  const selectedBatch = availableBatches.find((b) => b.id === value);
  const displayValue = selectedBatch ? selectedBatch.label : placeholder;

  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {showBatchCount && (
            <span className="text-muted-foreground font-normal ml-2">
              ({batchCount} available)
            </span>
          )}
        </label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={`w-full h-11 ${error ? "border-red-300 focus:border-red-300 focus:ring-red-200" : "border-border"} ${value ? "font-medium text-foreground" : "text-muted-foreground"}`}
        >
          <SelectValue placeholder={placeholder}>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableBatches.length === 0 ? (
            <SelectItem value="no-batches-available" disabled>
              No batches available
            </SelectItem>
          ) : (
            availableBatches.map((batch) => (
              <SelectItem key={batch.id} value={batch.id}>
                {batch.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {/* Error message */}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-muted-foreground text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}

export default BatchSelector;
