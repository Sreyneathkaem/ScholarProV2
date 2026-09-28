"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProvinces } from "@/hooks/useProvinces";
import {
  parentsSchema,
  type ParentsValues,
} from "@/lib/schema/application-schema";
import type { ParentsData } from "@/types/application";
import {
  SectionHeader,
  RequiredMark,
  StepNavigation,
} from "./PersonalInfoStep";

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Sister",
  "Brother",
  "Aunt",
  "Uncle",
  "Grandmother",
  "Grandfather",
  "Other",
];

interface ParentsGuardiansStepProps {
  defaultValues: ParentsData;
  onNext: (data: ParentsData) => void;
  onBack: () => void;
  onDraftChange?: (data: ParentsData) => void;
}

export default function ParentsGuardiansStep({
  defaultValues,
  onNext,
  onBack,
  onDraftChange,
}: ParentsGuardiansStepProps) {
  const { provinces } = useProvinces();
  const form = useForm<ParentsValues>({
    resolver: zodResolver(parentsSchema),
    defaultValues: {
      name: defaultValues.name,
      relationship: defaultValues.relationship,
      nationality: defaultValues.nationality,
      currentAddress: defaultValues.currentAddress,
      jobPosition: defaultValues.jobPosition,
      phoneNumber: defaultValues.phoneNumber,
    },
  });

  // Automatically sync filled fields in real-time
  useEffect(() => {
    const subscription = form.watch((values) => {
      onDraftChange?.({
        name: values.name || "",
        relationship: values.relationship || "",
        nationality: values.nationality || "",
        currentAddress: values.currentAddress || "",
        jobPosition: values.jobPosition || "",
        phoneNumber: values.phoneNumber || "",
      });
    });
    return () => subscription.unsubscribe();
  }, [form, onDraftChange]);

  const onValidSubmit = (values: ParentsValues) => {
    onNext(values);
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValidSubmit)} className="space-y-0">
        <SectionHeader
          title="Section 2: Parents/Guardians Details"
          subtitle="Please fill in the parent or guardian information below"
        />

        <div className="p-6 space-y-5">
          {/* Parent/Guardian Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Parent/Guardian&apos;s name <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter parent/guardian full name"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Relationship */}
          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Relationship to you <RequiredMark />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4"
                  >
                    {RELATIONSHIPS.map((r) => (
                      <div key={r} className="flex items-center space-x-2">
                        <RadioGroupItem value={r} id={`rel-${r}`} />
                        <Label
                          htmlFor={`rel-${r}`}
                          className="cursor-pointer font-normal text-sm"
                        >
                          {r}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Nationality */}
          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Nationality <RequiredMark />
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Cambodian"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Current Address */}
          <FormField
            control={form.control}
            name="currentAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Parent/Guardian Current Address <RequiredMark />
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose current address" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {provinces.map((prov) => (
                      <SelectItem key={prov.id || prov.code || prov.name} value={prov.name}>
                        <span className="flex items-center justify-between gap-3 w-full">
                          <span>{prov.name}</span>
                          {prov.khmer && (
                            <span className="text-xs text-muted-foreground font-normal">
                              {prov.khmer}
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Position & Phone */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="jobPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Job Position <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Business Owner, Teacher" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Phone Number <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="012 345 678" type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <StepNavigation showBack onBack={onBack} />
      </form>
    </Form>
  );
}
