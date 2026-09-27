# AGENTS.md

ScholarPro is a scholarship management system. Two independent apps, **no root package.json / npm workspace / docker-compose** — install and run everything from inside `backend/` or `frontend/`.

`backend/README.md` is the authoritative architecture doc: request flow (routes → controllers → services → Drizzle schema) and the SES email queue design. Its env var list is stale — the code reads `DB_*` creds and RSA key files, not `DATABASE_URL` / `JWT_*_SECRET` (see Env below).

## Backend (`backend/`, Express + TypeScript)

- **Run:** `npm run dev` (hot reload, `NODE_ENV=dev`; server on port 3000, API mounted at `/api/v1`). Also `npm run stg` / `npm run pro`. There is no `start` script — prod runs `node dist/index.js` after `build`.
- **Tests:** `npm test` (Jest unit tests, mocks for `@db` and `uuid`, no DB needed). Single test: `npx jest tests/services/auth/login.service.test.ts`. CI runs `npm test -- --runInBand --passWithNoTests`.
- **Lint:** `npx eslint .` (type-aware flat config `eslint.config.mts`).
- **Build:** `npm run build` = `tsc` + Sentry sourcemap upload + `tsc-alias`. The `sentry:sourcemaps` step runs unconditionally and fails without `SENTRY_AUTH_TOKEN` — the Docker build guards it, the bare npm script does not.
- **DB:** `npm run db:generate`, `db:migrate`, `db:seed`. Migrations live in `backend/drizzle/` (generated, committed). `db:seed` runs `scripts/seed/generate-mock-data.ts`, which is **gitignored** (exists locally, not in git) — expect it to be missing on a fresh clone.
- **Env:** dotenv loads `.env.${NODE_ENV || "dev"}` then `.env` (so dev reads `.env.dev`). `.env*` is gitignored; there is no committed `.env.example` — the key list is in `backend/README.md`. DB creds are `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` (no `DATABASE_URL` in code — the README still shows the old one). JWT signing/verification uses RSA PEM files at paths from `JWT_PRIVATE_KEY_PATH` / `JWT_PUBLIC_KEY_PATH` (untracked `backend/keys/`, gitignored).
- **Imports:** always use tsconfig path aliases — `@routes/*`, `@controllers/*`, `@services/*`, `@middleware/*`, `@utils/*`, `@validation/*`, `@db`, `@db/schema/...`. They work at runtime via `tsconfig-paths` and in Jest via `jest.config.js` mappers.
- **Style:** controllers/services intentionally mix class-based and functional styles (call out in `backend/README.md`); mirror the file you're editing.
- **Cron jobs auto-start on server boot** (`index.ts` imports `cron-jobs/scheduler.ts`): email queue every minute, exam-session status every 10 min, token renewer. Note `process-email-queue` writes to AWS SES.
- Global rate limit 1200/5 min; `/api/v1/auth` is limited to 20/15 min.
- Quirk: `utils/logger.ts` sets `isProd = NODE_ENV === "dev"` and silences the console transport when true — console logs disappear in `npm run dev` (only file logs remain).

## Frontend (`frontend/`, Next.js 16 App Router)

- **Package manager is npm.** Both `package-lock.json` and `pnpm-lock.yaml` are committed, but CI, Dockerfile, and `packageManager: npm@10` all use npm — never touch `pnpm-lock.yaml`.
- **Run:** `npm run dev` — `next dev -p 3001 --turbopack`. Dev server is on **port 3001**; the script disables TLS verification (`NODE_TLS_REJECT_UNAUTHORIZED=0`).
- **Build:** `npm run build` uses `--turbopack`. `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_JWT_PUBLIC_KEY` are baked in at build time (passed as Docker build args).
- **Lint:** `npm run lint` (eslint + prettier via lint-staged on commit). **No test suite.**
- **Next 16 middleware lives in root `proxy.ts`** (Next renamed `middleware.ts` → `proxy.ts` in v16). It enforces auth redirects and injects a per-request CSP nonce (`x-nonce`) with hardcoded prod hostnames (`projectesting.site`) in `connect-src`. The matcher excludes `/api`, `_next/static`, images/assets.
- **API wiring:** `api/api.ts` axios client uses `baseURL: "/api"` with `withCredentials`; `next.config.ts` rewrites `/api/:path*` to `NEXT_PUBLIC_BACKEND_URL || http://localhost:3000/api/v1`. On 401 it refreshes via the HttpOnly `refreshToken` cookie.
- **Auth:** the browser JWTs are verified client-side with `NEXT_PUBLIC_JWT_PUBLIC_KEY` (`lib/utils/jwt-verify.ts`), which must match the backend key pair. Unset key throws at runtime.
- Duplicate/near-duplicate utils exist (`lib/utils/helper.ts` vs `help.ts`, `sanitize.ts` vs `sanitizer.ts`) — grep before adding a new one.

## CI / deploy

- `.github/workflows/ci-cd.yml` runs on push/PR to `main`/`dev`: backend lint + tests, frontend lint + build, then (push only) Docker build/push to GHCR and SSH deploy via `scripts/deploy.sh`. Deploy is skipped when `DEPLOY_HOST`/`DEPLOY_USER` secrets are unset. `main` → production, `dev` → staging.
- `scripts/deploy.sh`: pulls GHCR images and runs `scholarpro-backend` (`node dist/index.js`, port 3000) and `scholarpro-frontend` (`npm start`, port 3000 in-container) on a shared `scholarpro` Docker network.
- `infrastructure/terraform/` is an alternative GCP Cloud Run deploy path (not wired into CI). `monitoring/promtail-config.yaml` configures Loki log scraping.
- The two `*.patch` files at repo root are historical security-fix artifacts — leave them alone.