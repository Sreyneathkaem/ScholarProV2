"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EvaluationSummary } from "@/components/evaluation-summary";
import { EvaluationData } from "@/components/evaluation-form";
import { apiClient } from "@/api/api";
import { API_ENDPOINTS } from "@/api/endpoint";
import { toast } from "sonner";

interface AdminPanelProps {
  setscholarshipStatus: (status: string) => void;

  setScholarshipPercentage: (percentage: string) => void;
  scholarshipStatus: string;
  scholarshipPercentage: string;
  applicantId: string;
  status: string;
  setStatus: (status: string) => void;
  paymentStatus: string;
  setPaymentStatus: (status: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  englishExamStatus: string;
  setEnglishExamStatus: (status: string) => void;
  mathExamStatus: string;
  setMathExamStatus: (status: string) => void;
  onStatusUpdate?: () => void;
  onExamStatusUpdate: () => void;
  onSaveNotes: () => void;
  evaluations?: EvaluationData[];
}

export function AdminPanel({
  applicantId,
  status,
  paymentStatus,
  setPaymentStatus,
  setStatus,

  scholarshipPercentage,

  setScholarshipPercentage,

  englishExamStatus,
  setEnglishExamStatus,
  mathExamStatus,
  setMathExamStatus,
  onExamStatusUpdate,
}: AdminPanelProps) {
  // Fetch applicant details when component mounts or applicantId changes
  useEffect(() => {
    const fetchApplicant = async () => {
      if (!applicantId) return;

      try {
        const res = await apiClient.get(
          `${API_ENDPOINTS.APPLICANT}/${applicantId}`,
        );
        const applicant = res?.data?.data || res?.data;

        if (!applicant) return;

        // Map API fields to component setters (guarding for absent setters)
        if (applicant.applicationStatus || applicant.status) {
          setStatus?.(applicant.applicationStatus ?? applicant.status);
        }

        if (typeof applicant.paymentStatus !== "undefined") {
          setPaymentStatus?.(String(applicant.paymentStatus));
        }

        if (typeof applicant.scholarshipPercentage !== "undefined") {
          setScholarshipPercentage?.(String(applicant.scholarshipPercentage));
        }

        if (typeof applicant.isEnglishTestSkipped !== "undefined") {
          setEnglishExamStatus?.(String(applicant.isEnglishTestSkipped));
        }

        if (typeof applicant.isMathTestSkipped !== "undefined") {
          setMathExamStatus?.(String(applicant.isMathTestSkipped));
        }
      } catch (err) {
        console.error("Failed to fetch applicant details:", err);
      }
    };

    fetchApplicant();
  }, [applicantId]);

  const handleUpdateStatus = async () => {
    try {
      await apiClient.patch(`${API_ENDPOINTS.APPLICANT}/${applicantId}`, {
        status,
      });
      toast.success("Status updated successfully!");
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Failed to update status");
    }
  };

  const handlePaymentStatus = async () => {
    try {
      await apiClient.patch(`${API_ENDPOINTS.APPLICANT}/${applicantId}`, {
        paymentStatus,
      });
      toast.success("Payment status updated successfully!");
    } catch (err) {
      console.error("Failed to update payment status", err);
      toast.error("Failed to update payment status");
    }
  };

  const handleUpdateScholarshipStatus = async () => {
    try {
      const percentageValue = Number(scholarshipPercentage);

      await apiClient.patch(`${API_ENDPOINTS.APPLICANT}/${applicantId}`, {
        scholarshipPercentage: percentageValue,
      });
      toast.success("Scholarship status updated successfully!");
    } catch (err) {
      console.error("Failed to update scholarship status", err);
      toast.error("Failed to update scholarship status");
    }
  };

  const handleExamStatus = async () => {
    try {
      const payload = {
        isMathTestSkipped: mathExamStatus === "true",
        isEnglishTestSkipped: englishExamStatus === "true",
      };

      // PATCH to applicant exam status endpoint
      await apiClient.patch(
        `${API_ENDPOINTS.APPLICANT}/${applicantId}`,
        payload,
      );

      toast.success("Exam status updated successfully!");
      onExamStatusUpdate?.();
    } catch (error) {
      console.error("Failed to update exam status", error);
      toast.error("Failed to update exam status");
    }
  };

  return (
    <>
      {/* Evaluation Summary */}
      {/* {evaluations && evaluations.length > 0 && (
        <EvaluationSummary evaluations={evaluations} compact={false} />
      )} */}

      <div>
        <EvaluationSummary applicationId={applicantId} compact={false} />
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Update Payment Status</h3>

        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={handlePaymentStatus}
          className="w-full mt-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
        >
          Update
        </Button>
      </div>

      {/* Update Status */}

      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Update Status</h3>

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
          onClick={handleUpdateStatus}
          className="w-full mt-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
        >
          Update
        </Button>
      </div>

      {/* Update Scholarship Percentage (show only when status is graded) */}
      {status === "graded" && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold text-lg mb-4">
            Update Scholarship Percentage
          </h3>

          <Select
            value={scholarshipPercentage}
            onValueChange={setScholarshipPercentage}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0%</SelectItem>
              <SelectItem value="25">25%</SelectItem>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleUpdateScholarshipStatus}
            className="w-full mt-4 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
          >
            Update
          </Button>
        </div>
      )}

      {/* Update Exam Status */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Update Exam Status</h3>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">English</label>
          <Select
            value={englishExamStatus}
            onValueChange={setEnglishExamStatus}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Exempt</SelectItem>
              <SelectItem value="false">Require</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Math</label>
          <Select value={mathExamStatus} onValueChange={setMathExamStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Exempt</SelectItem>
              <SelectItem value="false">Require</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleExamStatus}
          className="w-full bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
        >
          Update
        </Button>
      </div>
    </>
  );
}
