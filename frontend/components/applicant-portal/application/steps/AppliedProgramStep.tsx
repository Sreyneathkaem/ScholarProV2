"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import FileUpload from "../FileUpload";
import {
  appliedProgramSchema,
  type AppliedProgramValues,
} from "@/lib/schema/application-schema";
import type { AppliedProgramData } from "@/types/application";
import {
  SectionHeader,
  RequiredMark,
  StepNavigation,
} from "./PersonalInfoStep";

const MAJORS = [
  "Robotics and Automation Engineering",
  "Data Science and Artificial Intelligence",
  "Software Engineering",
  "Cyber Security",
  "Architecture",
  "Interior Design",
  "Educational Technology",
  "Media and Communication Technology",
  "Business Intelligence",
];

const HOW_DID_YOU_KNOW = [
  "TV advertisement",
  "Radio advertisement",
  "Newspapers / Social Media News",
  "CamTech Website",
  "CamTech Youtube channel",
  "CamTech Tik Tok",
  "CamTech Facebook page",
  "Friend / relatives",
  "School / workplace connection with CamTech",
  "Participation in CamTech event(s)",
  "Other social events",
  "Other",
];

const ACADEMIC_TERMS = ["01 December 2025", "01 March 2026", "01 June 2026"];

interface AppliedProgramStepProps {
  defaultValues: AppliedProgramData;
  onNext: (data: AppliedProgramData) => void;
  onBack: () => void;
  onDraftChange?: (data: AppliedProgramData) => void;
}

