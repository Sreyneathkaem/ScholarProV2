# ScholarPro - Scholarship Management System

## Overview

Welcome to ScholarPro! This project is a comprehensive scholarship management system designed to handle the entire application and evaluation process. This document serves as a guide for new developers, especially our junior team, to get acquainted with the codebase, architecture, and key functionalities.

## ⚠️ Important Note for New Developers

This project has evolved over time, and as a result, you will encounter some architectural and stylistic inconsistencies. Some parts of the codebase use a class-based approach for services and controllers, while others use a more functional style.

While this can be confusing, the core data flow remains consistent. Understanding this flow is key to understanding the application.

## Project Architecture

The application follows a standard **Model-Service-Controller-Route** pattern. Here’s a breakdown of the data and logic flow:

1.  **Route (`/routes`):** Defines the API endpoints and maps them to specific controller functions. It's the entry point for any incoming request.
2.  **Controller (`/controllers`):** Handles the incoming HTTP request and response. Its primary job is to parse the request, call the appropriate service to handle the business logic, and then format and send the response.
3.  **Validation (`/validation`):** Before the controller logic is executed, incoming data is validated against schemas defined using **Zod**. This ensures data integrity and prevents invalid data from reaching the service layer.
4.  **Service (`/services`):** Contains the core business logic of the application. It interacts with the database models and performs the necessary computations and operations.
5.  **Model (Database Schema) (`/db/schema`):** Defines the database tables and their relationships using **Drizzle ORM**. This is the data layer of the application.

Additionally, we use:

- **Middleware (`/middleware`):** For concerns that cut across multiple routes, such as user authentication, role authorization, and request logging.
- **Utils (`/utils`):** For helper functions and utilities that can be reused throughout the application.

## Key Features & Technologies

This project is built with a modern and robust stack. Here are some of the key technologies you'll be working with:

- **Backend Framework:** [Express.js](https://expressjs.com/) - A minimal and flexible Node.js web application framework.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - For static typing and better developer experience.
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/) for type-safe database access.
- **Authentication:**
  - **JWT (JSON Web Tokens):** For securing API endpoints. The system uses both access tokens and refresh tokens. See `middleware/authenticate-user.ts`.
  - **OAuth:** Supports login via Google and Telegram.
