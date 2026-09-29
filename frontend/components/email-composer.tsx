"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Mail } from "lucide-react";

// TODO: Load templates from backend API when available
type LegacyTemplate = {
  id: string;
  name: string;
  subject: string;
  content: string;
};
const EMAIL_TEMPLATES: LegacyTemplate[] = [];
const getTemplateById = (id: string): LegacyTemplate | undefined =>
  EMAIL_TEMPLATES.find((t) => t.id === id);

// Define the shape of your Student data
export interface Student {
  id: string;
  number: string;
  name: string;
  email: string;
  status: string;
  awardAmount?: number;
}

interface EmailComposerProps {
  // Data Source
  allStudents: Student[];

  // Configuration
  initialType?: string;
  hideTypeSelector?: boolean; // Useful if you want to force a specific list

  // Actions
  onSend: (data: {
    recipients: Student[];
    subject: string;
    body: string;
    templateId: string;
  }) => Promise<void> | void;
}

export function EmailComposer({
  allStudents,
  initialType = "shortlisted",
  hideTypeSelector = false,
  onSend,
}: EmailComposerProps) {
  const [selectedRecipientType, setSelectedRecipientType] =
    React.useState(initialType);
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [messageBody, setMessageBody] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  // Filter Logic: Filters the passed 'allStudents' prop
  const recipients = React.useMemo(() => {
    // If selector is hidden, we assume the parent passed only the relevant students in 'allStudents'
    if (hideTypeSelector) return allStudents;

    switch (selectedRecipientType) {
      case "rejected":
        return allStudents.filter((s) => s.status === "rejected");
      case "shortlisted":
        return allStudents.filter((s) => s.status === "shortlisted");
      case "new":
        return allStudents.filter((s) => s.status === "new-applicant");
      case "interview":
        return allStudents.filter((s) => s.status === "exam-scheduled");
      case "awarded-100":
        return allStudents.filter(
          (s) => s.status === "awarded" && s.awardAmount === 3000,
        );
      case "awarded-75":
        return allStudents.filter(
          (s) => s.status === "awarded" && s.awardAmount === 2250,
        );
      case "awarded-50":
        return allStudents.filter(
          (s) => s.status === "awarded" && s.awardAmount === 1500,
        );
      case "awarded-25":
        return allStudents.filter(
          (s) => s.status === "awarded" && s.awardAmount === 750,
        );
      case "awarded":
        return allStudents.filter((s) => s.status === "awarded");
      default:
        return allStudents.filter((s) => s.status === "shortlisted");
    }
  }, [selectedRecipientType, allStudents, hideTypeSelector]);

  // Template Logic: Auto-select template when type changes
  React.useEffect(() => {
    let defaultTemplateId = "shortlisted";

    // Map recipient types to template IDs
    const typeToTemplateMap: Record<string, string> = {
      rejected: "rejected",
      shortlisted: "shortlisted",
      "awarded-100": "100-scholarship",
      "awarded-75": "75-scholarship",
      "awarded-50": "50-scholarship",
      "awarded-25": "25-scholarship",
    };

    defaultTemplateId =
      typeToTemplateMap[selectedRecipientType] || "shortlisted";

    handleTemplateChange(defaultTemplateId);
  }, [selectedRecipientType]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = getTemplateById(templateId);
    if (template) {
      setSubject(template.subject);
      setMessageBody(template.content);
    }
  };

  const handleSendClick = async () => {
    try {
      setIsSending(true);
      await onSend({
        recipients,
        subject,
        body: messageBody,
        templateId: selectedTemplate,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT: Recipients Section */}
      <div className="bg-card rounded-lg border p-6 h-fit">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Recipients</h2>
        </div>

        {!hideTypeSelector && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Select Recipients
            </label>
            <Select
              value={selectedRecipientType}
              onValueChange={setSelectedRecipientType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipient group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shortlisted">
                  Shortlisted Applicants
                </SelectItem>
                <SelectItem value="rejected">Rejected Applicants</SelectItem>
                <SelectItem value="awarded-100">
                  100% Scholarship Students
                </SelectItem>
                <SelectItem value="awarded-75">
                  75% Scholarship Students
                </SelectItem>
                <SelectItem value="awarded-50">
                  50% Scholarship Students
                </SelectItem>
                <SelectItem value="awarded-25">
                  25% Scholarship Students
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Student List ({recipients.length})
          </label>
          <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
            <div className="divide-y">
              {recipients.map((student) => (
                <div
                  key={student.id}
                  className="grid grid-cols-12 gap-2 p-3 text-sm hover:bg-muted"
                >
                  <div className="col-span-3 font-medium text-foreground truncate">
                    {student.number}
                  </div>
                  <div className="col-span-5 text-foreground truncate">
                    {student.name}
                  </div>
                  <div className="col-span-4 text-muted-foreground truncate">
                    {student.email}
                  </div>
                </div>
              ))}
            </div>
            {recipients.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                No students found for this category
              </div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Check the recipient list carefully before sending.
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Compose Email Section */}
      <div className="bg-card rounded-lg border p-6 h-fit">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Compose Email</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Template
            </label>
            <Select
              value={selectedTemplate}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Message body
            </label>
            <Textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={12}
              className="resize-none"
              placeholder="Enter your email message here..."
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Tip: Use [Student Name] placeholder for personalization
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSendClick}
            disabled={isSending || recipients.length === 0}
            className="text-white px-6 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {isSending
              ? "Sending..."
              : `Send to ${recipients.length} Student(s)`}
          </Button>
        </div>
      </div>
    </div>
  );
}
