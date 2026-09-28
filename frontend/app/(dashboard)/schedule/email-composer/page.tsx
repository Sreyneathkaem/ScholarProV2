"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
// Legacy EmailComposer removed; this page now shows a handoff message

function EmailComposerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const batch = searchParams.get("batch") || "Exam";

  const handleBack = () => {
    router.back();
  };

  // Legacy send handler removed

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={handleBack}>
                Schedule
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={handleBack}>
                {batch}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Email Composer</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Composer</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Send emails to {batch} applicants
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Email Composer Component removed. Use Communications page instead. */}
        <div className="border rounded-md p-6 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            The legacy Email Composer has moved. Please use the Communications
            page to send emails to {batch} applicants.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmailComposerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailComposerContent />
    </Suspense>
  );
}