- **Validation:** [Zod](https://zod.dev/) - For powerful and type-safe data validation. Schemas are typically located in the `/validation` directory.
- **Email Service:** [AWS SES (Simple Email Service)](https://aws.amazon.com/ses/) - For sending transactional emails. The project includes a background job to process the email queue.
- **Error Monitoring:** [Sentry](https://sentry.io/) - For real-time error tracking and performance monitoring. Configuration is in `sentry.ts`.
- **Logging:**
  - [Winston](https://github.com/winstonjs/winston) - For robust, multi-level logging. Logs are rotated daily and stored in the `/logs` directory.
  - **Purpose-Based Loggers:** We use different loggers for different purposes (e.g., `securityLogger`, `auditLogger`, `appLogger`). See `utils/logger.ts`.
  - **Promtail:** The file-based logging is designed to be scraped by Promtail for centralized logging with Grafana Loki.
- **File Uploads:** [Multer](https://github.com/expressjs/multer) - For handling `multipart/form-data`, primarily used for file uploads.
- **Scheduled Tasks:** [node-cron](https://github.com/node-cron/node-cron) - For running background jobs, such as processing the email queue and updating exam session statuses. See `cron-jobs/scheduler.ts`.

## Email System Architecture (AWS SES)

ScholarPro includes a robust, production-ready email system built on **AWS SES (Simple Email Service)** with features for template management, bulk sending, and real-time progress tracking.

### How SES is Configured

The SES client is configured in [`utils/ses-client.ts`](utils/ses-client.ts):

- **SDK Version:** Uses `@aws-sdk/client-sesv2` (AWS SDK v3)
- **Authentication:** Supports two methods:
  - **IAM Credentials:** If `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are provided in environment variables
  - **EC2 Instance Profile:** If no credentials are provided, it will use the IAM role attached to the EC2 instance (recommended for production)
- **Region:** Configurable via `AWS_REGION` environment variable (defaults to `ap-southeast-2`)

```typescript
// The client automatically handles credentials based on environment
const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || "ap-southeast-2",
  // Credentials are optional - omit them to use instance profile
});
```

### Email Template System

ScholarPro uses **SES Templates** (not raw HTML in each request) for all transactional emails:

- **Template Management:** Create, update, preview, and delete templates via the API
- **Variable Substitution:** Templates support dynamic variables like `{{applicantName}}`, `{{email}}`, `{{status}}`, etc.
- **Validation:** Only allowed variables can be used (defined in [`services/email/create-email-template.service.ts`](services/email/create-email-template.service.ts))
- **Database Sync:** Template metadata is stored in the `email_templates` table for tracking

**Allowed Template Variables:**

- Applicant info: `applicantName`, `gender`, `email`, `status`, `scholarshipPercentage`, `major`, `tuitionFee`
- Exam scheduling: `mathExamDate`, `mathStartTime`, `mathEndTime`, `mathRoom`
- English exam: `englishExamDate`, `englishStartTime`, `englishEndTime`, `englishRoom`
- Interview: `interviewExamDate`, `interviewStartTime`, `interviewEndTime`, `interviewRoom`, `interviewSlotStart`, `interviewSlotEnd`

### Email Queue & Bulk Sending

Instead of sending emails immediately (which can timeout for large batches), ScholarPro uses an **asynchronous queue system**:

1.  **Bulk Send Request:** When an admin sends bulk emails, records are inserted into the `email_sents` table with status `"pending"`
2.  **Background Processing:** A cron job ([`cron-jobs/process-email-queue.ts`](cron-jobs/process-email-queue.ts)) runs every minute and processes up to 50 pending emails
3.  **Status Tracking:** Each email is marked as `"processing"` → `"sent"` or `"failed"`
4.  **Batch Job Tracking:** Progress is tracked in the `email_batch_jobs` table (totalCount, sentCount, failedCount)

**Why this approach?**

- Prevents HTTP timeouts for large batches
- Rate limit control (50 emails/minute to avoid SES throttling)
- Reliable: Failed emails can be retried, and the system recovers gracefully from crashes
- Better observability: Full audit trail of every email

### Real-Time Progress with Server-Sent Events (SSE)

For bulk email sends, the frontend can subscribe to **real-time progress updates** via SSE:

- **How it works:** The cron job broadcasts progress events to connected clients after processing each email
- **Module:** [`utils/email-job-sse.ts`](utils/email-job-sse.ts) manages in-memory subscriptions (Map of jobId → Set of HTTP responses)
- **Endpoint:** `GET /api/v1/email/email-jobs/:jobId/events` - Opens an SSE stream
- **Payload:** Each event includes `{ jobId, totalCount, sentCount, failedCount, status, completedAt }`
- **Frontend:** Uses `EventSource` API to receive updates and show a progress bar

**SSE Event Flow:**

1. Admin triggers bulk send → API returns `jobId`
2. Frontend opens SSE connection to `/email-jobs/:jobId/events`
3. As the cron processes emails, it calls `broadcastToJob(jobId, payload)`
4. Each connected client receives the update in real-time
5. When `status === "completed"`, frontend closes the stream

See [`docs/email-queue-sse-plan.md`](docs/email-queue-sse-plan.md) and [`docs/email-job-sse-code-explained.md`](docs/email-job-sse-code-explained.md) for detailed implementation documentation.

### SES Configuration Set

The system uses an SES **Configuration Set** named `email-tracking` to:

- Track email delivery, bounces, and complaints
- Send events to CloudWatch or SNS (configured in AWS Console)
- Monitor email reputation and engagement

**Note:** This configuration set must be created in your AWS SES console before sending emails.

### Setting Up SES (AWS Console)

Before running the application, complete these AWS setup steps:

1.  **Verify Domain/Email:**
    - Go to SES > Verified Identities
    - Add and verify your sending domain or a specific email address
    - Follow DNS verification steps (add TXT/CNAME records)

2.  **Create Configuration Set:**
    - Go to SES > Configuration Sets → Create
    - Name it `email-tracking`
    - (Optional) Add event destinations for bounce/complaint tracking

3.  **Move Out of Sandbox (Production):**
    - By default, SES is in sandbox mode (can only send to verified emails)
    - Request production access via SES > Account Dashboard → Request production access
    - This allows sending to any email address

4.  **Set Up IAM Permissions:**
    - Ensure your IAM user or EC2 instance role has `ses:SendEmail` and `ses:SendTemplatedEmail` permissions

### Email Service Files Overview

- [`services/email/send-email.service.ts`](services/email/send-email.service.ts) - Send individual templated emails
- [`services/email/bulk-send-email.service.ts`](services/email/bulk-send-email.service.ts) - Queue bulk emails and create batch job
- [`services/email/create-email-template.service.ts`](services/email/create-email-template.service.ts) - Create SES template and store in DB
- [`services/email/update-email-template.service.ts`](services/email/update-email-template.service.ts) - Update existing SES template
- [`services/email/delete-email-template.service.ts`](services/email/delete-email-template.service.ts) - Delete SES template and DB record
- [`services/email/list-email-template-name.service.ts`](services/email/list-email-template-name.service.ts) - List all templates from SES
- [`services/email/preview-email-template.service.ts`](services/email/preview-email-template.service.ts) - Render template with test data
- [`cron-jobs/process-email-queue.ts`](cron-jobs/process-email-queue.ts) - Background worker that sends queued emails

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm
- PostgreSQL database
- Docker (optional, for running a local database)

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd scholarPro
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Environment Variables & RSA Keys

1. **Generate RS256 RSA Keypair** (if not already created):
   ```bash
   mkdir -p keys
   openssl genrsa -out keys/private.key 2048
   openssl rsa -in keys/private.key -pubout -out keys/public.key
   ```

2. **Create `.env` file** in `backend/`:
   ```env
   NODE_ENV=dev
   PORT=3000
   BASE_URL=http://localhost:3000
   CLIENT_URL=http://localhost:3001

   # Database (Note: Individual credentials are used, NOT DATABASE_URL)
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=scholarpro
   DB_SSL=false

   # Asymmetric RS256 JWT Keys
   JWT_PRIVATE_KEY_PATH=keys/private.key
   JWT_PUBLIC_KEY_PATH=keys/public.key

   # Uploads
   UPLOAD_DIR=public/image

   # Sentry (Optional)
   SENTRY_DSN=your-sentry-dsn

   # AWS SES (Simple Email Service)
   AWS_REGION=ap-southeast-2
   AWS_ACCESS_KEY_ID=your-aws-access-key      # Omit to use EC2 instance profile
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key  # Omit to use EC2 instance profile
   AWS_SES_FROM_EMAIL=noreply@example.com

   # Google OAuth & Telegram (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
   TELEGRAM_BOT_TOKEN=your-telegram-bot-token

   # Bakong KHQR (Optional)
   BAKONG_API_URL=https://api-bakong.nbc.org.kh
   BAKONG_API_TOKEN=your-token
   BAKONG_MERCHANT_ID=your-merchant-id
   ```

### Running the Application

- **Development:** Runs the server with hot-reloading (`ts-node-dev`).
  ```bash
  npm run dev
  ```
- **Staging:** Runs the server in a staging environment.
  ```bash
  npm run stg
  ```
- **Production:** Compile TypeScript and start the production distribution.
  ```bash
  npm run build
  node dist/index.js
  ```

### Running Tests

```bash
npm test
```

### Database Seeding

To populate the database with mock data for testing and development:

```bash
npm run db:seed
```

## Project Structure

Here is a high-level overview of the most important directories:

```
├───controllers/     # Handles request and response
├───cron-jobs/       # Scheduled background tasks
├───db/              # Database connection and schema (Drizzle ORM)
├───middleware/      # Express middleware (e.g., auth)
├───routes/          # API route definitions
├───services/        # Core business logic
├───utils/           # Shared utility functions
└───validation/      # Zod validation schemas
```
