"use client";

import { useEffect } from "react";
import ProfileSettings from "@/components/settings/ProfileSettings";
import { useHeader } from "@/components/header/header-context";
import { PageHero } from "@/components/common/page-hero";

export default function ProfileSettingsPage() {
  const { setTitle } = useHeader();

  useEffect(() => {
    setTitle("Profile Settings");
  }, [setTitle]);

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <PageHero
        title="Account Profile Settings"
        subtitle="Manage your personal profile details, account credentials, and security preferences"
      />
      <ProfileSettings />
    </div>
  );
}
