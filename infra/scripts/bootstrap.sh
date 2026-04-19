#!/usr/bin/env bash
#
# bootstrap.sh — Provisiona una VM Ubuntu 24.04 (ARM64) para TripCazador
# Ejecutar UNA SOLA VEZ tras crear la instancia en Oracle Cloud Always Free.
#
# Instala: Docker, Docker Compose plugin, Caddy (reverse proxy + SSL auto),
#          UFW (firewall), fail2ban (brute-force protection), b2-cli (backups),
#          systemd unit que orquesta docker-compose.
#
# Uso:
#   sudo bash bootstrap.sh
#

set -euo pipefail

# ---- variables ----
REPO_URL="${REPO_URL:-https://github.com/tripcazador/tripcazador.git}"
APP_DIR="/opt/tripcazador"
DOMAIN="${DOMAIN:-tripcazador.com}"
API_DOMAIN="${API_DOMAIN:-api.tripcazador.com}"
EMAIL_LETSENCRYPT="${EMAIL_LETSENCRYPT:-admin@tripcazador.com}"
USER_NAME="${SUDO_USER:-ubuntu}"

log() { echo -e "\033[1;32m[bootstrap]\033[0m $*"; }
err() { echo -e "\033[1;31m[bootstrap]\033[0m $*" >&2; }

if [[ $EUID -ne 0 ]]; then
  err "Este script debe ejecutarse como root (sudo)"
  exit 1
fi

# ---- 1. actualizar sistema ----
log "Actualizando paquetes..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y \
  curl wget git unzip jq ca-certificates gnupg lsb-release \
  ufw fail2ban unattended-upgrades \
  python3 python3-pip \
  htop ncdu

# ---- 2. firewall (UFW) ----
log "Configurando UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ---- 3. fail2ban ----
log "Activando fail2ban (jail SSH)..."
systemctl enable --now fail2ban

# ---- 4. actualizaciones automáticas de seguridad ----
log "Activando unattended-upgrades..."
dpkg-reconfigure -plow unattended-upgrades || true

# ---- 5. Docker ----
if ! command -v docker &>/dev/null; then
  log "Instalando Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  usermod -aG docker "$USER_NAME"
  systemctl enable --now docker
else
  log "Docker ya instalado, saltando"
fi

# ---- 6. Caddy (reverse proxy con SSL automático) ----
if ! command -v caddy &>/dev/null; then
  log "Instalando Caddy..."
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y
  apt-get install -y caddy
else
  log "Caddy ya instalado, saltando"
fi

# ---- 7. clonar el repo ----
if [[ ! -d "$APP_DIR" ]]; then
  log "Clonando repo en $APP_DIR..."
  git clone "$REPO_URL" "$APP_DIR"
  chown -R "$USER_NAME:$USER_NAME" "$APP_DIR"
else
  log "Repo ya existe en $APP_DIR, haciendo pull..."
  cd "$APP_DIR" && sudo -u "$USER_NAME" git pull --ff-only
fi

# ---- 8. Caddyfile ----
log "Configurando Caddy ($DOMAIN + $API_DOMAIN)..."
cp "$APP_DIR/infra/caddy/Caddyfile" /etc/caddy/Caddyfile
sed -i "s|{{DOMAIN}}|$DOMAIN|g" /etc/caddy/Caddyfile
sed -i "s|{{API_DOMAIN}}|$API_DOMAIN|g" /etc/caddy/Caddyfile
sed -i "s|{{EMAIL}}|$EMAIL_LETSENCRYPT|g" /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl enable --now caddy

# ---- 9. systemd unit para docker-compose ----
log "Instalando unit systemd tripcazador.service..."
cp "$APP_DIR/infra/systemd/tripcazador.service" /etc/systemd/system/tripcazador.service
systemctl daemon-reload
systemctl enable tripcazador.service

# ---- 10. instalar watchdog + cron ----
log "Instalando watchdog (cron cada 30 min)..."
cp "$APP_DIR/monitoring/watchdog.py" /usr/local/bin/tripcazador-watchdog.py
chmod +x /usr/local/bin/tripcazador-watchdog.py
cat > /etc/cron.d/tripcazador-watchdog <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
*/30 * * * * $USER_NAME /usr/bin/python3 /usr/local/bin/tripcazador-watchdog.py >/var/log/tripcazador-watchdog.log 2>&1
EOF

# ---- 11. backups diarios ----
log "Configurando backup diario (04:00 UTC → Backblaze B2)..."
cp "$APP_DIR/infra/scripts/backup.sh" /usr/local/bin/tripcazador-backup.sh
chmod +x /usr/local/bin/tripcazador-backup.sh
cat > /etc/cron.d/tripcazador-backup <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 4 * * * root /usr/local/bin/tripcazador-backup.sh >/var/log/tripcazador-backup.log 2>&1
EOF

# ---- 12. mensaje final ----
log "----------------------------------------------------------"
log "Bootstrap completado."
log ""
log "Siguientes pasos:"
log "  1) cp $APP_DIR/.env.example $APP_DIR/.env  # y rellenar secretos"
log "  2) sudo systemctl start tripcazador"
log "  3) sudo systemctl status tripcazador"
log "  4) curl https://$DOMAIN && curl https://$API_DOMAIN/health"
log "----------------------------------------------------------"
