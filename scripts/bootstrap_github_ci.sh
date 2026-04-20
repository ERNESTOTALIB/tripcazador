#!/usr/bin/env bash
# bootstrap_github_ci.sh — rellena todos los secrets de GitHub Actions + redeploy API en la VM.
#
# Ejecuta UNA vez desde Cloud Shell (tiene gcloud + acceso a la VM):
#
#   cd ~  # o donde hayas clonado tripcazador; este script no depende del cwd
#   curl -fsSL https://raw.githubusercontent.com/ERNESTOTALIB/tripcazador/main/scripts/bootstrap_github_ci.sh \
#     -o /tmp/bootstrap_github_ci.sh && bash /tmp/bootstrap_github_ci.sh
#
# Qué hace:
#   1. Pide (o detecta) un PAT de GitHub con scope "repo"
#   2. Lee /opt/tripcazador/.env en la VM vía gcloud ssh
#   3. Añade todos los API keys y tokens como Actions secrets vía la API de GitHub
#   4. Genera una SSH key dedicada si no existe y la instala en la VM + la registra como secret
#   5. Añade VPS_HOST y VPS_USER como secrets
#   6. Hace un redeploy manual del API para activar el nuevo endpoint /api/admin/deals
#   7. Dispara el workflow Worker manualmente como smoke test
#
set -euo pipefail

REPO="ERNESTOTALIB/tripcazador"
VM_NAME="tripcazador-vm"
VM_ZONE="${VM_ZONE:-us-central1-f}"    # ajusta si la zona cambió
REMOTE_ENV="/opt/tripcazador/.env"
VM_USER="${VM_USER:-$(whoami)}"
SSH_KEY_PATH="$HOME/.ssh/tripcazador_deploy"

RED="\033[0;31m"; GRN="\033[0;32m"; YLW="\033[0;33m"; NC="\033[0m"

log()  { printf "${GRN}▸${NC} %s\n" "$*"; }
warn() { printf "${YLW}⚠${NC} %s\n" "$*"; }
err()  { printf "${RED}✗${NC} %s\n" "$*" >&2; }

# ── 1. GitHub PAT ──────────────────────────────────────────────────────────
if [ -z "${GH_TOKEN:-}" ]; then
  read -rsp "Pega tu PAT de GitHub (scope: repo, workflow): " GH_TOKEN
  echo
fi
[ -z "$GH_TOKEN" ] && { err "GH_TOKEN vacío"; exit 1; }

# Sanity-check
curl -fsS -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/$REPO" > /dev/null \
  || { err "PAT inválido o sin acceso a $REPO"; exit 1; }
log "PAT válido"

# ── 2. Leer .env de la VM ──────────────────────────────────────────────────
log "Leyendo $REMOTE_ENV de $VM_NAME …"
ENV_CONTENT=$(gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" \
  --command="sudo cat $REMOTE_ENV" 2>/dev/null) || {
    err "No se pudo leer $REMOTE_ENV. ¿Existe? Si no, crea uno primero."
    exit 1
}

# Si no hay ADMIN_TOKEN, generamos uno y lo añadimos a la VM
if ! grep -q "^ADMIN_TOKEN=" <<< "$ENV_CONTENT"; then
  NEW_ADMIN=$(openssl rand -hex 32)
  log "Generando ADMIN_TOKEN nuevo y añadiéndolo al .env de la VM …"
  gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" \
    --command="echo 'ADMIN_TOKEN=$NEW_ADMIN' | sudo tee -a $REMOTE_ENV > /dev/null"
  ENV_CONTENT="$ENV_CONTENT"$'\n'"ADMIN_TOKEN=$NEW_ADMIN"
fi

# Extraer valores del .env
get_env() { grep -E "^$1=" <<< "$ENV_CONTENT" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }

declare -A SECRETS
SECRETS[KIWI_API_KEY]="$(get_env KIWI_API_KEY)"
SECRETS[SERPAPI_KEY]="$(get_env SERPAPI_KEY)"
SECRETS[RAPIDAPI_KEY]="$(get_env RAPIDAPI_KEY)"
SECRETS[TRAVELPAYOUTS_TOKEN]="$(get_env TRAVELPAYOUTS_TOKEN)"
SECRETS[TP_MARKER]="$(get_env TP_MARKER)"
SECRETS[DUFFEL_TOKEN]="$(get_env DUFFEL_TOKEN)"
SECRETS[ADMIN_TOKEN]="$(get_env ADMIN_TOKEN)"
SECRETS[TELEGRAM_BOT_TOKEN]="$(get_env TELEGRAM_BOT_TOKEN)"
SECRETS[TELEGRAM_CHAT_ID]="$(get_env TELEGRAM_CHAT_ID)"

