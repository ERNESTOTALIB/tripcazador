#!/usr/bin/env bash
#
# setup-precommit.sh — Instala pre-commit + detect-secrets para el repo.
#
# Ejecutar UNA SOLA VEZ tras clonar el repo (local o VM):
#   bash scripts/setup-precommit.sh
#
# Lo que hace:
#   1. Instala pre-commit y detect-secrets (usuario, no system-wide)
#   2. Instala los hooks en .git/hooks/
#   3. Regenera .secrets.baseline si no existe
#   4. Corre todos los hooks sobre el repo completo (verificación inicial)
#

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

log() { echo -e "\033[1;36m[precommit]\033[0m $*"; }

log "Instalando pre-commit + detect-secrets..."
if ! command -v pip3 &>/dev/null && ! command -v pip &>/dev/null; then
  echo "ERROR: necesitas pip instalado (sudo apt install python3-pip)"
  exit 1
fi

PIP="$(command -v pip3 || command -v pip)"
"$PIP" install --user --quiet --upgrade pre-commit detect-secrets

# Asegurar que ~/.local/bin está en PATH
export PATH="$HOME/.local/bin:$PATH"

log "Instalando hooks de pre-commit..."
pre-commit install --install-hooks

# Baseline: si existe lo mantenemos (para no re-aprobar falsos positivos);
# si no, lo creamos desde cero.
if [[ ! -f .secrets.baseline ]]; then
  log "Generando .secrets.baseline inicial..."
  detect-secrets scan \
    --exclude-files '\.git/|node_modules/|\.next/|__pycache__/|\.db$|\.jsonl$|\.lock$|package-lock\.json|yarn\.lock|results_.*\.json|branding/.*\.(png|pdf)$|deals\.json$|output/' \
    > .secrets.baseline
  log "Baseline creado con $(python3 -c "import json; d=json.load(open('.secrets.baseline')); print(sum(len(v) for v in d.get('results',{}).values()))") hallazgos."
else
  log ".secrets.baseline ya existe (ok)."
fi

log "Corriendo todos los hooks sobre el repo (puede tardar)..."
pre-commit run --all-files || {
  echo
  log "⚠️  Algunos hooks fallaron arriba. Revisa la salida."
  log "   Corre 'pre-commit run --all-files' de nuevo tras arreglar."
  exit 1
}

log "✅ Pre-commit configurado correctamente."
log ""
log "A partir de ahora cada 'git commit' ejecutará los hooks automáticamente."
log "Para saltar hooks puntualmente (NO recomendado):"
log "   git commit --no-verify -m 'mensaje'"
