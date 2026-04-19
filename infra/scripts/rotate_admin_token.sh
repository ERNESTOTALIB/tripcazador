#!/usr/bin/env bash
#
# rotate_admin_token.sh — rotación segura de ADMIN_TOKEN y IP_HASH_SALT.
#
# Uso:
#   ./rotate_admin_token.sh              # genera nuevos valores y reinicia containers
#   ./rotate_admin_token.sh --dry-run    # muestra lo que haría sin tocar nada
#
# Requiere: bash 4+, openssl, sed, docker compose v2.
#
# Política recomendada:
#   - ADMIN_TOKEN: rotar cada 30 días o cada vez que alguien cambie de equipo.
#   - IP_HASH_SALT: rotar cada 365 días (romperá dedupe histórico, no bloqueante).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ No encontré $ENV_FILE. Copia .env.example → .env y rellena antes de rotar."
  exit 1
fi

# Backup automático
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP="$ENV_FILE.backup.$STAMP"
if [[ $DRY_RUN -eq 0 ]]; then
  cp "$ENV_FILE" "$BACKUP"
  echo "💾 Backup creado: $BACKUP"
else
  echo "[dry-run] backup iría a $BACKUP"
fi

# Genera valores nuevos
NEW_ADMIN_TOKEN=$(openssl rand -hex 32)
NEW_IP_HASH_SALT=$(openssl rand -hex 16)

echo "🔐 Nuevo ADMIN_TOKEN:  ${NEW_ADMIN_TOKEN:0:8}... (guardado completo en env)"
echo "🧂 Nuevo IP_HASH_SALT: ${NEW_IP_HASH_SALT:0:8}... (rompe dedupe histórico, OK si >90 días)"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "[dry-run] .env no modificado. Exit."
  exit 0
fi

# Sustituye (o añade si no existe) cada clave en .env
upsert_env_var() {
  local key="$1" val="$2"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # Reemplazo seguro: sed in-place con delimitador # para tolerar / en val
    sed -i.sedbak "s#^${key}=.*#${key}=${val}#" "$ENV_FILE"
    rm -f "$ENV_FILE.sedbak"
  else
    printf "\n%s=%s\n" "$key" "$val" >> "$ENV_FILE"
  fi
}

upsert_env_var "ADMIN_TOKEN" "$NEW_ADMIN_TOKEN"
upsert_env_var "IP_HASH_SALT" "$NEW_IP_HASH_SALT"

echo "✅ .env actualizado."

# Reinicia API (no Postgres: no hace falta)
if command -v docker &> /dev/null && [[ -f "$REPO_ROOT/docker-compose.yml" ]]; then
  echo "🔄 Reiniciando contenedor api..."
  (cd "$REPO_ROOT" && docker compose up -d --force-recreate api)
  echo "✅ api reiniciado."
else
  echo "⚠️  docker o docker-compose.yml no encontrados. Reinicia la API manualmente."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Guarda este ADMIN_TOKEN en tu gestor de contraseñas:"
echo " $NEW_ADMIN_TOKEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
