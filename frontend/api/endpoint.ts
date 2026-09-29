export const API_ENDPOINTS = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REFRESH: "/auth/refresh",
  ME: "/users/profile",
  // Student OAuth endpoints
  AUTH_GOOGLE: "/auth/google", // GET → redirect to Google (get auth URL)
  AUTH_GOOGLE_URL: "/auth/google/url", // GET → { url } as JSON (no proxied 302)
  AUTH_GOOGLE_CALLBACK: "/auth/google/callback", // POST { code, state } → exchange for accessToken
  AUTH_TELEGRAM_CALLBACK: "/auth/telegram/callback",

  RESET_PASSWORD: "/auth/reset-password",

  USER: "/users/role",
  COMMITEE: "/committees",
  IMPORT_CSV: "/applications/import",
  BATCH: "/batches",
  APPLICANT: "/applications",
  INVITE: "/users/invite",

  FINAL_SCORE: "/score/exam-scores",

  EXPORT_CSV: "/applications/export/csv",

  UPDATE_SUBJECT: (id: number) => `/subjects/${id}/weight`,
  CREATE_SUBJECT: "/subjects",

  // Invite validation & registration
  VALIDATE_INVITE: (id: string, token: string) => `/auth/${id}/${token}`,
  REGISTER_INVITE: (id: string, token: string) =>
    `/auth/register/${id}/${token}`,

  // Forgot password
  FORGOT_PASSWORD: "/auth/forgot-password",
  VALIDATE_FORGOT_PASSWORD: (id: string, token: string) =>
    `/auth/forgot-password/${id}/${token}`,
  RESET_FORGOT_PASSWORD: (id: string, token: string) =>
    `/auth/forgot-password/${id}/${token}`,

  NEW_USER: "/users",
  DASHBOARD: "/dashboard",

  RESET_PASSWORD_AUTH: "/auth/reset-password",
  LIST_STUDENTS: (id: string) => `/exam-sessions/applicant/${id}`,

  GET_ALL_EXAM_SESSIONS: "/exam-sessions/committee",
  UPDATE_SCORE: (examId: string) => `/exams/${examId}/score`,

  EVALUATION: "/score/score",
  CITERIA: "/cirteria",

  ACTIVATE_CRITERIA: (id: number) => `/score/${id}/activate`,
  DEACTIVATE_CRITERIA: (id: number) => `/score/${id}/deactivate`,

  CREATE_CRITERIA: "/score",

  //EXAM AND INTERVIEWS
  LIST_BATCH: "/batches",
  GET_BATCH: (id: string) => `/batches/${id}`,
  GET_ALL_SUBJECTS: "/subjects",
  UPDATE_BATCH: (id: string) => `/batches/${id}`,

  //COMITTEE MANAGEMENT
  ADD_COMMITTEE: "/exam-sessions/add-committe",
  GET_ALL_COMMITTEE: "/committees",
  GET_AVAILABLE_COMMITTEE: "/committees/available",
  GET_FACULTY: "/faculties",

  SCHEDULE: {
    CREATE_EXAM: (batchId: string) => `/exam-sessions/${batchId}`,
    UPDATE_EXAM: (id: string) => `/exam-sessions/${id}`,

    // ADDED: Endpoints for future backend integration
    GET_ALL_SESSIONS: (id: string) => `/exam-sessions/batch/${id}`, // TODO: Confirm with backend
    GET_BATCH_SESSIONS: (batchId: string) => `/exam-sessions/batch/${batchId}`, // TODO: Confirm
    GET_EXAM_SESSION_DETAIL: (id: string) => `/exam-sessions/${id}`, // TODO: Confirm
    DELETE_SESSION: (id: string) => `/exam-sessions/${id}`, // TODO: Confirm
  },

  EMAIL: {
    // Email Templates
    CREATE_TEMPLATE: "/email", // POST - Create template
    LIST_TEMPLATES: "/email/template-name", // GET - List all template names
    PREVIEW_TEMPLATE: (name: string) => `/email/${name}`, // GET - Preview template
    UPDATE_TEMPLATE: (name: string) => `/email/${name}`, // PUT - Update template
    DELETE_TEMPLATE: (name: string) => `/email/${name}`, // DELETE - Delete template

    // Email Sending
    BULK_SEND: (name: string) => `/email/bulk-send/${name}`, // POST - Send bulk email
    GET_JOB: (jobId: number) => `/email/jobs/${jobId}`, // GET - Get email job status
    TEST_SEND: "/email/test-send", // POST - Send one real email via SES, bypassing the queue

    // Recipient Management
    LIST_BATCHES: "/batches", // GET - List all batches
    LIST_RECIPIENTS: "/email/recipient", // GET - Get recipients with filters (batchId, status, scholarshipPercentage, major)
  },
} as const;

export type ApiEndpointProps =
  (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];
