"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useRole } from "@/lib/context/auth-context";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface ExportStudentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportStudent({ open, onOpenChange }: ExportStudentProps) {
  const { isAdmin } = useRole();

  const [status, setStatus] = React.useState("");
  const [isDownloading, setIsDownloading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setStatus("");
    }
  }, [open]);

  const handleExport = async () => {
    if (!isAdmin) {
      toast.error("Unauthorized: only admin can export CSV.");
      return;
    }

    if (!status) {
      toast.error("Please select a status.");
      return;
    }

    try {
      setIsDownloading(true);

      const response = await apiClient.get(API_ENDPOINTS.EXPORT_CSV, {
        params: { status }, // ✅ query param
        responseType: "blob", // ✅ required for file download
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `applications_${status}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("CSV exported successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <ScrollArea className="max-h-[80vh] p-6">
          <DialogHeader>
            <DialogTitle>Export Application Data</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Select a status to export application data as CSV.
            </p>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="assessment_scheduled">
                  Assessment Scheduled
                </SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleExport}
              disabled={isDownloading}
              className="w-full bg-primary text-white"
            >
              {isDownloading ? "Downloading..." : "Export CSV"}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