export default function AppliedProgramStep({
  defaultValues,
  onNext,
  onBack,
  onDraftChange,
}: AppliedProgramStepProps) {
  const [paymentProof, setPaymentProof] = useState<File[]>(
    defaultValues.paymentProof,
  );
  const [paymentError, setPaymentError] = useState("");

  const form = useForm<AppliedProgramValues>({
    resolver: zodResolver(appliedProgramSchema),
    defaultValues: {
      interestedMajors: defaultValues.interestedMajors,
      applyingForScholarship: defaultValues.applyingForScholarship,
      requestedAcademicTerm: defaultValues.requestedAcademicTerm,
      considerNextIntake: defaultValues.considerNextIntake,
      howDidYouKnow: defaultValues.howDidYouKnow,
      dataConsent: defaultValues.dataConsent,
      declaration: defaultValues.declaration,
    },
  });

  // Automatically sync filled fields in real-time
  useEffect(() => {
    const subscription = form.watch((values) => {
      onDraftChange?.({
        interestedMajors: values.interestedMajors || [],
        applyingForScholarship: values.applyingForScholarship || "",
        requestedAcademicTerm: values.requestedAcademicTerm || "",
        considerNextIntake: values.considerNextIntake || "",
        howDidYouKnow: values.howDidYouKnow || [],
        dataConsent: values.dataConsent || "",
        declaration: values.declaration || false,
        paymentProof,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, paymentProof, onDraftChange]);

  const onValidSubmit = (values: AppliedProgramValues) => {
    if (paymentProof.length === 0) {
      setPaymentError("Please upload your payment proof");
      return;
    }

    setPaymentError("");
    onNext({ ...values, paymentProof });
  };

  const onInvalidSubmit = () => {
    if (paymentProof.length === 0) {
      setPaymentError("Please upload your payment proof");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onValidSubmit, onInvalidSubmit)}
        className="space-y-0"
      >
        <SectionHeader
          title="Section 4: Applied Program"
          subtitle="Choose your interested major and preferences"
        />

        <div className="p-6 space-y-5">
          {/* Interested Majors */}
          <FormField
            control={form.control}
            name="interestedMajors"
            render={() => (
              <FormItem>
                <FormLabel>
                  Choose your interested major <RequiredMark />
                </FormLabel>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {MAJORS.map((major) => (
                    <Controller
                      key={major}
                      control={form.control}
                      name="interestedMajors"
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <Checkbox
                            checked={field.value.includes(major)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, major]);
                              } else {
                                field.onChange(
                                  field.value.filter((v) => v !== major),
                                );
                              }
                            }}
                            id={`major-${major}`}
                          />
                          <span className="text-sm text-foreground">
                            {major}
                          </span>
                        </label>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Scholarship */}
          <FormField
            control={form.control}
            name="applyingForScholarship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Are you applying for a scholarship? <RequiredMark />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="mt-2 flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="scholarship-yes" />
                      <Label
                        htmlFor="scholarship-yes"
                        className="cursor-pointer font-normal text-sm"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="scholarship-no" />
                      <Label
                        htmlFor="scholarship-no"
                        className="cursor-pointer font-normal text-sm"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Requested Academic Term */}
          <FormField
            control={form.control}
            name="requestedAcademicTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Requested Academic Term <RequiredMark />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="mt-2 flex flex-col gap-2"
                  >
                    {ACADEMIC_TERMS.map((term) => (
                      <div key={term} className="flex items-center space-x-2">
                        <RadioGroupItem value={term} id={`term-${term}`} />
                        <Label
                          htmlFor={`term-${term}`}
                          className="cursor-pointer font-normal text-sm"
                        >
                          {term}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Consider Next Intake */}
          <FormField
            control={form.control}
            name="considerNextIntake"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  If you are not successful in this requested entry intake,
                  would you like to be considered for the next intake?{" "}
                  <RequiredMark />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="mt-2 flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="next-intake-yes" />
                      <Label
                        htmlFor="next-intake-yes"
                        className="cursor-pointer font-normal text-sm"
                      >
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="next-intake-no" />
                      <Label
                        htmlFor="next-intake-no"
                        className="cursor-pointer font-normal text-sm"
                      >
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* How did you know CamTech */}
          <FormField
            control={form.control}
            name="howDidYouKnow"
            render={() => (
              <FormItem>
                <FormLabel>
                  How did you know about CamTech? <RequiredMark />
                </FormLabel>
                <div className="mt-3 space-y-2">
                  {HOW_DID_YOU_KNOW.map((source) => (
                    <Controller
                      key={source}
                      control={form.control}
                      name="howDidYouKnow"
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                          <Checkbox
                            checked={field.value.includes(source)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.onChange([...field.value, source]);
                              } else {
                                field.onChange(
                                  field.value.filter((v) => v !== source),
                                );
                              }
                            }}
                            id={`know-${source}`}
                          />
                          <span className="text-sm text-foreground">
                            {source}
                          </span>
                        </label>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirmation & Data Protection */}
          <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
            <h4 className="font-semibold text-foreground">
              Confirmation &amp; Data Protection
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              CamTech University will use your email to stay in touch and update
              you about admissions, evaluation results, and university events.
            </p>
            <FormField
              control={form.control}
              name="dataConsent"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="consent-yes" />
                        <Label
                          htmlFor="consent-yes"
                          className="cursor-pointer font-normal text-sm"
                        >
                          Yes, I give my consent
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="consent-no" />
                        <Label
                          htmlFor="consent-no"
                          className="cursor-pointer font-normal text-sm"
                        >
                          No, I do not give my consent
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Declaration */}
          <FormField
            control={form.control}
            name="declaration"
            render={({ field }) => (
              <FormItem>
                <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-3">
                  <h4 className="font-semibold text-foreground">Declaration</h4>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    I declare that all information provided is correct and
                    understand that any false, inaccurate, or misleading
                    information will result in the student&apos;s withdrawal
                    from school.
                  </p>
                  <FormControl>
                    <label className="flex cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="declaration-check"
                      />
                      <Label
                        htmlFor="declaration-check"
                        className="cursor-pointer font-medium text-sm text-foreground"
                      >
                        Yes, I agree
                      </Label>
                    </label>
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {/* Application Fee */}
          <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 space-y-4">
            <h4 className="font-bold text-primary dark:text-blue-400 text-base">
              Application Fee $10
            </h4>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="space-y-1.5 flex-1">
                <p className="text-sm font-medium text-foreground">
                  Canadia Bank Account QR
                </p>
                <p className="text-sm text-muted-foreground">
                  Bank Account Name:{" "}
                  <span className="font-semibold text-primary dark:text-blue-300">CAMTECH</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Bank Account Number:{" "}
                  <span className="font-semibold text-primary dark:text-blue-300 tracking-wider">
                    001009930401
                  </span>
                </p>
                <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  * The application fee is non-refundable. Your account transfer
                  fee should match the registered name.
                </p>
              </div>
              {/* QR Code container */}
              <div className="shrink-0 flex size-28 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-card p-2">
                <div className="grid grid-cols-4 gap-1 opacity-50">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div
                      key={i}
                      className={`size-4 rounded-xs ${i % 2 === 0 || i === 5 ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border/80 pt-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Payment Verification
              </p>
              <FileUpload
                files={paymentProof}
                onChange={(files) => {
                  setPaymentProof(files);
                  setPaymentError("");
                }}
                maxFiles={1}
                maxSizeMB={10}
                hint="Upload 1 supported file: PDF or image. Max 10 MB."
                error={paymentError}
                label="Upload payment proof receipt (PDF/JPG)"
              />
            </div>
          </div>
        </div>

        <StepNavigation showBack onBack={onBack} />
      </form>
    </Form>
  );
}
