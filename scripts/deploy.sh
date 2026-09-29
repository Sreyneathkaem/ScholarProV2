#!/usr/bin/env bash
set -euo pipefail

APP_ENV="${APP_ENV:-staging}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
GHCR_OWNER="${GHCR_OWNER,,}"
GITHUB_ACTOR="${GITHUB_ACTOR:-github-actions[bot]}"

if [[ "$APP_ENV" != "production" && "$APP_ENV" != "staging" ]]; then
  echo "APP_ENV must be production or staging."
  exit 1
fi

BACKEND_ENV_FILE="/etc/scholarpro/${APP_ENV}/backend.env"
JWT_KEYS_DIR="/etc/scholarpro/${APP_ENV}/keys"
PROXY_ENV_FILE="/etc/scholarpro/${APP_ENV}/proxy.env"
CADDYFILE="/etc/scholarpro/${APP_ENV}/Caddyfile"
UPLOADED_CADDYFILE="/tmp/Caddyfile.${APP_ENV}"
CADDY_IMAGE="caddy:2-alpine"

BACKEND_IMAGE="ghcr.io/${GHCR_OWNER}/scholarpro-backend:${IMAGE_TAG}"
MIGRATION_IMAGE="ghcr.io/${GHCR_OWNER}/scholarpro-backend-migrator:${IMAGE_TAG}"
FRONTEND_IMAGE="ghcr.io/${GHCR_OWNER}/scholarpro-frontend:${IMAGE_TAG}"

if [ -z "$GHCR_OWNER" ]; then
  echo "GHCR_OWNER is required."
  exit 1
fi

if [ ! -r "$BACKEND_ENV_FILE" ]; then
  echo "Backend environment file is missing or unreadable: $BACKEND_ENV_FILE"
  exit 1
fi

for required_variable in DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME; do
  if ! grep -Eq "^[[:space:]]*${required_variable}=[[:space:]]*[^[:space:]]" "$BACKEND_ENV_FILE"; then
    echo "Required backend setting ${required_variable} is missing or empty in $BACKEND_ENV_FILE"
    exit 1
  fi
done

if [ ! -r "$JWT_KEYS_DIR/private.key" ] || [ ! -r "$JWT_KEYS_DIR/public.key" ]; then
  echo "JWT private/public key files are missing or unreadable in $JWT_KEYS_DIR"
  exit 1
fi

if [ ! -r "$PROXY_ENV_FILE" ] || [ ! -r "$UPLOADED_CADDYFILE" ]; then
  echo "Proxy environment file or Caddyfile is missing."
  exit 1
fi

install -m 644 "$UPLOADED_CADDYFILE" "$CADDYFILE"

APP_DOMAIN="$(sed -n 's/^APP_DOMAIN=//p' "$PROXY_ENV_FILE" | head -n 1)"
API_DOMAIN="$(sed -n 's/^API_DOMAIN=//p' "$PROXY_ENV_FILE" | head -n 1)"
if [ -z "$APP_DOMAIN" ] || [ -z "$API_DOMAIN" ] || [ "$APP_DOMAIN" = "$API_DOMAIN" ]; then
  echo "proxy.env must define distinct APP_DOMAIN and API_DOMAIN values."
  exit 1
fi

docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
cleanup() {
  docker logout ghcr.io >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker pull "$BACKEND_IMAGE"
docker pull "$MIGRATION_IMAGE"
docker pull "$FRONTEND_IMAGE"
docker pull "$CADDY_IMAGE"

docker run --rm \
  --env-file "$PROXY_ENV_FILE" \
  -v "$CADDYFILE:/etc/caddy/Caddyfile:ro" \
  "$CADDY_IMAGE" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

docker network inspect scholarpro >/dev/null 2>&1 || docker network create scholarpro

docker run --rm \
  --network scholarpro \
  --env-file "$BACKEND_ENV_FILE" \
  -e NODE_ENV=production \
  -v "$JWT_KEYS_DIR:/run/secrets:ro" \
  "$MIGRATION_IMAGE"

docker rm -f scholarpro-backend scholarpro-frontend scholarpro-caddy >/dev/null 2>&1 || true

docker run -d \
  --name scholarpro-backend \
  --network scholarpro \
  -p 127.0.0.1:3000:3000 \
  --restart unless-stopped \
  --env-file "$BACKEND_ENV_FILE" \
  -e NODE_ENV=production \
  -e JWT_PRIVATE_KEY_PATH=/run/secrets/private.key \
  -e JWT_PUBLIC_KEY_PATH=/run/secrets/public.key \
  -v "$JWT_KEYS_DIR:/run/secrets:ro" \
  "$BACKEND_IMAGE"

docker run -d \
  --name scholarpro-frontend \
  --network scholarpro \
  -p 127.0.0.1:3001:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  "$FRONTEND_IMAGE"

docker run -d \
  --name scholarpro-caddy \
  --network scholarpro \
  -p 80:80 \
  -p 443:443 \
  -p 443:443/udp \
  --restart unless-stopped \
  --env-file "$PROXY_ENV_FILE" \
  --health-cmd "wget -q -O /dev/null http://127.0.0.1:2019/config/ || exit 1" \
  --health-interval 10s \
  --health-timeout 3s \
  --health-start-period 10s \
  --health-retries 6 \
  -v "$CADDYFILE:/etc/caddy/Caddyfile:ro" \
  -v scholarpro-caddy-data:/data \
  -v scholarpro-caddy-config:/config \
  "$CADDY_IMAGE"

for container in scholarpro-backend scholarpro-frontend scholarpro-caddy; do
  for attempt in {1..30}; do
    health="$(docker inspect --format='{{.State.Health.Status}}' "$container")"
    if [ "$health" = "healthy" ]; then
      break
    fi
    if [ "$health" = "unhealthy" ] || [ "$attempt" -eq 30 ]; then
      docker logs "$container" || true
      echo "$container did not become healthy."
      exit 1
    fi
    sleep 2
  done
done

printf '\nDeployment completed successfully.\n'
printf 'Frontend: https://%s (healthy)\n' "$APP_DOMAIN"
printf 'Backend: https://%s (healthy)\n' "$API_DOMAIN"
