"use client";

import { useContext, useEffect } from "react";
import { ExamFlowContext } from "@/components/schedule/exam/flow/ExamFlowProvider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import CustomSelectApi from "@/components/common/custom-select-api";
import { QUERY_KEY_ENUM } from "@/constants/query-key-enum";
import { API_ENDPOINTS } from "@/api/endpoint";

interface BatchFormValues {
  id: string;
}

const BatchSelectionStep = () => {
  const examFlowContext = useContext(ExamFlowContext);

  if (!examFlowContext) {
    throw new Error(
      "BatchSelectionStep must be used within an ExamFlowProvider",
    );
  }

  const { selectedBatch, setSelectedBatch, selectedDate, setSelectedDate } =
    examFlowContext;

  const form = useForm<BatchFormValues>({
    defaultValues: {
      id: "",
    },
  });

  const { control, setValue } = form;

  // Sync form state with context when selectedBatch changes
  useEffect(() => {
    setValue("id", selectedBatch || "");
  }, [selectedBatch, setValue]);

  return (
    <Form {...form}>
      <div className="space-y-4">
        <CustomSelectApi
          apiConfig={{
            queryKey: QUERY_KEY_ENUM.BATCHES,
            pathUrl: API_ENDPOINTS.LIST_BATCH,
            dataKey: "batches", // For ApiResponse<Batch[]> structure
          }}
          control={control}
          name="id"
          label="Batch"
          labelKey="batchName"
          placeholder="Select Batch"
          required
          onChange={(selectedItem) => {
            console.log("🎯 Batch selected:", selectedItem);
            if (selectedItem) {
              setSelectedBatch(selectedItem.id);
            }
          }}
        />

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Select Exam Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </Form>
  );
};

export default BatchSelectionStep;
