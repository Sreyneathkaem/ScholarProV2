"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { sanitizeEmailTemplate } from "@/lib/utils/sanitize";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { validateTemplateVariables } from "@/lib/utils/email-variables";
import { useEffect } from "react";

interface PreviewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  html: string;
  templateName?: string;
}

/**
 * PreviewTemplateDialog - Shows email template preview
 * Displays the raw template with variable placeholders
 * Validates template variables and logs warnings for unknown variables
 */
export function PreviewTemplateDialog({
  open,
  onOpenChange,
  subject,
  html,
  templateName,
}: PreviewTemplateDialogProps) {
  // Display raw template content with variables
  const previewSubject = subject;
  const previewContent = html;

  // Validate variables when dialog opens
  useEffect(() => {
    if (open && html) {
      const validation = validateTemplateVariables(html);
      if (!validation.valid) {
        console.warn(
          `Template "${templateName || "Unnamed"}" contains unknown variables:`,
          validation.unknownVariables,
        );
      }
    }
  }, [open, html, templateName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Template Preview
          </DialogTitle>
          <DialogDescription>
            Preview with sample data to see how your template will look to
            recipients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-200 mt-0.5"
              >
                Template Preview
              </Badge>
              <div className="flex-1">
                <p className="text-sm text-amber-900">
                  Variables like{" "}
                  <code className="bg-card px-1.5 py-0.5 rounded text-xs">
                    {"{{applicantName}}"}
                  </code>{" "}
                  will be replaced with actual recipient data when sending
                  emails.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Preview */}
          <ScrollArea className="h-[500px] rounded-md border">
            <div className="p-6 bg-card">
              {/* Email Client Styling */}
              <div className="max-w-2xl mx-auto">
                {/* Subject Line */}
                <div className="mb-6 pb-4 border-b">
                  <div className="mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Subject
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {previewSubject}
                  </h2>
                </div>

                {/* From/To Info */}
                <div className="mb-6 space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground min-w-16">
                      From:
                    </span>
                    <span className="text-foreground">
                      CamTech Scholarship Committee
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-muted-foreground min-w-16">
                      To:
                    </span>
                    <span className="text-foreground">{"{{email}}"}</span>
                  </div>
                </div>

                <Separator className="mb-6" />

                {/* Email Body */}
                <div
                  className="prose prose-sm max-w-none
                    prose-headings:text-foreground 
                    prose-p:text-foreground 
                    prose-a:text-blue-600 
                    prose-strong:text-foreground
                    prose-ul:text-foreground
                    prose-ol:text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeEmailTemplate(previewContent),
                  }}
                />

                {/* Email Footer */}
                <div className="mt-8 pt-6 border-t text-xs text-muted-foreground">
                  <p>
                    This is a template preview. Variables will be replaced with
                    actual recipient data when emails are sent.
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Variable Info */}
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Use the "Communications" page to send
              this template to recipients. Variables like{" "}
              <code className="bg-background px-1.5 py-0.5 rounded text-xs">
                {"{{applicantName}}"}
              </code>{" "}
              will be automatically replaced with actual recipient data.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
