"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn, sanitizeText } from "@/lib/utils";
import { toast } from "sonner";
import type { CreateInterviewSessionPayload } from "@/types/schedule";
import type { Batch } from "@/types/batch";
import type { Committee } from "@/types/committee";
import type { Faculty } from "@/types/faculty";

// Constants
const TIME_OPTIONS = Array.from({ length: 23 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? "00" : "30";
  return h < 20 ? `${h.toString().padStart(2, "0")}:${m}` : null;
}).filter(Boolean) as string[];

const requiredString = z.string().min(1, "This field is required");

const formSchema = z
  .object({
    roomName: z
      .string()
      .min(3, "Room name must be at least 3 characters")
      .max(100, "Room name must be at most 100 characters")
      .transform((val) => sanitizeText(val)),
    selectedDate: z.date({
      message: "A date is required.",
    }),
    selectedBatch: requiredString,
    selectedFacultyId: requiredString,
    startTime: requiredString,
    endTime: requiredString,
    breakStartTime: z.string().optional(),
    breakEndTime: z.string().optional(),
    selectedCommittee: z
      .array(z.string())
      .min(1, "At least one member is required"),
  })
  .superRefine((data, ctx) => {
    // Validate end time is after start time
    if (data.endTime <= data.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End time must be after start time",
        path: ["endTime"],
      });
    }

    // Validate break times if both are provided
    if (data.breakStartTime && data.breakEndTime) {
      if (data.breakEndTime <= data.breakStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Break end time must be after break start time",
          path: ["breakEndTime"],
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface CreateInterviewFormProps {
  readonly onScheduleCreated: (payload: CreateInterviewSessionPayload) => void;
  readonly availableBatches: Batch[];
  readonly availableCommittees: Committee[];
  readonly availableFaculties: Faculty[];
}

export function CreateInterviewForm({
  onScheduleCreated,
  availableBatches,
  availableCommittees,
  availableFaculties,
}: Readonly<CreateInterviewFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomName: "",
      selectedDate: undefined,
      selectedBatch: "",
      selectedFacultyId: "",
      startTime: "",
      endTime: "",
      breakStartTime: "",
      breakEndTime: "",
      selectedCommittee: [],
    },
  });

  const watch = form.watch;
  const control = form.control;
  const startTime = watch("startTime");
  const endTime = watch("endTime");
  const breakStartTime = watch("breakStartTime");
  const breakEndTime = watch("breakEndTime");
  const selectedCommittee = watch("selectedCommittee");

  const [committeeSearchQuery, setCommitteeSearchQuery] = useState("");
  const [isCommitteeOpen, setIsCommitteeOpen] = useState(false);

  const availableSlots = useMemo(() => {
    if (!startTime || !endTime) return 0;

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);
    let duration = endMinutes - startMinutes;

    if (breakStartTime && breakEndTime) {
      const breakStartMinutes = toMinutes(breakStartTime);
      const breakEndMinutes = toMinutes(breakEndTime);
      const breakDuration = breakEndMinutes - breakStartMinutes;
      if (breakDuration > 0) {
        duration -= breakDuration;
      }
    }

    return Math.max(0, Math.floor(duration / 15));
  }, [startTime, endTime, breakStartTime, breakEndTime]);

  const filteredCommittee = useMemo(() => {
    return availableCommittees.filter((committee) =>
      committee.name.toLowerCase().includes(committeeSearchQuery.toLowerCase()),
    );
  }, [availableCommittees, committeeSearchQuery]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const {
        selectedDate,
        roomName,
        startTime,
        endTime,
        selectedCommittee,
        selectedBatch,
        selectedFacultyId,
        breakStartTime,
        breakEndTime,
      } = values;

      const committeeIds = selectedCommittee;

      if (committeeIds.length === 0) {
        toast.error("No valid committee members selected");
        setIsSubmitting(false);
        return;
      }

      const startDateTime = new Date(selectedDate);
      const [startHour, startMin] = startTime.split(":").map(Number);
      startDateTime.setHours(startHour, startMin, 0, 0);

      const endDateTime = new Date(selectedDate);
      const [endHour, endMin] = endTime.split(":").map(Number);
      endDateTime.setHours(endHour, endMin, 0, 0);

      let breakStartISO: string | null = null;
      let breakEndISO: string | null = null;
      if (breakStartTime && breakEndTime) {
        const breakStartDateTime = new Date(selectedDate);
        const [bStartHour, bStartMin] = breakStartTime.split(":").map(Number);
        breakStartDateTime.setHours(bStartHour, bStartMin, 0, 0);

        const breakEndDateTime = new Date(selectedDate);
        const [bEndHour, bEndMin] = breakEndTime.split(":").map(Number);
        breakEndDateTime.setHours(bEndHour, bEndMin, 0, 0);

        breakStartISO = breakStartDateTime.toISOString();
        breakEndISO = breakEndDateTime.toISOString();
      }

      const apiPayload: CreateInterviewSessionPayload = {
        batchId: Number.parseInt(selectedBatch, 10),
        sessionName: roomName,
        location: roomName,
        subjectId: 3, // Interview Subject ID
        facultyId: selectedFacultyId
          ? Number.parseInt(selectedFacultyId, 10)
          : null,
        examDate: selectedDate.toISOString(),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        breakStart: breakStartISO,
        breakEnd: breakEndISO,
        committeeIds: committeeIds,
      };

      onScheduleCreated(apiPayload);
      form.reset();
    } catch (error) {
      console.error("❌ Failed to create interview:", error);
      toast.error("Failed to create interview schedule. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="xl:col-span-3 min-w-0">
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Interview Schedule
          </h2>
          <p className="text-sm text-gray-600">
            Schedule interviews for qualified students
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={control}
                name="roomName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Room 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="selectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={control}
                name="selectedBatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={availableBatches.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              availableBatches.length === 0
                                ? "Loading..."
                                : "Choose a batch"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableBatches.length === 0 ? (
                          <SelectItem value="no-batches-available" disabled>
                            No batches available
                          </SelectItem>
                        ) : (
                          availableBatches
                            .filter((b) => b.id && String(b.id).trim() !== "")
                            .map((b) => (
                              <SelectItem
                                key={`${b.id}-${b.batchName}`}
                                value={String(b.id)}
                              >
                                {b.batchName}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="selectedFacultyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Focus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Faculty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableFaculties
                          .filter((f) => f.id && String(f.id).trim() !== "")
                          .map((f) => (
                            <SelectItem key={f.id} value={String(f.id)}>
                              {f.facultyName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Start" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="End" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>
                  Break Time{" "}
                  <span className="text-xs text-gray-500">(Optional)</span>
                </FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={control}
                    name="breakStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Break Start" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="breakEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!breakStartTime}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Break End" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TIME_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                {breakStartTime && breakEndTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Break: {breakStartTime} - {breakEndTime}
                  </p>
                )}
              </div>
            </div>

            <FormField
              control={control}
              name="selectedCommittee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Committee</FormLabel>
                  <Popover
                    open={isCommitteeOpen}
                    onOpenChange={setIsCommitteeOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          disabled={availableCommittees.length === 0}
                        >
                          {availableCommittees.length === 0 ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : selectedCommittee.length > 0 ? (
                            `${selectedCommittee.length} selected`
                          ) : (
                            "Select members"
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <div className="p-3 border-b">
                        <Input
                          placeholder="Search..."
                          value={committeeSearchQuery}
                          onChange={(e) =>
                            setCommitteeSearchQuery(e.target.value)
                          }
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-2">
                        {filteredCommittee.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => {
                              const newValue = field.value.includes(m.id)
                                ? field.value.filter((i) => i !== m.id)
                                : [...field.value, m.id];
                              field.onChange(newValue);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(m.id)}
                              readOnly
                              className="cursor-pointer"
                            />
                            <span className="text-sm">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedCommittee.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedCommittee.map((committeeId) => (
                        <Badge
                          key={committeeId}
                          variant="secondary"
                          className="pl-2 pr-1"
                        >
                          {availableCommittees.find((c) => c.id === committeeId)
                            ?.name || committeeId}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={() => {
                              const newValue = field.value.filter(
                                (i) => i !== committeeId,
                              );
                              field.onChange(newValue);
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {Boolean(form.getValues("selectedBatch") || startTime) && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-blue-700 font-bold">
                    {availableSlots}
                    <span className="text-xs font-normal block">Slots</span>
                  </div>
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 font-bold">
                    TBD
                    <span className="text-xs font-normal block">Students</span>
                  </div>
                  <div className="p-2 bg-purple-50 border border-purple-200 rounded text-purple-700 font-bold">
                    {((availableSlots * 15) / 60).toFixed(1)}h
                    <span className="text-xs font-normal block">Duration</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm text-gray-600 text-center">
                    Student assignments will be available after schedule
                    creation
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0F386C] hover:bg-[#334155] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Schedule
                </>
              )}
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  );
}
