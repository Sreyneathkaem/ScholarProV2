# Production Deployment

Production deployment uses the `main` branch and the `production` GitHub environment. The `dev` branch uses the `staging` environment. A push builds and publishes backend, migration-runner, and frontend images, then deploys the exact commit SHA over SSH.

## GitHub Environment Configuration

Create `production` and `staging` environments in the repository settings. Add these environment variables to each environment:

- `NEXT_PUBLIC_BACKEND_URL`: HTTPS API base URL including `/api/v1`, for example `https://api.example.com/api/v1`.
- `NEXT_PUBLIC_JWT_PUBLIC_KEY`: backend RS256 public key in PEM format. It may be stored with literal `\n` line breaks. These are public browser build values, not credentials.

Add these secrets to each environment:
- `DEPLOY_HOST`, `DEPLOY_USER`, and optional `DEPLOY_PORT` (defaults to `22`).
- `DEPLOY_SSH_PRIVATE_KEY`: private key used by GitHub Actions to connect to the deployment host.
- `DEPLOY_KNOWN_HOSTS`: the verified SSH host-key entry for that host and port. Do not disable host-key checking.

Configure production environment reviewers/approval rules before allowing production deployment. Ensure the GitHub Actions token can read the repository's GHCR packages.

## Deployment Host

Install Docker, allow the deployment user to run Docker, and create the environment directory writable by that user. Prepare these files/directories for production:

```text
/etc/scholarpro/production/backend.env
/etc/scholarpro/production/proxy.env
/etc/scholarpro/production/Caddyfile
/etc/scholarpro/production/keys/private.key
/etc/scholarpro/production/keys/public.key
```

For staging, use the same layout under `/etc/scholarpro/staging/`. Set directory permissions so the deployment user can install the Caddyfile and Docker can read the mounted configuration. Restrict `backend.env` and key permissions; do not copy credentials into the repository or image. Set `JWT_PRIVATE_KEY_PATH=/run/secrets/private.key` and `JWT_PUBLIC_KEY_PATH=/run/secrets/public.key` in `backend.env`. The backend also requires `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. Configure applicable `AWS_REGION`, `AWS_SES_FROM_EMAIL`, Google OAuth, Telegram, `CLIENT_URL`, and Sentry settings there as appropriate. Use a host IAM role for SES where available.

The backend environment file requires `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`. Set `DB_SSL=true` when the production PostgreSQL service requires TLS; certificate verification remains enabled. Set it to `false` only when the database is explicitly configured for plaintext connections.

Configure applicable `AWS_REGION` and `AWS_SES_FROM_EMAIL`; provide `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` only when a host IAM role is unavailable. SES needs a verified sender, production sending access, and the `email-tracking` configuration set. Google OAuth uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`; Telegram uses `TELEGRAM_BOT_TOKEN`. Set `CLIENT_URL` to the frontend origin and `SENTRY_DSN` when Sentry is enabled.

The host must be able to reach PostgreSQL and the public URLs configured for the frontend. The deployment runs database migrations before replacing the containers. Back up the production database and review pending migrations before pushing to `main`; migrations must be backward-compatible with the currently running app during rollout.

## HTTPS and PostgreSQL

The SSH deployment runs Caddy as the public reverse proxy. Create `/etc/scholarpro/production/proxy.env` (and the staging equivalent) with distinct `APP_DOMAIN` and `API_DOMAIN` hostnames. Point both DNS A records at the deployment host and allow inbound TCP ports 80 and 443; Caddy obtains and renews TLS certificates automatically. The host must permit Caddy to bind those ports. Set `CLIENT_URL` to `https://<APP_DOMAIN>`, `GOOGLE_REDIRECT_URI` to `https://<API_DOMAIN>/api/v1/auth/google/callback`, and the frontend `NEXT_PUBLIC_BACKEND_URL` to `https://<API_DOMAIN>/api/v1`.

The proxy environment file should contain only the app and API DNS names:

```dotenv
APP_DOMAIN=app.example.com
API_DOMAIN=api.example.com
```

Create DNS A records for both names pointing at the VM's static public IP. Allow inbound TCP 80 and 443 (and optionally UDP 443 for HTTP/3) in both the cloud firewall and host firewall. The deployment validates the Caddyfile, mounts persistent certificate storage, and binds the app containers only to loopback. Caddy obtains and renews public certificates automatically. Set `CLIENT_URL` to `https://<APP_DOMAIN>`, `GOOGLE_REDIRECT_URI` to `https://<API_DOMAIN>/api/v1/auth/google/callback`, and the frontend `NEXT_PUBLIC_BACKEND_URL` to `https://<API_DOMAIN>/api/v1`.

The GCP Terraform adds an opt-in Cloud SQL PostgreSQL instance; it is disabled by default and is not created by the application workflow. To use it, explicitly set `enable_managed_database=true`, provide the host's static IPv4 egress address as a single `/32` `database_authorized_network_cidr`, choose the database tier/availability, and provide `database_password` through a secure Terraform variable source. Set the GCP project and region as well. Review the plan and cost before applying. Cloud SQL enforces TLS, enables backups and point-in-time recovery, and has deletion protection. Terraform state contains the database password, so store state remotely with restricted access.

Use the resulting `managed_database_public_ip` as `DB_HOST`, port `5432`, and set `DB_SSL=true`. Copy the Cloud SQL server CA certificate to `/etc/scholarpro/production/keys/server-ca.pem` and set `DB_SSL_CA_PATH=/run/secrets/server-ca.pem` in `backend.env`; the entire keys directory is mounted read-only into the app and migration containers. Set `DB_NAME` and `DB_USER` from the Terraform inputs and use the same password supplied to Terraform. Keep the authorized network limited to the deployment host.

## Deploy and Verify

Push the intended commit to `dev` first and verify staging. After approval, push or merge that commit to `main`. The workflow fails rather than silently skipping when frontend or SSH configuration is missing. It logs into GHCR for the image pull, runs migrations, starts the backend and frontend containers, and waits for both health checks.

Verify the public frontend and API over HTTPS, then test login, applicant/committee pages, schedules, invitations, and email delivery. Check GitHub Actions output and host container logs. SES must have a verified sender and production sending access; Google OAuth redirect URLs must match the production callback URL.