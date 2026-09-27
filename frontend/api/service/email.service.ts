import { apiClient } from "../api";
import { API_ENDPOINTS } from "../endpoint";

// ============================================
// TYPE DEFINITIONS (Based on actual API responses)
// ============================================

// List Templates Response - API returns: { success: true, data: [{ TemplateName: "..." }] }
interface ListEmailTemplatesResponse {
  success: boolean;
  data: Array<{ TemplateName: string }>;
}

// Get Template Response - API returns: { success: true, message: { TemplateName, TemplateContent: { Subject, Html }, $metadata } }
interface PreviewEmailTemplateResponse {
  success: boolean;
  message: {
    TemplateName: string;
    TemplateContent: {
      Subject: string;
      Html: string;
    };
    $metadata?: unknown;
  };
}

// Create/Update/Delete Response - API returns: { success: boolean, message: string }
interface TemplateOperationResponse {
  success: boolean;
  message: string;
}

// Bulk Send Response - API returns: { success: boolean, message: string }
interface BulkSendApiResponse {
  success: boolean;
  message: string;
  jobId?: number;
}

// ============================================
// EXPORTED TYPES (Frontend-friendly interfaces)
// ============================================

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
}

export interface CreateTemplateRequest {
  templateName: string;
  subject: string;
  html: string;
}

export interface UpdateTemplateRequest {
  subject: string;
  html: string;
}

export interface BulkSendResponse {
  success: boolean;
  message: string;
  jobId?: number;
}

export interface EmailJobStatus {
  jobId: number;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  status: "queued" | "processing" | "completed";
}

export interface Batch {
  id: number;
  batchName: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BatchListResponse {
  batches: Batch[];
}

export interface EmailRecipient {
  id?: number;
  applicationId?: number;
  applicantId?: number;
  nameEn?: string;
  applicantName?: string;
  applicationName?: string;
  name?: string;
  email: string;
  status: string;
  batchId?: number;
  batchName?: string;
  scholarshipPercentage?: number;
  major?: string;
  gender?: string;
  tuitionFee?: number;
}

export interface RecipientsListResponse {
  success: boolean;
  data?: EmailRecipient[];
  pagination: {
    limit: number;
    page: number;
    offset: number;
    count: number;
    data?: EmailRecipient[];
  };
}

// ============================================
// EMAIL SERVICE (Following codebase patterns)
// ============================================

export const emailService = {
  /**
   * List all template names
   * GET /api/email/template-name
   * Returns: { success: boolean, data: [{ TemplateName: string }] }
   */
  async listTemplates(): Promise<string[]> {
    const response = await apiClient.get<ListEmailTemplatesResponse>(
      API_ENDPOINTS.EMAIL.LIST_TEMPLATES,
    );

    // Extract template names from array of objects
    return response.data.data.map((item) => item.TemplateName);
  },

  /**
   * Get template details by name
   * GET /api/email/{name}
   * Returns: { success: boolean, message: { TemplateName, TemplateContent: { Subject, Html } } }
   */
  async getTemplate(name: string): Promise<EmailTemplate> {
    const response = await apiClient.get<PreviewEmailTemplateResponse>(
      API_ENDPOINTS.EMAIL.PREVIEW_TEMPLATE(name),
    );

    // API returns flat structure with TemplateName and TemplateContent at message level
    const { TemplateName, TemplateContent } = response.data.message;

    if (!TemplateContent) {
      throw new Error(
        `Template '${name}' has invalid structure - missing TemplateContent`,
      );
    }

    return {
      name: TemplateName,
      subject: TemplateContent.Subject,
      html: TemplateContent.Html,
    };
  },

  /**
   * Create new template
   * POST /api/email
   * Body: { templateName, subject, html }
   * Returns: { success: boolean, message: string }
   */
  async createTemplate(data: CreateTemplateRequest): Promise<EmailTemplate> {
    const response = await apiClient.post<TemplateOperationResponse>(
      API_ENDPOINTS.EMAIL.CREATE_TEMPLATE,
      data,
    );

    // API returns { success, message }, not { success, data }
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to create template");
    }

    // Return the template we just created
    return {
      name: data.templateName,
      subject: data.subject,
      html: data.html,
    };
  },

