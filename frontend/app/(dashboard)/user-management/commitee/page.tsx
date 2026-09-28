"use client";

import React from "react";
import InviteDialog from "@/components/common/invite-email-dialog-wrapper";
import CommitteeListClient from "@/components/users/committee-list";
import TitleSetter from "@/components/header/tittle-setter";
import { PageHero } from "@/components/common/page-hero";
import { UserPlus } from "lucide-react";

export default function ComittePage() {
  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <TitleSetter title="Committee Management" />

      <PageHero
        title="Committee Members"
        subtitle="Manage evaluation committee members, review assignments, and scoring access"
        actions={
          <InviteDialog
            title="Invite Committee"
            defaultRole="committee"
            emailLabel="Committee Email"
            emailPlaceholder="Enter committee email"
            nameLabel="Committee Name"
            namePlaceholder="Enter committee name"
            buttonText={
              <>
                <UserPlus size={14} className="mr-1.5" /> Invite Committee
              </>
            }
            confirmText="Send Invite"
            onSubmit={(data) =>
              console.log("Inviting committee (server):", data)
            }
          />
        }
      />

      <CommitteeListClient />
    </div>
  );
}
