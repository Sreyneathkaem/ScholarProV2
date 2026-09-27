"use client";

import { API_ENDPOINTS } from "@/api/endpoint";
import InviteDialog from "./invite-email-dialog";
import type { ReactNode } from "react";
import { apiClient } from "@/api/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY_ENUM } from "@/constants/query-key-enum";

interface InviteDialogWrapperProps {
  title?: string;
  nameLabel?: string;
  emailLabel?: string;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  roleLabel?: string;
  rolePlaceholder?: string;
  defaultRole?: string;
  buttonText?: ReactNode;
  confirmText?: string;
  roleOptions?: { label: string; value: string }[];
  onSubmit?: (data: {
    name: string;
    email: string;
    role?: string;
  }) => Promise<void> | void;
}

export default function InviteDialogWrapper(props: InviteDialogWrapperProps) {
  const queryClient = useQueryClient();

  const handleSubmit = async ({
    name,
    email,
    role,
  }: {
    name: string;
    email: string;
    role?: string;
  }) => {
    const trimmedName = (name || "").trim();
    const trimmedEmail = (email || "").trim();
    const selectedRole = role || props.defaultRole;

    if (!trimmedName || trimmedName.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!selectedRole) {
      toast.error("Please select a role (Admin or Committee)");
      return;
    }

    try {
      console.log("Inviting:", trimmedName, trimmedEmail, selectedRole);

      const res = await apiClient.post(API_ENDPOINTS.INVITE, {
        name: trimmedName,
        email: trimmedEmail,
        role: selectedRole,
      });

      toast.success(res.data?.message || "Invite sent successfully");

      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ENUM.ADMINS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_ENUM.COMMITTEES] });

      if (props.onSubmit) {
        await props.onSubmit({ name: trimmedName, email: trimmedEmail, role: selectedRole });
      }
    } catch (err: unknown) {
      console.error("Invite failed", err);
      const apiError = err as {
        response?: { data?: { message?: string; error?: string } };
      };
      const message =
        apiError.response?.data?.message ||
        apiError.response?.data?.error ||
        "Failed to send invite";
      toast.error(message);
    }
  };

  return <InviteDialog {...props} onSubmit={handleSubmit} />;
}
