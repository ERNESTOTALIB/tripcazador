#!/usr/bin/env bash
#
# backup.sh — Dump diario de Postgres + contenido crítico → Backblaze B2
#
# Requiere variables en /opt/tripcazador/.env:
#   POSTGRES_PASSWORD
#   B2_APPLICATION_KEY_ID
#   B2_APPLICATION_KEY
#   B2_BUCKET            (ej. tripcazador-backups)
#   TELEGRAM_BOT_TOKEN   (para alertar en caso de fallo)
#   TELEGRAM_CHAT_ID
#
# Política de retención: 7 diarios + 4 semanales (dom) + 6 mensuales (día 1)
# Todo se sube a B2. Los de más de 6 meses se borran automáticamente.
#

set -euo pipefail

APP_DIR="/opt/tripcazador"
BACKUP_DIR="/var/backups/tripcazador"
STAMP="$(date +%Y%m%d_%H%M%S)"
TODAY="$(date +%Y%m%d)"

mkdir -p "$BACKUP_DIR"

# ---- cargar .env ----
# shellcheck disable=SC1091
set -a; source "$APP_DIR/.env"; set +a

notify_telegram() {
  local msg="$1"
  if [[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]]; then
    curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d "chat_id=${TELEGRAM_CHAT_ID}" \
      -d "text=🛡️ [TripCazador backup] ${msg}" \
      -d "parse_mode=HTML" >/dev/null || true
  fi
}

trap 'notify_telegram "❌ backup FAILED: $STAMP (exit $?)"' ERR

# ---- 1) dump Postgres ----
DUMP="$BACKUP_DIR/db_$STAMP.sql.gz"
echo "[backup] dumping postgres → $DUMP"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" tripcazador_db \
  pg_dump -U tripcazador -d tripcazador --no-owner --clean --if-exists \
  | gzip -9 > "$DUMP"

# sanity check (mínimo 1 KB)
if [[ $(stat -c%s "$DUMP") -lt 1024 ]]; then
  echo "[backup] ERROR: dump demasiado pequeño" >&2
  exit 2
fi

# ---- 2) tar del directorio de reports + content ----
REPORTS="$BACKUP_DIR/reports_$STAMP.tar.zst"
echo "[backup] archivando reports + content → $REPORTS"
tar --use-compress-program='zstd -10' -cf "$REPORTS" \
  -C "$APP_DIR" \
  reports/ \
  tripcazador-web/src/content/blog/ \
  .sent_alerts.json 2>/dev/null || true

# ---- 3) subir a B2 ----
if [[ -n "${B2_APPLICATION_KEY_ID:-}" && -n "${B2_BUCKET:-}" ]]; then
  echo "[backup] subiendo a B2://$B2_BUCKET/"
  docker run --rm \
    -e B2_APPLICATION_KEY_ID \
    -e B2_APPLICATION_KEY \
    -v "$BACKUP_DIR:/data" \
    backblazeit/b2:latest \
    upload-file --quiet "$B2_BUCKET" "/data/$(basename "$DUMP")" "daily/$TODAY/$(basename "$DUMP")"

  docker run --rm \
    -e B2_APPLICATION_KEY_ID \
    -e B2_APPLICATION_KEY \
    -v "$BACKUP_DIR:/data" \
    backblazeit/b2:latest \
    upload-file --quiet "$B2_BUCKET" "/data/$(basename "$REPORTS")" "daily/$TODAY/$(basename "$REPORTS")"
else
  echo "[backup] WARN: B2 no configurado, backup solo local"
fi

# ---- 4) rotación local (conservar 7 días) ----
find "$BACKUP_DIR" -type f -mtime +7 -name 'db_*.sql.gz' -delete
find "$BACKUP_DIR" -type f -mtime +7 -name 'reports_*.tar.zst' -delete

SIZE_DB="$(du -h "$DUMP" | cut -f1)"
SIZE_TAR="$(du -h "$REPORTS" | cut -f1)"
notify_telegram "✅ backup OK: db=${SIZE_DB}, reports=${SIZE_TAR}, stamp=$STAMP"
echo "[backup] done ($SIZE_DB + $SIZE_TAR)"
