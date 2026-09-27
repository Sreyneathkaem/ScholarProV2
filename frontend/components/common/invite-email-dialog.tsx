"use client";

import { ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteDialogProps {
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
  onSubmit?: (values: { name: string; email: string; role: string }) => void;
}

export default function InviteDialog({
  title = "Invite",
  nameLabel = "Name",
  emailLabel = "Email",
  namePlaceholder = "Enter name",
  emailPlaceholder = "Enter email",
  buttonText = "Invite",
  roleLabel = "Role",
  rolePlaceholder = "Select role",
  defaultRole = "",
  confirmText = "Send Invite",
  onSubmit,
}: InviteDialogProps) {
  const [open, setOpen] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [roleValue, setRoleValue] = useState(defaultRole);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setRoleValue(defaultRole);
    }
  };

  const handleSubmit = () => {
    const finalRole = roleValue || defaultRole;
    if (onSubmit) {
      onSubmit({ name: nameValue, email: emailValue, role: finalRole });
    }
    setOpen(false);
    setNameValue("");
    setEmailValue("");
    setRoleValue(defaultRole);
  };

  return (
    <>
      {/* Trigger button */}
      <Button
        size="sm"
        className="flex items-center gap-1 text-white"
        onClick={() => setOpen(true)}
      >
        {buttonText}
      </Button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="inviteName">{nameLabel}</Label>
              <Input
                id="inviteName"
                placeholder={namePlaceholder}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">{emailLabel}</Label>
              <Input
                id="inviteEmail"
                placeholder={emailPlaceholder}
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteRole">{roleLabel}</Label>
              <Select value={roleValue} onValueChange={setRoleValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={rolePlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="committee">Committee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="text-white">
              {confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
