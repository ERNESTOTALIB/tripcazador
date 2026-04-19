#!/usr/bin/env bash
#
# restore.sh — Restaura un dump de Postgres desde un archivo local o B2
#
# Uso:
#   ./restore.sh local /path/to/db_STAMP.sql.gz
#   ./restore.sh b2    daily/20260418/db_20260418_040000.sql.gz
#
# IMPORTANTE: detiene el stack antes y lo levanta al terminar. Confirma doble.
#

set -euo pipefail

SOURCE_TYPE="${1:-}"
SOURCE_PATH="${2:-}"

if [[ -z "$SOURCE_TYPE" || -z "$SOURCE_PATH" ]]; then
  echo "uso: $0 local|b2 <ruta>"
  exit 1
fi

APP_DIR="/opt/tripcazador"
set -a; source "$APP_DIR/.env"; set +a

echo "⚠️  Vas a RESTAURAR la base de datos. Esto BORRA los datos actuales."
read -r -p "Escribe YES en mayúsculas para continuar: " confirm
if [[ "$confirm" != "YES" ]]; then
  echo "cancelado"
  exit 0
fi

TMP="$(mktemp --suffix=.sql.gz)"
trap 'rm -f "$TMP"' EXIT

case "$SOURCE_TYPE" in
  local)
    cp "$SOURCE_PATH" "$TMP"
    ;;
  b2)
    docker run --rm \
      -e B2_APPLICATION_KEY_ID \
      -e B2_APPLICATION_KEY \
      -v "$(dirname "$TMP"):/out" \
      backblazeit/b2:latest \
      download-file-by-name --quiet "$B2_BUCKET" "$SOURCE_PATH" "/out/$(basename "$TMP")"
    ;;
  *)
    echo "tipo inválido: $SOURCE_TYPE"
    exit 1
    ;;
esac

echo "[restore] deteniendo servicios..."
systemctl stop tripcazador

echo "[restore] arrancando SOLO la db..."
cd "$APP_DIR"
docker compose up -d db
sleep 5

echo "[restore] restaurando dump..."
gunzip -c "$TMP" | docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" tripcazador_db \
  psql -U tripcazador -d tripcazador

echo "[restore] reiniciando stack completo..."
systemctl start tripcazador

echo "[restore] done"
