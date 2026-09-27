import cron from "node-cron";
import updateExamSessionStatus from "./update-exam-session-status";
import processEmailQueue from "./process-email-queue";
import "./token-renewer"; // Start token renewal job

cron.schedule("*/10 * * * *", async () => {
  await updateExamSessionStatus();
});

// Every minute
cron.schedule("* * * * *", async () => {
  try {
    await processEmailQueue();
  } catch (error) {
    console.error("[EmailQueue] Scheduler run failed:", error);
  }
});

void processEmailQueue().catch((error) => {
  console.error("[EmailQueue] Startup run failed:", error);
});
