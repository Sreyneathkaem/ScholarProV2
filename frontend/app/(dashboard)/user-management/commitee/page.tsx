"use client";

import InviteDialog from "@/components/common/invite-email-dialog-wrapper";
import CommitteeListClient from "@/components/users/committee-list";

import TitleSetter from "@/components/header/tittle-setter";

import { UserPlus } from "lucide-react";

export default function ComittePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-0">
      {/* client header setter */}
      <TitleSetter title="Committee" />

      {/* <div className="mb-4 mt-4">
        <SearchBar placeholder="Search for committee..." />
      </div> */}

      <div className="flex flex-row gap-2 items-center mb-4 mt-4">
        <InviteDialog
          title="Invite Committee"
          defaultRole="committee"
          emailLabel="Committee Email"
          emailPlaceholder="Enter committee email"
          nameLabel="Committee Name"
          namePlaceholder="Enter committee name"
          buttonText={
            <>
              <UserPlus size={16} /> Invite Committee
            </>
          }
          confirmText="Send Invite"
          onSubmit={(data) => console.log("Inviting committee (server):", data)}
        />
        {/* <Button size="sm" className="flex items-center gap-1 text-white">
          All Status <ChevronDown size={16} />
        </Button> */}
      </div>

      <CommitteeListClient />
    </div>
  );
}
