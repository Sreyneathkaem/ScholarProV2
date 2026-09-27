"use client";
import InviteDialog from "@/components/common/invite-email-dialog-wrapper";
import TitleSetter from "@/components/header/tittle-setter";

import { UserPlus } from "lucide-react";
import AdminClient from "@/components/users/admin-list";
import { useState } from "react";

export default function AdminPage() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  return (
    <div className="flex-1 space-y-4 p-8 pt-0">
      {/* client header setter */}
      <TitleSetter title="Admin" />

      {/* <div className="mb-4 mt-4">
        <SearchBar placeholder="Search for admin..." />
      </div> */}

      <div className="flex flex-row gap-2 items-center mb-4 mt-4">
        <InviteDialog
          title="Invite Admin"
          defaultRole="admin"
          emailLabel="Admin Email"
          emailPlaceholder="Enter admin email"
          nameLabel="Admin Name"
          namePlaceholder="Enter admin name"
          buttonText={
            <>
              <UserPlus size={16} /> Invite Admin
            </>
          }
          confirmText="Send Invite"
          onSubmit={(data) => console.log("Inviting admin (server):", data)}
        />

        <div>
          <label className="sr-only">Filter status</label>
          <select
            className="rounded-md bg-primary border px-3 py-1 text-sm text-white"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | "active" | "inactive")
            }
            aria-label="Filter admin status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <AdminClient statusFilter={statusFilter} />
    </div>
  );
}
