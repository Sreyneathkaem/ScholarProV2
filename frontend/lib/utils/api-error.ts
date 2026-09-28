import axios from "axios";

const FALLBACK = "Something went wrong. Please try again.";

type ZodLikeIssue = { message?: unknown };

/**
 * The backend throws `ValidationError` with a *serialised* Zod error as its
 * message (see backend/utils/errors.ts), so the wire response is:
 *
 *   { success: false, message: '{\n  "issues": [\n    {"path": [...], "message": "..."}\n  ]\n}' }
 *
 * Surfacing `message` verbatim therefore shows the applicant a wall of raw JSON.
 * This unwraps it into readable sentences, and also understands the plain
 * `errors: string[]` shape used by the `ZodError` branch of the error handler.
 */
function extractMessages(raw: unknown): string[] | null {
  if (typeof raw !== "string") return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    const issues =
      parsed && typeof parsed === "object" && "issues" in parsed
        ? (parsed as { issues: unknown }).issues
        : null;

    if (Array.isArray(issues)) {
      const messages = issues
        .map((issue) => (issue as ZodLikeIssue)?.message)
        .filter((message): message is string => typeof message === "string");
      if (messages.length > 0) return messages;
    }
  } catch {
    // Not JSON - fall through and treat it as a plain message.
  }

  return null;
}

/**
 * Turns an unknown thrown value into a message safe to show in a toast.
 */
export function getApiErrorMessage(error: unknown, fallback = FALLBACK): string {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;

  if (data && typeof data === "object") {
    const { message, errors } = data as {
      message?: unknown;
      errors?: unknown;
    };

    if (Array.isArray(errors) && errors.length > 0) {
      const joined = errors
        .filter((item): item is string => typeof item === "string")
        .join(", ");
      if (joined) return joined;
    }

    if (typeof message === "string" && message.trim()) {
      const issues = extractMessages(message);
      // Cap the list so a systematically-invalid payload cannot produce an
      // unreadable wall of text in the toast.
      if (issues) {
        const shown = issues.slice(0, 4);
        const suffix = issues.length > shown.length
          ? ` (+${issues.length - shown.length} more)`
          : "";
        return `${shown.join(", ")}${suffix}`;
      }
      return message;
    }
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
