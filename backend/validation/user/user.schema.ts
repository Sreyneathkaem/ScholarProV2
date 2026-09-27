import { z } from "zod";

const normalizePhoneNumber = (value: unknown) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return "";

  const digitsOnly = trimmed.replace(/[^\d+]/g, "");
  const hasPlus = digitsOnly.includes("+");

  return hasPlus
    ? `+${digitsOnly.replace(/\+/g, "")}`
    : digitsOnly.replace(/\+/g, "");
};

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phoneNumber: z.preprocess(
    normalizePhoneNumber,
    z
      .string()
      .regex(/^\+?[0-9]{8,15}$/, "Invalid phone number format")
      .optional(),
  ),
  departmentId: z.coerce
    .number()
    .int()
    .positive("Department ID must be a positive integer")
    .optional(),
  profileUrl: z.string().optional(),
});
