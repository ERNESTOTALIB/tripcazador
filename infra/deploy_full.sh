#!/usr/bin/env bash
# ============================================================
# TripCazador — deploy_full.sh
# ------------------------------------------------------------
# Levanta el stack FastAPI + Postgres sobre el Caddy actual que
# ya sirve tripcazador.com. NO incluye el worker (demasiada RAM
# para e2-micro); se añade después.
#
# Precondiciones:
#   - Ejecutar como root (sudo)
#   - /opt/tripcazador/.env.prod debe existir con los secretos
#   - /opt/tripcazador/Caddyfile y /opt/tripcazador/web/index.html
#     ya están en su sitio (del primer deploy)
# ============================================================
set -euo pipefail

APP_DIR="/opt/tripcazador/app"
ENV_FILE="/opt/tripcazador/.env.prod"
CADDYFILE="/opt/tripcazador/Caddyfile"
NETWORK="tripcazador_net"

log() { echo "[deploy_full] $*"; }

[ "$EUID" -eq 0 ] || { echo "Run as root (sudo)"; exit 1; }
[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE — coloca el .env real primero"; exit 1; }
[ -d "$APP_DIR" ] || { echo "Missing $APP_DIR — clona el repo antes: git clone ... $APP_DIR"; exit 1; }

log "1/7 Docker Compose plugin"
if ! docker compose version >/dev/null 2>&1; then
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -fSL "https://github.com/docker/compose/releases/download/v2.29.7/docker-compose-linux-$(uname -m)" \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi
docker compose version

log "2/7 Red docker compartida"
docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK"

log "3/7 Caddyfile con reverse-proxy a api:8000"
cat > "$CADDYFILE" <<'CADDYEOF'
{
    email admin@tripcazador.com
}

tripcazador.com, www.tripcazador.com {
    root * /srv
    file_server
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
    @www host www.tripcazador.com
    redir @www https://tripcazador.com{uri} permanent
}

api.tripcazador.com {
    encode zstd gzip
    header {
        Strict-Transport-Security "max-age=31536000"
        Access-Control-Allow-Origin "https://tripcazador.com"
        Access-Control-Allow-Methods "GET, POST, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization"
        -Server
    }
    reverse_proxy tripcazador_api:8000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto https
    }
}
CADDYEOF

log "4/7 Conectar Caddy a la red compartida"
docker network connect "$NETWORK" tripcazador-caddy 2>/dev/null || log "  (ya conectado)"

log "5/7 Levantar stack (solo api + db, worker pendiente por RAM)"
cd "$APP_DIR"
# Override para saltar el worker y forzar la red compartida
cat > docker-compose.override.prod.yml <<OVERRIDE
services:
  db:
    container_name: tripcazador_db
    networks:
      - default
      - ${NETWORK}
  api:
    container_name: tripcazador_api
    networks:
      - default
      - ${NETWORK}
  worker:
    profiles: ["heavy"]   # no arranca a menos que pidas --profile heavy
networks:
  ${NETWORK}:
    external: true
OVERRIDE

docker compose --env-file "$ENV_FILE" -f docker-compose.yml -f docker-compose.override.prod.yml up -d --build db api

log "6/7 Reload Caddy con la nueva config"
docker exec tripcazador-caddy caddy reload --config /etc/caddy/Caddyfile || {
    log "  reload falló — reiniciando container"
    docker restart tripcazador-caddy
}

log "7/7 Verificación"
sleep 8
echo ""
echo "--- docker ps ---"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "--- curl interna ---"
docker exec tripcazador-caddy wget -qO- http://tripcazador_api:8000/api/health 2>&1 | head -3 || true
echo ""
echo "--- curl pública ---"
curl -sS https://api.tripcazador.com/health || true
echo ""
log "Deploy hecho. Si /health devuelve JSON del FastAPI real (no el placeholder), todo OK."
log "Worker: correr 'docker compose --env-file $ENV_FILE --profile heavy up -d worker' si hay RAM."
