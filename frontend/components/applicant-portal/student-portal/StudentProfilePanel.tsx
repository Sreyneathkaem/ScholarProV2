"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, UserCircle2, BadgeCheck } from "lucide-react";
import {
  loadStudentPortalSnapshot,
  saveStudentPortalSnapshot,
  type StudentPortalSnapshot,
} from "@/lib/utils/student-portal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function StudentProfilePanel() {
  const [snapshot, setSnapshot] = useState<StudentPortalSnapshot | null>(null);

  useEffect(() => {
    const syncData = () => {
      const data = loadStudentPortalSnapshot();
      setSnapshot(data);
    };

    syncData();

    window.addEventListener("student-portal-updated", syncData);
    window.addEventListener("student-profile-updated", syncData);
    return () => {
      window.removeEventListener("student-portal-updated", syncData);
      window.removeEventListener("student-profile-updated", syncData);
    };
  }, []);

  const handleSave = () => {
    const next = saveStudentPortalSnapshot({
      profile: {
        name: snapshot?.profile.name ?? "Applicant",
        email: snapshot?.profile.email ?? "applicant@example.com",
        phone: snapshot?.profile.phone ?? "—",
        studentId: snapshot?.profile.studentId ?? "APP-001",
      },
    });
    setSnapshot(next);
    toast.success("Profile details synced successfully");
  };

  if (!snapshot) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Profile
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Your Account Overview
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              Keep your personal and contact information up to date while the
              committee reviews your application.
            </p>
          </div>
          <Badge variant="success" className="px-3 py-1 font-semibold text-xs">
            Active Account
          </Badge>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-border/80 bg-muted/20 p-6 text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserCircle2 className="size-10" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">
              {snapshot.profile.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Applicant ID: {snapshot.profile.studentId}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5">
              <Badge variant="success" className="px-3 py-1 text-xs">
                <BadgeCheck className="size-3.5 mr-1" />
                Verified Profile
              </Badge>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border border-border/80 bg-card p-6 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-background p-3.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
              <Mail className="size-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Email
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {snapshot.profile.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-background p-3.5 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
              <Phone className="size-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Phone
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {snapshot.profile.phone}
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Application Status
              </p>
              <p className="mt-1 leading-relaxed">
                Your profile stays connected to the committee review workflow
                and will be updated as your status changes.
              </p>
            </div>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto rounded-md"
            >
              Sync Profile Snapshot
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
