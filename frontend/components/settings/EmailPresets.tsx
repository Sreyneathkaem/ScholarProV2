"use client";

import React, { useEffect, useState } from "react";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  RotateCcw,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { CreateTemplateDialog } from "./CreateTemplateDialog";
import { PreviewTemplateDialog } from "./PreviewTemplateDialog";
import {
  emailTemplateSchema,
  emailTemplateUpdateSchema,
} from "@/lib/schema/email-template-schema";
import { ZodError } from "zod";
import type { EmailTemplate } from "@/api/service/email.service";
import { emailService } from "@/api/service/email.service";
import { TemplatePresetSkeleton } from "@/components/communications/EmailSkeletons";

export default function EmailPresets() {
  // Template list state
  const [templateNames, setTemplateNames] = useState<string[]>([]);
  const [templates, setTemplates] = useState<Map<string, EmailTemplate>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(false);

  // Email Template State
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  // Get current template
  const currentTemplate = templates.get(selectedTemplateName);

  // Load template names
  const loadTemplateNames = async () => {
    try {
      setIsLoading(true);
      // TODO STEP 1: Uncomment this line to fetch from API
      const names = await emailService.listTemplates();

      // Temporary: Empty state for now
      // const names: string[] = [];
      setTemplateNames(names);

      if (names.length > 0 && !selectedTemplateName) {
        setSelectedTemplateName(names[0]);
      }
    } catch (error) {
      console.error("Error loading template names:", error);
      toast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  };

  // Load full template details
  const loadTemplate = async (name: string) => {
    try {
      setIsLoading(true);
      // TODO STEP 2: Uncomment this line to fetch template details
      const template = await emailService.getTemplate(name);

      // Temporary: Create empty template structure
      // const template: EmailTemplate = {
      //   name,
      //   subject: "",
      //   html: "<p>Start writing your email template here...</p>",
      // };

      setTemplates((prev) => new Map(prev).set(name, template));
      setSubject(template.subject);
      setMessageBody(template.html);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template details");
    } finally {
      setIsLoading(false);
    }
  };

  // Load template when selection changes
  useEffect(() => {
    if (selectedTemplateName && !templates.has(selectedTemplateName)) {
      loadTemplate(selectedTemplateName);
    } else if (currentTemplate) {
      setSubject(currentTemplate.subject);
      setMessageBody(currentTemplate.html);
      setHasUnsavedChanges(false);
    }
  }, [selectedTemplateName]);

  // Track changes
  useEffect(() => {
    if (
      currentTemplate &&
      (subject !== currentTemplate.subject ||
        messageBody !== currentTemplate.html)
    ) {
      setHasUnsavedChanges(true);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [subject, messageBody, currentTemplate]);

  // Load template names on mount
  useEffect(() => {
    loadTemplateNames();
  }, []);

  const handleSave = async () => {
    if (!selectedTemplateName) return;

    try {
      setIsLoading(true);

      // Validate with Zod schema
      const validatedData = emailTemplateUpdateSchema.parse({
        name: selectedTemplateName,
        subject,
        html: messageBody,
      });

      // TODO STEP 3: Uncomment to save via API
      await emailService.updateTemplate(selectedTemplateName, validatedData);

      toast.success("Template saved successfully!");
      setHasUnsavedChanges(false);

      // Reload template
      await loadTemplate(selectedTemplateName);
    } catch (error) {
      if (error instanceof ZodError) {
        // Show field-specific validation errors
        const fieldErrors = error.issues.map((err) => err.message).join(", ");
        toast.error(`Validation failed: ${fieldErrors}`);
      } else {
        console.error("Error saving template:", error);
        const responseMessage =
          error && typeof error === "object" && "response" in error
            ? (error as { response?: { data?: { message?: string } } }).response
                ?.data?.message
            : undefined;
        toast.error(responseMessage || "Failed to save template");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (currentTemplate) {
      setSubject(currentTemplate.subject);
      setMessageBody(currentTemplate.html);
      setHasUnsavedChanges(false);
      toast.info("Template reset to last saved version");
    }
  };

  const handleDuplicate = async () => {
    if (!currentTemplate) return;

    const newName = `${selectedTemplateName}_copy_${Date.now()}`;

    try {
      setIsLoading(true);

      // Validate with Zod schema for creating new template
      const validatedData = emailTemplateSchema.parse({
        templateName: newName,
        subject: currentTemplate.subject,
        html: currentTemplate.html,
      });
      await emailService.createTemplate(validatedData);

      toast.success("Template duplicated successfully!");
      await loadTemplateNames();
      setSelectedTemplateName(newName);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.issues.map((err) => err.message).join(", ");
        toast.error(`Validation failed: ${fieldErrors}`);
      } else {
        console.error("Error duplicating template:", error);
        toast.error("Failed to duplicate template");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!selectedTemplateName) return;
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedTemplateName) return;

    try {
      setIsLoading(true);
      // TODO STEP 5: Uncomment to delete via API
      await emailService.deleteTemplate(selectedTemplateName);

      toast.success("Template deleted successfully!");
      await loadTemplateNames();

      const remainingNames = templateNames.filter(
        (n) => n !== selectedTemplateName,
      );
      setSelectedTemplateName(
        remainingNames.length > 0 ? remainingNames[0] : "",
      );
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateCreated = async (templateName: string) => {
    await loadTemplateNames();
    setSelectedTemplateName(templateName);
    toast.success("Now editing your new template");
  };

  if (isLoading && templateNames.length === 0) {
    return <TemplatePresetSkeleton />;
  }

  return (
    <Card className="flex flex-center p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Templates</h2>
          <p className="text-muted-foreground mt-1">
            Create and manage email templates with dynamic variables using{" "}
            {"{{variableName}}"} format
          </p>
        </div>

        {/* Template Selection */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex-1 max-w-md">
            <Label htmlFor="email-template" className="text-base font-semibold">
              Select Template
            </Label>
            <Select
              value={selectedTemplateName}
              onValueChange={setSelectedTemplateName}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templateNames.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No templates available
                  </SelectItem>
                ) : (
                  templateNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={!currentTemplate || isLoading}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            {currentTemplate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-row-hoverred-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Editor */}
        {currentTemplate ? (
          <div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Subject */}
                  <div>
                    <Label
                      htmlFor="subject"
                      className="text-base font-semibold"
                    >
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="mt-2"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Message Body */}
                  <div>
                    <Label className="text-base font-semibold">
                      Message body
                    </Label>
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <TipTapEditor
                        value={messageBody}
                        onChange={setMessageBody}
                      />
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Tip:</strong> Insert variables using{" "}
                      {"{{variableName}}"} format. Available: applicantName,
                      gender, email, major, scholarshipPercentage, tuitionFee,
                      mathExamDate, mathStartTime, englishExamDate,
                      interviewExamDate, and more.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges || isLoading}
                className="bg-[#0F386C] hover:bg-[#0c2d56] text-white px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Save Template
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreviewDialog(true)}
                disabled={!currentTemplate || isLoading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview with Test Data
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Select or create a template to start editing</p>
            </div>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <CreateTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTemplateCreated={handleTemplateCreated}
      />

      <PreviewTemplateDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        subject={subject}
        html={messageBody}
        templateName={selectedTemplateName}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedTemplateName}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
