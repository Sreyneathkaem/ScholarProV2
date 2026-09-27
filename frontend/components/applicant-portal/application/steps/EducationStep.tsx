"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
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
  educationSchema,
  type EducationValues,
} from "@/lib/schema/application-schema";
import type { EducationData } from "@/types/application";
import FileUpload from "../FileUpload";
import {
  SectionHeader,
  RequiredMark,
  StepNavigation,
} from "./PersonalInfoStep";

const GRADES = ["A", "B", "C", "D", "E", "F"];

interface EducationStepProps {
  defaultValues: EducationData;
  onNext: (data: EducationData) => void;
  onBack: () => void;
  onDraftChange?: (data: EducationData) => void;
}

export default function EducationStep({
  defaultValues,
  onNext,
  onBack,
  onDraftChange,
}: EducationStepProps) {
  const { provinces } = useProvinces();
  const [hsCertificate, setHsCertificate] = useState<File[]>(
    defaultValues.hsCertificate,
  );
  const [ieltsDocument, setIeltsDocument] = useState<File[]>(
    defaultValues.ieltsDocument,
  );
  const [grade12IdCard, setGrade12IdCard] = useState<File[]>(
    defaultValues.grade12IdCard,
  );

  const form = useForm<EducationValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      currentEducationLevel: defaultValues.currentEducationLevel || undefined,
      universityCurrentMajor: defaultValues.university.currentMajor,
      universityInstitutionName: defaultValues.university.institutionName,
      universityYearOfStudy: defaultValues.university.yearOfStudy,
      highSchoolAcademicYear: defaultValues.highSchool.academicYear,
      highSchoolName: defaultValues.highSchool.schoolName,
      highSchoolCity: defaultValues.highSchool.cityAndCountry,
      highSchoolOverallGrade: defaultValues.highSchool.overallGrade,
      highSchoolMathGrade: defaultValues.highSchool.mathGrade,
      highSchoolEnglishGrade: defaultValues.highSchool.englishGrade,
      hasIeltsOrToefl: defaultValues.hasIeltsOrToefl,
    },
  });

  const educationLevel = useWatch({
    control: form.control,
    name: "currentEducationLevel",
  });

  // Automatically sync filled fields in real-time
  useEffect(() => {
    const subscription = form.watch((values) => {
      onDraftChange?.({
        currentEducationLevel: values.currentEducationLevel || "",
        university: {
          currentMajor: values.universityCurrentMajor || "",
          institutionName: values.universityInstitutionName || "",
          yearOfStudy: values.universityYearOfStudy || "",
        },
        highSchool: {
          academicYear: values.highSchoolAcademicYear || "",
          schoolName: values.highSchoolName || "",
          cityAndCountry: values.highSchoolCity || "",
          overallGrade: values.highSchoolOverallGrade || "",
          mathGrade: values.highSchoolMathGrade || "",
          englishGrade: values.highSchoolEnglishGrade || "",
        },
        hasIeltsOrToefl: values.hasIeltsOrToefl || "",
        hsCertificate,
        ieltsDocument,
        grade12IdCard,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, hsCertificate, ieltsDocument, grade12IdCard, onDraftChange]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = form.getValues();

    onNext({
      currentEducationLevel: values.currentEducationLevel,
      university: {
        currentMajor: values.universityCurrentMajor,
        institutionName: values.universityInstitutionName,
        yearOfStudy: values.universityYearOfStudy,
      },
      highSchool: {
        academicYear: values.highSchoolAcademicYear,
        schoolName: values.highSchoolName,
        cityAndCountry: values.highSchoolCity,
        overallGrade: values.highSchoolOverallGrade,
        mathGrade: values.highSchoolMathGrade,
        englishGrade: values.highSchoolEnglishGrade,
      },
      hasIeltsOrToefl: values.hasIeltsOrToefl,
      hsCertificate,
      ieltsDocument,
      grade12IdCard,
    });
  };

  const isUniversity = educationLevel === "university";
  const isHighSchoolGraduate = educationLevel === "high_school_graduate";
  const is12thGrader = educationLevel === "current_12th_grader";
  const showEnglishProficiency =
    isUniversity || isHighSchoolGraduate || is12thGrader;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-0">
        <SectionHeader
          title="Section 3: Educational Background"
          subtitle="Complete the following required information:"
        />

        <div className="px-4 sm:px-8 py-6 space-y-8">
          {/* 3.1 General Education */}
          <div className="rounded-lg border-l-4 border-[#1e2d6b] bg-blue-50/50 px-4 py-3">
            <h3 className="font-semibold text-[#1e2d6b]">
              3.1. General Education
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Complete your educational background listing from the current
              school to the previous schools.
            </p>
          </div>

          {/* Education Level */}
          <FormField
            control={form.control}
            name="currentEducationLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  What is your current education? <RequiredMark />
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="mt-2 flex flex-col sm:flex-row gap-4"
                  >
                    {[
                      { value: "university", label: "University" },
                      {
                        value: "high_school_graduate",
                        label: "High School Graduate",
                      },
                      {
                        value: "current_12th_grader",
                        label: "Current 12th Grader",
                      },
                    ].map(({ value, label }) => (
                      <div key={value} className="flex items-center space-x-2">
                        <RadioGroupItem value={value} id={`edu-${value}`} />
                        <Label
                          htmlFor={`edu-${value}`}
                          className="cursor-pointer font-normal text-sm"
                        >
                          {label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* University Block */}
          {isUniversity && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h4 className="font-semibold text-slate-800">
                Current University Information
              </h4>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="universityCurrentMajor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Current Major <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Your answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="universityInstitutionName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Institution Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="universityYearOfStudy"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Current Year of Study</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Year 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* High School Block — full (for University + HS Graduate) */}
          {(isUniversity || isHighSchoolGraduate) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h4 className="font-semibold text-slate-800">
                High School Information
              </h4>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="highSchoolAcademicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Academic Year <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Your answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="highSchoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        School Name <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Your answer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="highSchoolCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province / City of School</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select province / city" />
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
              <GradeField
                control={form.control}
                name="highSchoolOverallGrade"
                label="Overall grade"
                required
              />
              <GradeField
                control={form.control}
                name="highSchoolMathGrade"
                label="Math grade"
                required
              />
              <GradeField
                control={form.control}
                name="highSchoolEnglishGrade"
                label="English grade"
              />
              <FileUpload
                files={hsCertificate}
                onChange={setHsCertificate}
                maxFiles={1}
                maxSizeMB={100}
                accept=".pdf,.jpg,.jpeg"
                label="Upload your high school certificate or any equivalent document (PDF/JPG)"
              />
            </div>
          )}

          {/* 12th Grader Block */}
          {is12thGrader && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-xs">
              <h4 className="font-semibold text-slate-800">12th Grader</h4>
              <FormField
                control={form.control}
                name="highSchoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      High school name <RequiredMark />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Your answer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="highSchoolCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province / City</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select province / city" />
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
              <FormField
                control={form.control}
                name="highSchoolAcademicYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 2025-2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <GradeField
                control={form.control}
                name="highSchoolOverallGrade"
                label="Overall grade"
              />
              <GradeField
                control={form.control}
                name="highSchoolMathGrade"
                label="Math grade"
              />
              <GradeField
                control={form.control}
                name="highSchoolEnglishGrade"
                label="English grade"
              />
              <FileUpload
                files={grade12IdCard}
                onChange={setGrade12IdCard}
                maxFiles={1}
                maxSizeMB={100}
                accept=".pdf,.jpg,.jpeg"
                label="Upload your grade 12 student ID card (PDF/JPG)"
              />
            </div>
          )}

          {/* 3.2 English Language Proficiency — shown for all education levels */}
          {showEnglishProficiency && (
            <>
              <div className="rounded-lg border-l-4 border-[#1e2d6b] bg-blue-50/50 px-4 py-3">
                <h3 className="font-semibold text-[#1e2d6b]">
                  3.2. English Language Proficiency
                </h3>
              </div>

              <FormField
                control={form.control}
                name="hasIeltsOrToefl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Do you have IELTS or TOEFL certificate?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="mt-2 flex flex-col sm:flex-row gap-4"
                      >
                        {["Yes", "No", "Other"].map((opt) => (
                          <div
                            key={opt}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={opt.toLowerCase()}
                              id={`ielts-${opt}`}
                            />
                            <Label
                              htmlFor={`ielts-${opt}`}
                              className="cursor-pointer font-normal text-sm"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FileUpload
                files={ieltsDocument}
                onChange={setIeltsDocument}
                maxFiles={1}
                maxSizeMB={100}
                accept=".pdf,.jpg,.jpeg"
                label="Upload a valid IELTS or TOEFL certificate (PDF/JPG)"
              />
            </>
          )}
        </div>

        <StepNavigation showBack onBack={onBack} />
      </form>
    </Form>
  );
}

// ──────────────────── Grade field helper ────────────────────
import type { Control, FieldPath } from "react-hook-form";

function GradeField({
  control,
  name,
  label,
  required = false,
}: {
  control: Control<EducationValues>;
  name: FieldPath<EducationValues>;
  label: string;
  required?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} {required && <RequiredMark />}
          </FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="mt-1 flex flex-wrap gap-4"
            >
              {GRADES.map((g) => (
                <div key={g} className="flex items-center space-x-2">
                  <RadioGroupItem value={g} id={`${name}-${g}`} />
                  <Label
                    htmlFor={`${name}-${g}`}
                    className="cursor-pointer font-normal text-sm"
                  >
                    {g}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
