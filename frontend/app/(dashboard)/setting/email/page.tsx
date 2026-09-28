"use client";

import React, { useEffect, Suspense } from "react";
import EmailPresets from "@/components/settings/EmailPresets";
import { useHeader } from "@/components/header/header-context";
import { PageHero } from "@/components/common/page-hero";

function EmailManagementContent() {
  const { setTitle } = useHeader();

  useEffect(() => {
    setTitle("Email Management");
  }, [setTitle]);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Email Management"
        subtitle="Configure email templates, dynamic placeholders, and automated delivery presets"
      />
      <EmailPresets />
    </div>
  );
}

export default function EmailManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <EmailManagementContent />
    </Suspense>
  );
}
