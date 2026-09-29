"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Upload, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Papa from "papaparse";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import CustomSelectApi from "../common/custom-select-api";
import { QUERY_KEY_ENUM } from "@/constants/query-key-enum";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useRole } from "@/lib/context/auth-context";

interface ImportStudentCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportStudentCSVModal({
  open,
  onOpenChange,
}: ImportStudentCSVModalProps) {
  interface ImportFormValues {
    id?: string;
  }
  const methods = useForm<ImportFormValues>();
  const { control, handleSubmit, reset } = methods;

  const [csvData, setCsvData] = React.useState<Record<string, unknown>[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);

  const { isAdmin } = useRole();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (!open) {
      reset();
      setCsvData([]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, reset]);

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) =>
        setCsvData(results.data as Record<string, unknown>[]),
      error: (err) => console.error("CSV parse error:", err),
    });
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    parseCSV(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setCsvData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: ImportFormValues) => {
    if (!isAdmin) {
      toast.error("Unauthorized: only admin can import CSV.");
      onOpenChange(false);
      return;
    }
    const selectedBatchId = values?.id;

    setIsUploading(true);

    if (!selectedFile) {
      toast.error("Please upload a CSV file.");
      setIsUploading(false);
      return;
    }

    if (!selectedBatchId) {
      toast.error("Please select a batch to import into.");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile as File);
      formData.append("batchId", String(selectedBatchId));

      await apiClient.post(API_ENDPOINTS.IMPORT_CSV, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("CSV imported successfully!");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to import CSV.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <ScrollArea className="max-h-[80vh] p-6">
          <DialogHeader>
            <DialogTitle>Import Students CSV</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Choose a batch and upload CSV to import student data.
            </p>
          </DialogHeader>

          <Form {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
              {/* Batch Selector */}
              <CustomSelectApi
                apiConfig={{
                  queryKey: QUERY_KEY_ENUM.BATCHES,
                  pathUrl: API_ENDPOINTS.LIST_BATCH,
                  dataKey: "batches",
                }}
                control={control}
                name="id"
                label={"Batch"}
                labelKey={"batchName"}
                placeholder={"Select Batch"}
                required
              />

              {/* CSV Upload */}
              <div className="space-y-2">
                <Label>CSV File</Label>

                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-border">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText className="mx-auto h-8 w-8 text-green-600" />
                      <p className="text-sm font-medium text-green-600">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {csvData.length} rows detected
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="mr-2 h-4 w-4" /> Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop or click to upload CSV
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose CSV File
                      </Button>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </div>

              {/* Submit */}
              <Button
                disabled={isUploading}
                type="submit"
                className="w-full bg-primary text-white"
              >
                {isUploading ? "Importing..." : "Import CSV"}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
