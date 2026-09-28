"use client";

import { useRef } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  maxFiles?: number;
  maxSizeMB?: number;
  accept?: string;
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
  hint?: string;
  label?: string;
}

export default function FileUpload({
  maxFiles = 5,
  maxSizeMB = 10,
  accept = ".pdf,.jpg,.jpeg,.png",
  files,
  onChange,
  error,
  hint,
  label,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter((f) => f.size <= maxBytes);
    const merged = [...files, ...valid].slice(0, maxFiles);
    onChange(merged);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const valid = dropped.filter((f) => f.size <= maxBytes);
    const merged = [...files, ...valid].slice(0, maxFiles);
    onChange(merged);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const isImage = (file: File) => {
    const mime = file.type || "";
    if (mime.startsWith("image/")) return true;
    return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name);
  };

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div
        onClick={() => files.length < maxFiles && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200",
          files.length >= maxFiles
            ? "cursor-not-allowed opacity-60"
            : "hover:border-primary hover:bg-primary/5",
          error
            ? "border-destructive bg-destructive/5"
            : "border-border/80 bg-muted/20 hover:border-primary/60",
        )}
      >
        <Upload className="mb-3 size-9 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">
          Click to upload or drag & drop
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {hint ??
            `Up to ${maxFiles} file${maxFiles > 1 ? "s" : ""}. PDF or image. Max ${maxSizeMB} MB.`}
        </p>
        {files.length < maxFiles && (
          <Button
            type="button"
            size="sm"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Add file
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 shadow-xs"
            >
              {isImage(file) ? (
                <ImageIcon className="size-4 shrink-0 text-blue-500" />
              ) : (
                <FileText className="size-4 shrink-0 text-red-500" />
              )}
              <span className="flex-1 truncate text-sm text-foreground">
                {file.name}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-muted-foreground transition-colors hover:text-destructive cursor-pointer"
                aria-label="Remove file"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}
