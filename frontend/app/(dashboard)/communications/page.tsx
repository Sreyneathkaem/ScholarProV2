"use client";

import React, { Suspense, useState, useEffect } from "react";
import { toast } from "sonner";
import { useHeader } from "@/components/header/header-context";
import { emailService, type Batch } from "@/api/service/email.service";
import { LocalApplicant } from "@/types/email.d";
import { FilterPanel } from "@/components/communications/FilterPanel";
import { RecipientList } from "@/components/communications/RecipientList";
import { EmailComposer } from "@/components/communications/EmailComposer";
import { SendPreviewDialog } from "@/components/communications/SendPreviewDialog";
import axios from "axios";
import { EMAIL_VARIABLES } from "@/constants/email-variables";
import { getApiErrorMessage } from "@/lib/utils/api-error";

function CommunicationsPageContent() {
  const { setTitle } = useHeader();
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  // Recipient group removed; rely on explicit filters only
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedScholarshipPercentage, setSelectedScholarshipPercentage] =
    useState<string | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isBatchesLoading, setIsBatchesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [applicants, setApplicants] = useState<LocalApplicant[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<number[]>(
    [],
  );
  const [recipientSearchTerm, setRecipientSearchTerm] = useState("");
  const [manualEmails, setManualEmails] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Bypasses the email_sents queue and the 1-minute cron, so the SES verdict
  // (including the real rejection reason) comes back in about a second.
  const handleSendTest = async () => {
    const target = manualEmails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean)[0];

    if (!target) {
      toast.error("Enter an email address to test with.");
      return;
    }

    try {
      setIsSendingTest(true);
      const result = await emailService.sendTestEmail(target);

      if (result.success) {
        toast.success(
          `SES accepted the test message for ${target}. Message ID: ${result.messageId ?? "n/a"}`,
        );
      } else {
        console.error("[test-send] SES rejected the message", result);
        toast.error(`SES rejected the test message: ${result.message}`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to run the email test."));
    } finally {
      setIsSendingTest(false);
    }
  };

  // Recipient group mapping removed; using explicit filters only

  // Set page title
  useEffect(() => {
    setTitle("Send Email");
  }, [setTitle]);

  // Search recipients based on filters
  const handleSearchRecipients = async (
    overrideBatchId?: string,
    overrideStatus?: string,
    overrideScholarship?: string | null,
    overrideMajor?: string,
    overrideSearchTerm?: string,
  ) => {
    const batchIdToUse =
      overrideBatchId !== undefined ? overrideBatchId : selectedBatchId;
    const statusToUse =
      overrideStatus !== undefined ? overrideStatus : selectedStatus;
    const scholarshipToUse =
      overrideScholarship !== undefined
        ? overrideScholarship
        : selectedScholarshipPercentage;
    const majorToUse =
      overrideMajor !== undefined ? overrideMajor : selectedMajor;
    const searchTermToUse =
      overrideSearchTerm !== undefined
        ? overrideSearchTerm
        : recipientSearchTerm;

    if (!batchIdToUse && !searchTermToUse.trim()) {
      toast.error("Select a batch or search for a registered applicant");
      return;
    }
    const batchNum = batchIdToUse ? parseInt(batchIdToUse, 10) : undefined;
    if (batchNum !== undefined && (Number.isNaN(batchNum) || batchNum <= 0)) {
      toast.error("Invalid batch selected");
      return;
    }

    try {
      setIsLoadingApplicants(true);
      setSearchError("");

      // Use explicit Status + Scholarship filters from UI
      const status = (statusToUse || "").trim();
      const scholarshipPercentage =
        scholarshipToUse !== null && scholarshipToUse !== undefined
          ? scholarshipToUse
          : undefined;

      const recipientsResponse = await emailService.listRecipients(
        batchNum,
        status || undefined,
        scholarshipPercentage || undefined,
        majorToUse || undefined,
        searchTermToUse,
      );

      if (recipientsResponse.success && recipientsResponse.data) {
        const mappedApplicants = recipientsResponse.data
          .map((recipient, index) => {
            const rawId =
              recipient.id || recipient.applicationId || recipient.applicantId;
            const numericId = Number(rawId);

            const emailStr = String(recipient.email || "");
            const fallbackId = emailStr
              ? Math.abs(
                  emailStr
                    .split("")
                    .reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0),
                )
              : Date.now() + index;

            const finalId =
              !isNaN(numericId) && numericId > 0 ? numericId : fallbackId;

            const appName =
              recipient.applicantName?.trim() ||
              recipient.applicationName?.trim();
            const nameEn = recipient.nameEn?.trim();
            const name = recipient.name?.trim();
            const displayName = appName || nameEn || name || "Unknown";

            return {
              id: finalId,
              nameEn: displayName,
              email: recipient.email,
              status: recipient.status || "unknown",
              batchId: recipient.batchId?.toString(),
              batchName: recipient.batchName,
              scholarshipPercentage: recipient.scholarshipPercentage,
              major: recipient.major,
              gender: recipient.gender,
            } as LocalApplicant;
          })
          .filter((applicant) => !!applicant.email);

        setApplicants(mappedApplicants);
        setSelectedRecipientIds([]);
        setHasSearched(true);

        if (mappedApplicants.length === 0) {
          toast.info("No recipients found matching the selected filters");
        } else {
          toast.success(
            `Found ${mappedApplicants.length} recipient${mappedApplicants.length > 1 ? "s" : ""}`,
          );
        }
      }
    } catch (error: unknown) {
      console.error("Error searching recipients:", error);
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status: number; data?: { message?: string } };
        };
        if (axiosError.response?.status === 404) {
          setSearchError(
            "Recipients endpoint not found. Please contact support.",
          );
        } else if (axiosError.response?.status === 400) {
          setSearchError(
            axiosError.response.data?.message || "Invalid search parameters",
          );
        } else {
          setSearchError("Failed to load recipients. Please try again.");
        }
      } else {
        setSearchError("Network error. Please check your connection.");
      }
      setApplicants([]);
      setHasSearched(true);
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  // Load batches on mount
  useEffect(() => {
    const loadBatches = async () => {
      try {
        setIsBatchesLoading(true);
        const batches = await emailService.listBatches();
        setBatches(batches);
      } catch (error) {
        console.error("Error loading batches:", error);
        toast.error("Failed to load batches");
      } finally {
        setIsBatchesLoading(false);
      }
    };

    loadBatches();
  }, []);

  // Load template names on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const names = await emailService.listTemplates();
        setTemplateNames(names);
      } catch (error) {
        console.error("Error loading templates:", error);
        toast.error("Failed to load templates");
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, []);

  // The applicants list is the current search result
  const filteredApplicants = applicants;
  const selectedApplicants = filteredApplicants.filter((applicant) =>
    selectedRecipientIds.includes(Number(applicant.id)),
  );
  const hasApplicantSearchResults =
    hasSearched &&
    Boolean(recipientSearchTerm.trim()) &&
    filteredApplicants.length > 0;
  const useApplicantRecipients =
    selectedRecipientIds.length > 0 || hasApplicantSearchResults;
  const previewRecipients = useApplicantRecipients
    ? selectedRecipientIds.length > 0
      ? selectedApplicants
      : filteredApplicants
    : manualEmails.trim()
      ? manualEmails
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean)
          .map((email, index) => ({
            id: -(index + 1),
            nameEn: email.split("@")[0],
            email,
            status: "manual",
          }))
      : selectedRecipientIds.length > 0
        ? selectedApplicants
        : filteredApplicants;

  // Validate template variables
  const validateTemplateVariables = (htmlContent: string) => {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const matches = htmlContent.matchAll(variableRegex);
    const usedVariables = Array.from(matches, (m) => m[1]);
    const availableVariables = EMAIL_VARIABLES.map((v) => v.key);
    const unavailableVariables = usedVariables.filter(
      (v) => !availableVariables.includes(v),
    );

    if (unavailableVariables.length > 0) {
      const uniqueUnavailable = [...new Set(unavailableVariables)];
      toast.warning(
        `Template uses unavailable variables: ${uniqueUnavailable.join(", ")}`,
        {
          description:
            "These variables may not be replaced correctly when sending emails.",
        },
      );
    }
  };

  // Handle template selection
  const handleTemplateChange = async (templateName: string) => {
    setSelectedTemplateId(templateName);

    try {
      setIsLoadingTemplate(true);
      const template = await emailService.getTemplate(templateName);
      setSubject(template.subject);
      setContent(template.html);

      // Validate variables in template
      validateTemplateVariables(template.html);
    } catch (error) {
      console.error("Error loading template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load template";
      toast.error(errorMessage);
      // Clear content on error
      setSubject("");
      setContent("");
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  // Handle send email button click - show preview dialog
  const handleSendEmailClick = () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }

    if (
      !selectedBatchId &&
      !recipientSearchTerm.trim() &&
      !manualEmails.trim()
    ) {
      toast.error("Please select a batch");
      return;
    }

    const finalRecipients = useApplicantRecipients
      ? selectedRecipientIds.length > 0
        ? selectedApplicants
        : filteredApplicants
      : [];

    if (finalRecipients.length === 0 && !manualEmails.trim()) {
      toast.error("No recipients match the selected filters");
      return;
    }

    const manualEmailList = manualEmails
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);

    if (
      !useApplicantRecipients &&
      manualEmailList.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    ) {
      toast.error("Please enter valid email addresses separated by commas");
      return;
    }

    setShowPreview(true);
  };

  // Handle confirmed send from preview dialog
  const handleConfirmSend = async () => {
    try {
      setIsSending(true);

      const statusToSend =
        selectedStatus && selectedStatus !== "all"
          ? selectedStatus.trim()
          : undefined;
      const scholarshipToSend =
        selectedScholarshipPercentage && selectedScholarshipPercentage !== "all"
          ? selectedScholarshipPercentage.trim()
          : undefined;
      const majorToSend =
        selectedMajor && selectedMajor !== "All Majors"
          ? selectedMajor.trim()
          : undefined;

      const chosenIds = useApplicantRecipients
        ? selectedRecipientIds.length > 0
          ? selectedRecipientIds
          : filteredApplicants.map((applicant) => Number(applicant.id))
        : undefined;
      const chosenEmails = useApplicantRecipients
        ? []
        : manualEmails
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean);

      const result = await emailService.bulkSend(
        selectedTemplateId,
        selectedBatchId ? parseInt(selectedBatchId, 10) : undefined,
        statusToSend,
        scholarshipToSend,
        majorToSend,
        chosenIds,
        chosenEmails.length > 0 ? chosenEmails : undefined,
      );

      setShowPreview(false);
      if (!result.jobId) {
        toast.info(result.message || "Email job queued.");
        return;
      }

      toast.info("Email queued. Checking the sending result...");

      // The queue worker only runs once a minute, so a job queued at t=0 is not
      // picked up until roughly t=60s. The previous 24 x 3s = 72s window only
      // just covered that and reported successes as "still processing"; 40 x 5s
      // gives room for a second cron cycle.
      const maxAttempts = 40;
      const pollIntervalMs = 5000;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        try {
          const job = await emailService.getJobStatus(result.jobId);
          if (job.status === "completed") {
            if (job.failedCount > 0) {
              const reasons = (job.failures ?? [])
                .map((f) => f.errorMessage)
                .filter((m): m is string => Boolean(m));
              toast.error(
                reasons.length > 0
                  ? `SES failed to accept ${job.failedCount} of ${job.totalCount} email(s). First error: ${reasons[0]}`
                  : `SES failed to accept ${job.failedCount} of ${job.totalCount} email(s).`,
                { duration: 15000 },
              );
            } else {
              toast.success(
                `SES accepted ${job.sentCount} email(s). Check the recipient inbox and spam folder for delivery.`,
              );
            }
            return;
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 304) {
            await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
            continue;
          }
          toast.warning(
            "The email is queued, but its sending status could not be checked.",
          );
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }

      toast.warning(
        `The email is still queued or processing after ${Math.round(
          (maxAttempts * pollIntervalMs) / 1000,
        )}s. The worker runs once a minute - check the Applicants tab or retry shortly.`,
        { duration: 15000 },
      );
    } catch (error: unknown) {
      console.error("Error sending email:", error);
      let errorMessage = "Failed to send email";
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  // Handler functions for child components
  const handleBatchChange = (batchName: string, batchId: string) => {
    setSelectedBatch(batchName);
    setSelectedBatchId(batchId);
    setSelectedRecipientIds([]);
    setManualEmails("");
    setSearchError("");
    if (batchId) {
      handleSearchRecipients(
        batchId,
        selectedStatus,
        selectedScholarshipPercentage,
        selectedMajor,
      );
    } else {
      setApplicants([]);
      setHasSearched(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    if (selectedBatchId) {
      handleSearchRecipients(
        selectedBatchId,
        status,
        selectedScholarshipPercentage,
        selectedMajor,
      );
    }
  };

  const handleScholarshipChange = (percentage: string | null) => {
    setSelectedScholarshipPercentage(percentage);
    if (selectedBatchId) {
      handleSearchRecipients(
        selectedBatchId,
        selectedStatus,
        percentage,
        selectedMajor,
      );
    }
  };

  const handleMajorChange = (major: string) => {
    setSelectedMajor(major);
    if (selectedBatchId) {
      handleSearchRecipients(
        selectedBatchId,
        selectedStatus,
        selectedScholarshipPercentage,
        major,
      );
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <FilterPanel
        selectedBatch={selectedBatch}
        selectedBatchId={selectedBatchId}
        selectedMajor={selectedMajor}
        selectedStatus={selectedStatus}
        selectedScholarshipPercentage={selectedScholarshipPercentage}
        hasSearchTerm={Boolean(recipientSearchTerm.trim())}
        batches={batches}
        isBatchesLoading={isBatchesLoading}
        isSearching={isLoadingApplicants}
        onBatchChange={handleBatchChange}
        onMajorChange={handleMajorChange}
        onStatusChange={handleStatusChange}
        onScholarshipChange={handleScholarshipChange}
        onSearchClick={() => handleSearchRecipients()}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <RecipientList
            applicants={filteredApplicants}
            isLoadingApplicants={isLoadingApplicants}
            selectedBatch={selectedBatch}
            hasSearched={hasSearched}
            searchError={searchError}
            selectedRecipientIds={selectedRecipientIds}
            onToggleRecipient={(id) => {
              setSelectedRecipientIds((current) =>
                current.includes(id)
                  ? current.filter((item) => item !== id)
                  : [...current, id],
              );
            }}
            searchTerm={recipientSearchTerm}
            onSearchTermChange={(value) => {
              setRecipientSearchTerm(value);
              setApplicants([]);
              setSelectedRecipientIds([]);
              setHasSearched(false);
            }}
            manualEmails={manualEmails}
            onManualEmailsChange={setManualEmails}
            onSendTest={handleSendTest}
            isSendingTest={isSendingTest}
          />
        </div>

        <div className="lg:col-span-1">
          <EmailComposer
            selectedTemplateId={selectedTemplateId}
            templateNames={templateNames}
            subject={subject}
            content={content}
            isLoadingTemplates={isLoadingTemplates}
            isLoadingTemplate={isLoadingTemplate}
            isSending={isSending}
            recipientCount={filteredApplicants.length}
            canSend={
              (filteredApplicants.length > 0 || Boolean(manualEmails.trim())) &&
              !!selectedTemplateId &&
              (!!selectedBatchId ||
                !!recipientSearchTerm.trim() ||
                !!manualEmails.trim())
            }
            onTemplateChange={handleTemplateChange}
            onSendEmail={handleSendEmailClick}
          />
        </div>
      </div>

      <SendPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        templateName={selectedTemplateId}
        subject={subject}
        recipients={previewRecipients}
        totalCount={previewRecipients.length}
        onConfirm={handleConfirmSend}
        isSending={isSending}
      />
    </div>
  );
}

export default function CommunicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <CommunicationsPageContent />
    </Suspense>
  );
}
