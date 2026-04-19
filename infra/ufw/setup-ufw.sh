#!/usr/bin/env bash
#
# setup-ufw.sh — configura UFW en la VM de producción.
# Política: deny-all por defecto, allow SSH (22), HTTP (80), HTTPS (443), v4+v6.
# No abrimos 5432 (Postgres) ni 8000 (API) — sólo accesibles vía Caddy o docker internal net.
#
# Ejecutar con sudo en la VM:
#   sudo bash infra/ufw/setup-ufw.sh

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "❌ Ejecutar como root (sudo bash infra/ufw/setup-ufw.sh)"
  exit 1
fi

echo "🛡️  Configurando UFW..."

# Reset para empezar limpio (idempotente en re-runs)
ufw --force reset

# Políticas por defecto
ufw default deny incoming
ufw default allow outgoing
ufw default deny routed

# SSH — restringimos a rate-limit (6 conexiones/30 s por IP, previene brute force)
ufw limit 22/tcp comment "SSH con rate-limit"

# HTTP + HTTPS (Caddy los sirve)
ufw allow 80/tcp  comment "HTTP -> Caddy redirect 301 a HTTPS"
ufw allow 443/tcp comment "HTTPS -> Caddy reverse proxy"
ufw allow 443/udp comment "HTTP/3 QUIC"

# Postgres y API NO se abren: sólo localhost / red interna Docker
# ufw allow 5432  ← NO
# ufw allow 8000  ← NO

# IPv6 fuera del default, también sólo lo esencial
ufw allow in on lo
ufw allow out on lo

# Activar (sin prompt)
ufw --force enable

# Logging medio (suficiente para auditar scanners sin saturar el disco)
ufw logging medium

echo "✅ UFW activo. Reglas:"
ufw status verbose
