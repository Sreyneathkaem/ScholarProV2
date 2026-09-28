import {
  pgTable,
  integer,
  varchar,
  timestamp,
  pgEnum,
  uuid,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { admins } from "./admin";
import { emailBatchJobs } from "./email-batch-jobs";

export const emailStatusEnum = pgEnum("email_status", [
  "sent",
  "failed",
  "pending",
  "processing",
]);

export const emailSents = pgTable("email_sents", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => admins.id),
  emailBatchJobId: integer("email_batch_job_id").references(
    () => emailBatchJobs.id,
  ),
  toEmail: varchar("to_email", { length: 255 }),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  emailData: jsonb("email_data"),
  status: emailStatusEnum("status").notNull(),
  // Why SES rejected the message, when it did. Without this the UI could only
  // report a failed count and the reason existed solely in a log file.
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
