# ScholarPro — Frontend Application

Modern web interface for the ScholarPro Scholarship Management System built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Zustand**.

---

## Portals & Route Structure

The frontend application consists of three primary route groups:

### 1. Student Portal (`app/students/`)
- `/students/login` & `/students/signup`: Student authentication (Email/Password, Google OAuth, Telegram Login).
- `/students/application`: Multi-step scholarship application submission and document upload.
- `/students/exam`: Examination hall ticket, exam dates, times, and venue assignments.
- `/students/grade`: Subject scores and overall results.
- `/students/progress`: Real-time application stage tracker (`submitted`, `screened`, `exam_scheduled`, `interview_scheduled`, `awarded`).
- `/students/profile`: Personal and educational profile management.

### 2. Administrator & Committee Portal (`app/(dashboard)/`)
- `/dashboard`: High-level metrics, applicant counts, and distribution analytics.
- `/applicant`: Applicant dossier viewer, document verification, and status management.
- `/batch`: Scholarship batch and cohort administration.
- `/schedule`: Automated and manual exam session scheduling and hall allocations.
- `/interview`: Committee interview evaluation interface with weighted scoring dimensions.
- `/score`: Gradebook and candidate ranking.
- `/communications`: AWS SES email template builder and bulk dispatch with real-time SSE progress bar.
- `/user-management`: Committee accounts and role-based permissions.
- `/setting`: Global application configurations.

### 3. Authentication Routes (`app/(auth)/`)
- `/login`: Administrator login.
- `/committee-login`: Committee member authentication and invitation acceptance.
- `/forgot-password`, `/set-forgot-password`, `/reset-password`: Self-service credential recovery.

---

## Getting Started

### Prerequisites

- Node.js `v20.x` or higher
- npm `v10.x` or higher
- Running ScholarPro Backend instance (on `http://localhost:3000`)

### Installation & Environment Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_BACKEND_URL="http://localhost:3000/api/v1"
   NEXT_PUBLIC_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
   ```

   > [!NOTE]
   > `NEXT_PUBLIC_JWT_PUBLIC_KEY` must match the public RSA key generated in `backend/keys/public.key`.

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application runs on **`http://localhost:3001`** using Turbopack.

---

## Key Architectural Concepts

### Security & Edge Gatekeeper (`proxy.ts`)
Next.js 16 edge proxy intercepts all incoming page requests:
- Redirects unauthenticated visitors attempting to access private routes to `/login`.
- Generates a per-request cryptographically secure nonce injected into the `Content-Security-Policy` header.

### Client-Side JWT Verification (`lib/utils/jwt-verify.ts`)
Uses the `jose` library to verify asymmetric RS256 JWT tokens directly in the browser using `NEXT_PUBLIC_JWT_PUBLIC_KEY`.

### API Proxy & Rewrites (`next.config.ts`)
Axios makes requests to `/api/*`, which Next.js rewrites to the configured backend (`NEXT_PUBLIC_BACKEND_URL` / `http://localhost:3000/api/v1/*`).

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Runs development server with Turbopack on port **3001** |
| `npm run build` | Compiles optimized production bundle using Next.js Turbopack |
| `npm run start` | Serves production build |
| `npm run lint` | Runs ESLint validation |
