"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileUpload from "../FileUpload";
import {
  personalInfoSchema,
  type PersonalInfoValues,
} from "@/lib/schema/application-schema";
import type { PersonalInfoData } from "@/types/application";
import { useProvinces } from "@/hooks/useProvinces";

const COUNTRIES = [
  "Cambodia",
  "Brunei Darussalam",
  "Indonesia",
  "Lao PDR",
  "Malaysia",
  "Myanmar",
  "Philippines",
  "Singapore",
  "China",
  "Canada",
  "Japan",
  "Korea",
  "US",
  "Other",
];

interface PersonalInfoStepProps {
  defaultValues: PersonalInfoData;
  onNext: (data: PersonalInfoData) => void;
  onDraftChange?: (data: PersonalInfoData) => void;
}

export default function PersonalInfoStep({
  defaultValues,
  onNext,
  onDraftChange,
}: PersonalInfoStepProps) {
  const { provinces } = useProvinces();
  const [identityDocument, setIdentityDocument] = useState<File[]>(
    defaultValues.identityDocument,
  );
  const [fileError, setFileError] = useState("");

  const form = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      nameKhmer: defaultValues.nameKhmer,
      nameEnglish: defaultValues.nameEnglish,
      nationality: defaultValues.nationality,
      gender: defaultValues.gender,
      dateOfBirth: defaultValues.dateOfBirth,
      placeOfBirth: defaultValues.placeOfBirth,
      currentAddress: defaultValues.currentAddress,
      country: defaultValues.country,
      phoneNumber: defaultValues.phoneNumber,
      email: defaultValues.email,
    },
  });

  // Automatically sync filled fields in real-time
  useEffect(() => {
    const subscription = form.watch((values) => {
      onDraftChange?.({
        nameKhmer: values.nameKhmer || "",
        nameEnglish: values.nameEnglish || "",
        nationality: values.nationality || "",
        gender: values.gender || "",
        dateOfBirth: values.dateOfBirth || "",
        placeOfBirth: values.placeOfBirth || "",
        currentAddress: values.currentAddress || "",
        country: values.country || "",
        phoneNumber: values.phoneNumber || "",
        email: values.email || "",
        identityDocument,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, identityDocument, onDraftChange]);

  const onValidSubmit = (values: PersonalInfoValues) => {
    if (identityDocument.length === 0) {
      setFileError("Please upload at least one identity document");
      return;
    }

    setFileError("");
    onNext({ ...values, identityDocument });
  };

  // form.handleSubmit runs the zodResolver so the wizard cannot advance with
  // invalid values. The backend enforces the same rules, so skipping this just
  // defers the failure to a raw 400 on the final submit.
  const handleSubmit = form.handleSubmit(onValidSubmit);

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-0">
        <SectionHeader
          title="Section 1: Personal Information"
          subtitle="Please fill in your personal details accurately"
        />

        <div className="px-4 sm:px-8 py-6 space-y-6">
          {/* Names Row */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nameKhmer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Student&apos;s full name in Khmer <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Khmer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nameEnglish"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Student&apos;s full name in English <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter English name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Nationality & Gender */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nationality <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Cambodian" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Gender <RequiredMark />
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* DOB & Place of Birth */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Date of Birth <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="placeOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Place of birth <RequiredMark />
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose your place of birth" />
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
          </div>

          {/* Current Address */}
          <FormField
            control={form.control}
            name="currentAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Current address <RequiredMark />
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose your current address" />
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

          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Country <RequiredMark />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
                  >
                    {COUNTRIES.map((c) => (
                      <div key={c} className="flex items-center space-x-2">
                        <RadioGroupItem value={c} id={`country-${c}`} />
                        <Label
                          htmlFor={`country-${c}`}
                          className="cursor-pointer font-normal text-sm"
                        >
                          {c}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone & Email */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Email <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Identity Document Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Upload one of these: Birth Certificate, National ID Card or
              Passport (PDF/JPG)
            </Label>
            <FileUpload
              files={identityDocument}
              onChange={(files) => {
                setIdentityDocument(files);
                setFileError("");
              }}
              maxFiles={5}
              maxSizeMB={10}
              hint="Upload up to 5 supported files: PDF or image. Max 10 MB per file."
              error={fileError}
            />
          </div>
        </div>

        <StepNavigation showBack={false} />
      </form>
    </Form>
  );
}

// ──────────────────── Shared sub-components ────────────────────

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-t-xl bg-primary px-6 py-5 text-center text-primary-foreground shadow-xs">
      <h2 className="text-base sm:text-lg font-semibold tracking-tight">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-xs sm:text-sm text-primary-foreground/80">{subtitle}</p>
      )}
    </div>
  );
}

export function RequiredMark() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export function StepNavigation({
  showBack,
  onBack,
  submitLabel = "Next",
  isSubmitting = false,
}: {
  showBack: boolean;
  onBack?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-4 sm:px-8 py-4">
      {showBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="px-6"
        >
          Back
        </Button>
      ) : (
        <div />
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="px-8"
      >
        {submitLabel}
      </Button>
    </div>
  );
}
