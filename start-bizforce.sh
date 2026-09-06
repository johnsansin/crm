#!/usr/bin/env bash
#
# start-bizforce.sh — Start the BizForce CRM stack after a machine reboot.
#
# Prereqs assumed already configured (survive reboots, checked/enforced here):
#   • docker + containerd enabled at boot (systemctl is-enabled)
#   • repo at /tmp/opencode/crm on persistent disk, .env present
#   • all app services use `restart: unless-stopped`
#
# Behavior:
#   1. Wait for the Docker daemon to become available.
#   2. Optionally build (default OFF; add   --build   to rebuild backend+frontend).
#   3. Bring the stack up in dependency order.
#   4. Wait for container health + HTTP endpoints.
#   5. Re-generate certs if none present; reload nginx; trigger a certbot renew line if cron missing.
#
set -euo pipefail

PROJECT="${BIZFORCE_PROJECT:-/tmp/opencode/crm}"
COMPOSE_FILE="$PROJECT/compose.yaml"
APP_ORIGIN="https://bizforce-crm.online"
DO_BUILD=0
for a in "$@"; do [ "$a" = "--build" ] && DO_BUILD=1; done

log()  { printf '[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
die()  { log "FATAL: $*"; exit 1; }

log "BizForce CRM startup"

[ -f "$COMPOSE_FILE" ]       || die "compose.yaml not found at $COMPOSE_FILE"
[ -f "$PROJECT/.env" ]       || die ".env not found at $PROJECT/.env"
command -v docker >/dev/null || die "docker binary not found"

# 1. Ensure Docker engine is up (it should auto-start at boot via systemd).
for i in $(seq 1 60); do
  if docker info >/dev/null 2>&1; then log "Docker daemon ready"; break; fi
  if [ "$i" -eq 60 ]; then die "Docker daemon did not become ready in 60s"; fi
  sleep 2
done

cd "$PROJECT"

# 2. (Optional) rebuild images.
if [ "$DO_BUILD" = "1" ]; then
  log "Building backend + frontend images (no-cache)..."
  docker compose -f "$COMPOSE_FILE" build --no-cache backend frontend
fi

# 3. Bring services up in dependency order (database, then the rest).
log "Starting database..."
docker compose -f "$COMPOSE_FILE" up -d database
log "Waiting for database health..."
for i in $(seq 1 60); do
  st=$(docker inspect --format '{{.State.Health.Status}}' bizforce-crm-database-1 2>/dev/null || echo starting)
  [ "$st" = "healthy" ] && { log "Database healthy"; break; }
  [ "$i" = 60 ] && die "database did not become healthy"
  sleep 2
done

log "Starting backend..."
docker compose -f "$COMPOSE_FILE" up -d backend
log "Starting frontend..."
docker compose -f "$COMPOSE_FILE" up -d frontend
log "Starting nginx..."
docker compose -f "$COMPOSE_FILE" up -d nginx

# 4. Wait for HTTP endpoints.
log "Waiting for application endpoints..."
for i in $(seq 1 90); do
  ok=1
  for p in / /api/health; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$APP_ORIGIN$p" 2>/dev/null || echo 000)
    [ "$code" = "200" ] || ok=0
  done
  [ "$ok" = 1 ] && { log "Application is UP ($APP_ORIGIN)"; break; }
  [ "$i" = 90 ] && die "application did not return 200 on all endpoints within 90s"
  sleep 2
done

# 5. Certificates: bootstrap certs if missing, otherwise reload nginx to pick up.
#    Daily renewal is handled by cron; here we just make nginx serve current certs.
#    The certs tree is root-owned, so probe for the cert through the running nginx
#    container (which already mounts /etc/letsencrypt read/write as root).
cert_exists() {
  docker exec bizforce-crm-nginx-1 \
    sh -c 'test -f /etc/letsencrypt/live/bizforce-crm.online/fullchain.pem' 2>/dev/null
}
if cert_exists; then
  log "TLS certificates present."
else
  log "No TLS cert found — requesting a new certificate (webserver must be reachable)..."
  docker compose -f "$COMPOSE_FILE" run --rm certbot \
    certonly --webroot --webroot-path=/var/www/certbot \
    -d bizforce-crm.online -d www.bizforce-crm.online --email sajjad@bizforce-crm.online \
    --agree-tos --no-eff-email || log "WARN: initial certificate request failed"
fi
docker exec bizforce-crm-nginx-1 nginx -s reload >/dev/null 2>&1 || log "WARN: nginx reload skipped"

# 6. Ensure the daily certbot renewal cron entry exists.
CRON="0 3 * * * docker run --rm -v $PROJECT/certs:/etc/letsencrypt -v $PROJECT/certbot-www:/var/www/certbot certbot/certbot renew --quiet"
if ! (crontab -l 2>/dev/null | grep -qF "$PROJECT/certs:/etc/letsencrypt"); then
  ( crontab -l 2>/dev/null; echo "$CRON" ) | crontab -
  log "Added certbot renewal cron"
fi

log "Final status:"
docker ps --filter name=bizforce-crm --format '  {{.Names}}: {{.Status}}'
log "Done — BizForce CRM is running at $APP_ORIGIN"