  /**
   * Update existing template
   * PUT /api/email/{name}
   * Body: { subject, html }
   * Returns: { success: boolean, message: string }
   */
  async updateTemplate(
    name: string,
    data: UpdateTemplateRequest,
  ): Promise<EmailTemplate> {
    const response = await apiClient.put<TemplateOperationResponse>(
      API_ENDPOINTS.EMAIL.UPDATE_TEMPLATE(name),
      data,
    );

    // Check success status
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to update template");
    }

    return {
      name: name,
      subject: data.subject,
      html: data.html,
    };
  },

  /**
   * Delete template
   * DELETE /api/email/{name}
   * Returns: { success: boolean, message: string }
   */
  async deleteTemplate(
    name: string,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<TemplateOperationResponse>(
      API_ENDPOINTS.EMAIL.DELETE_TEMPLATE(name),
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  },

  async getJobStatus(jobId: number): Promise<EmailJobStatus> {
    const response = await apiClient.get<EmailJobStatus>(
      API_ENDPOINTS.EMAIL.GET_JOB(jobId),
      {
        params: { statusCheck: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      },
    );
    return response.data;
  },

  /**
   * Send bulk email
   * POST /api/email/bulk-send/{name}
   * Query params: batchId (required), status, scholarshipPercentage, major
   * Returns: { success: boolean, message: string }
   */
  async bulkSend(
    templateName: string,
    batchId?: number,
    status?: string,
    scholarshipPercentage?: string,
    major?: string,
    applicationIds?: number[],
    emails?: string[],
  ): Promise<BulkSendResponse> {
    // Build params object - only include truthy values
    const params: Record<string, string> = {};

    if (batchId !== undefined) params.batchId = batchId.toString();

    if (status && status.trim() !== "") params.status = status;
    if (scholarshipPercentage && scholarshipPercentage.trim() !== "") {
      params.scholarshipPercentage = scholarshipPercentage;
    }
    if (major && major.trim() !== "") params.major = major;
    if (applicationIds && applicationIds.length > 0) {
      params.applicationIds = applicationIds.join(",");
    }
    if (emails && emails.length > 0) {
      params.emails = emails.join(",");
    }

    const response = await apiClient.post<BulkSendApiResponse>(
      API_ENDPOINTS.EMAIL.BULK_SEND(templateName),
      {}, // Empty body - backend uses query params
      { params },
    );

    return {
      success: response.data.success,
      message: response.data.message,
      jobId: response.data.jobId,
    };
  },

  /**
   * List all batches
   * GET /api/batches
   * Returns: { batches: Batch[] }
   */
  async listBatches(): Promise<Batch[]> {
    const response = await apiClient.get<BatchListResponse>(
      API_ENDPOINTS.EMAIL.LIST_BATCHES,
    );
    return response.data.batches;
  },

  /**
   * List recipients with filters
   * GET /api/email/recipient
   * Query params: batchId (required), status, scholarshipPercentage, major
   * Returns: { success: boolean, count: number, data: EmailRecipient[] }
   */
  async listRecipients(
    batchId?: number,
    status?: string,
    scholarshipPercentage?: string,
    major?: string,
    search?: string,
  ): Promise<{ success: boolean; count: number; data: EmailRecipient[] }> {
    // Build params object - only include non-empty values
    const params: Record<string, string> = {
      limit: "10000",
    };

    if (batchId !== undefined) params.batchId = batchId.toString();

    // Only add optional params if they have actual values (not empty strings)
    if (status && status.trim() !== "") {
      params.status = status;
    }
    if (scholarshipPercentage && scholarshipPercentage.trim() !== "") {
      params.scholarshipPercentage = scholarshipPercentage;
    }
    if (major && major.trim() !== "" && major !== "All Majors") {
      params.major = major;
    }
    if (search?.trim()) params.search = search.trim();

    console.log("[listRecipients] Calling API with params:", params);
    console.log(
      "[listRecipients] Full URL:",
      `${API_ENDPOINTS.EMAIL.LIST_RECIPIENTS}?${new URLSearchParams(params).toString()}`,
    );

    const response = await apiClient.get<RecipientsListResponse>(
      API_ENDPOINTS.EMAIL.LIST_RECIPIENTS,
      { params },
    );

    const recipientData =
      response.data.data || response.data.pagination?.data || [];

    // Return the data with count from pagination
    return {
      success: response.data.success,
      count: response.data.pagination?.count ?? recipientData.length,
      data: recipientData,
    };
  },
};
