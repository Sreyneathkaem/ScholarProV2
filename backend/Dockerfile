# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (required for build steps like tsc and sentry-cli)
RUN npm ci

# Define build arguments
ARG NODE_ENV=production

# Set environment variables for the build process ONLY
ENV NODE_ENV=$NODE_ENV

# Copy source code and perform build
COPY . .

# Sourcemap upload to Sentry needs a real auth token. If one isn't provided
# (e.g. the SENTRY_AUTH_TOKEN secret isn't configured yet), skip that step
# instead of failing the whole image build over a non-essential upload.
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null | tr -d '[:space:]' || true) && \
    npx tsc && \
    if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
      npm run sentry:sourcemaps; \
    else \
      echo "SENTRY_AUTH_TOKEN not provided — skipping Sentry sourcemap upload."; \
    fi && \
    npx tsc-alias

# Run schema migrations from a short-lived image containing the build toolchain.
FROM builder AS migrator
CMD ["npm", "run", "db:migrate"]

# Stage 2: Create the final production image
FROM node:20-alpine AS runtime

WORKDIR /app

# Set runtime environment
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy only the compiled code from the builder stage
COPY --from=builder /app/dist ./dist

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:3000/home').then((response) => process.exit(response.status < 500 ? 0 : 1)).catch(() => process.exit(1))"

# SENTRY_AUTH_TOKEN is not defined here, so it won't leak in image metadata
# Ports
EXPOSE 3000

# Production-ready execution
CMD ["node", "dist/index.js"]