# ── 3. SSH key dedicada para deploy ────────────────────────────────────────
if [ ! -f "$SSH_KEY_PATH" ]; then
  log "Generando SSH key dedicada en $SSH_KEY_PATH …"
  ssh-keygen -t ed25519 -C "github-actions@tripcazador" -f "$SSH_KEY_PATH" -N "" -q
  log "Subiendo pubkey a la VM …"
  PUB=$(cat "$SSH_KEY_PATH.pub")
  gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" \
    --command="grep -qF '$PUB' ~/.ssh/authorized_keys || echo '$PUB' >> ~/.ssh/authorized_keys"
fi

VM_IP=$(gcloud compute instances describe "$VM_NAME" --zone="$VM_ZONE" \
  --format="value(networkInterfaces[0].accessConfigs[0].natIP)")
SECRETS[SSH_PRIVATE_KEY]="$(cat "$SSH_KEY_PATH")"
SECRETS[VPS_HOST]="$VM_IP"
SECRETS[VPS_USER]="$VM_USER"

# Vercel token: pedirlo interactivamente si no está en env
if [ -z "${VERCEL_TOKEN:-}" ]; then
  warn "VERCEL_TOKEN no está en tu env. Genera uno nuevo en"
  warn "  https://vercel.com/account/settings/tokens"
  read -rsp "Pégalo aquí (vacío = saltar Vercel): " VERCEL_TOKEN_INPUT
  echo
  [ -n "$VERCEL_TOKEN_INPUT" ] && VERCEL_TOKEN="$VERCEL_TOKEN_INPUT"
fi
if [ -n "${VERCEL_TOKEN:-}" ]; then
  SECRETS[VERCEL_TOKEN]="$VERCEL_TOKEN"
fi

# ── 4. Subir secrets vía API de GitHub ─────────────────────────────────────
log "Obteniendo repo public key …"
PK_RESP=$(curl -fsS -H "Authorization: token $GH_TOKEN" \
  "https://api.github.com/repos/$REPO/actions/secrets/public-key")
KEY_ID=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['key_id'])" "$PK_RESP")
REPO_PUBKEY=$(python3 -c "import json,sys; print(json.loads(sys.argv[1])['key'])" "$PK_RESP")

# pynacl para encriptar
python3 -c "import nacl" 2>/dev/null || pip install --user --quiet pynacl

log "Subiendo ${#SECRETS[@]} secrets al repo …"
for name in "${!SECRETS[@]}"; do
  value="${SECRETS[$name]}"
  if [ -z "$value" ]; then
    warn "  ∘ $name vacío, lo salto"
    continue
  fi
  encrypted=$(python3 - "$REPO_PUBKEY" "$value" << 'PY'
import sys, base64
from nacl import encoding, public
pub = public.PublicKey(sys.argv[1].encode('utf-8'), encoding.Base64Encoder())
sealed = public.SealedBox(pub).encrypt(sys.argv[2].encode('utf-8'))
print(base64.b64encode(sealed).decode('utf-8'))
PY
)
  CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X PUT \
    -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/$REPO/actions/secrets/$name" \
    -d "{\"encrypted_value\":\"$encrypted\",\"key_id\":\"$KEY_ID\"}")
  case "$CODE" in
    201) log "  ✓ $name (creado)" ;;
    204) log "  ✓ $name (actualizado)" ;;
    *)   err "  ✗ $name → HTTP $CODE" ;;
  esac
done

# ── 5. Redeploy manual del API para activar /api/admin/deals ───────────────
log "Redeploy API en $VM_NAME (git pull + docker compose restart) …"
gcloud compute ssh "$VM_NAME" --zone="$VM_ZONE" --command="
  set -e
  cd /opt/tripcazador/app 2>/dev/null || cd /opt/tripcazador
  git pull origin main
  cd /opt/tripcazador
  docker compose up -d --build api || docker-compose up -d --build api
  sleep 3
  curl -sS -o /dev/null -w 'API health: HTTP %{http_code}\n' http://127.0.0.1:8000/api/health
"

# ── 6. Smoke test del Worker ───────────────────────────────────────────────
log "Disparando Worker manualmente como smoke test …"
curl -fsS -X POST -H "Authorization: token $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/actions/workflows/worker.yml/dispatches" \
  -d '{"ref":"main","inputs":{"window_start":"45","window_end":"90"}}'
log "Worker disparado. Sigue el progreso en:"
log "  https://github.com/$REPO/actions/workflows/worker.yml"

echo
log "✅ Bootstrap completo. Siguientes pasos manuales (una vez):"
echo "   1. Revoca el PAT viejo 'tripcazador-deploy' en https://github.com/settings/tokens"
echo "   2. (Opcional) revoca el PAT que acabas de usar si era temporal"
