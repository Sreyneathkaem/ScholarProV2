"use client";

import React, { useState } from "react";
import InviteDialog from "@/components/common/invite-email-dialog-wrapper";
import TitleSetter from "@/components/header/tittle-setter";
import { PageHero } from "@/components/common/page-hero";
import { UserPlus, ListFilter } from "lucide-react";
import AdminClient from "@/components/users/admin-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPage() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  return (
    <div className="p-6 space-y-6 min-w-0 max-w-full">
      <TitleSetter title="Admin Management" />

      <PageHero
        title="Admin Accounts"
        subtitle="Manage administrative staff accounts, invitations, and access privileges"
        actions={
          <>
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val as "all" | "active" | "inactive")
              }
            >
              <SelectTrigger className="w-[140px] h-9 text-xs border-border/80">
                <div className="flex items-center gap-1.5">
                  <ListFilter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <InviteDialog
              title="Invite Admin"
              defaultRole="admin"
              emailLabel="Admin Email"
              emailPlaceholder="Enter admin email"
              nameLabel="Admin Name"
              namePlaceholder="Enter admin name"
              buttonText={
                <>
                  <UserPlus size={14} className="mr-1.5" /> Invite Admin
                </>
              }
              confirmText="Send Invite"
              onSubmit={(data) => console.log("Inviting admin (server):", data)}
            />
          </>
        }
      />

      <AdminClient statusFilter={statusFilter} />
    </div>
  );
}
