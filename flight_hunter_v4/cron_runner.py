"""
TripCazador — Cron Runner (Docker Worker)
=========================================
Ejecuta el Flight Hunter en un loop con intervalos configurables.

Motores activos (2026-04-19, Kiwi abandonado):
  - Ryanair (sin API key, tiempo real)
  - Travelpayouts Aviasales (750+ aerolíneas)
  - RapidAPI Sky Scrapper (long-haul, gated por RAPIDAPI_KEY)
  - Amadeus y SerpAPI se incluyen sólo si sus keys están disponibles

Variables de entorno:
  CRON_INTERVAL       → Intervalo en segundos (default: 21600 = 6h)
  OUTPUT_DIR          → Directorio de salida para deals.json
  RAPIDAPI_KEY        → Sky Scrapper (requerida para cobertura long-haul)
  TRAVELPAYOUTS_TOKEN → Aviasales API
  SERPAPI_KEY         → Google Flights (solo modo business, opcional)
  TELEGRAM_BOT_TOKEN  → Notificaciones
  TELEGRAM_CHAT_ID    → Canal/grupo destino
  WORKER_MODE         → Modo del hunter (default: all). Opciones: all, anywhere (Kiwi-only, deprecated)
  WORKER_ORIGINS      → Preset de orígenes (default: tier1)
  WORKER_WINDOW_START → Días en el futuro para empezar a buscar (default: 45)
  WORKER_WINDOW_END   → Días en el futuro para parar (default: 120)
"""

import asyncio
import logging
import os
import sys
import time
from datetime import datetime

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("/app/output/worker.log"),
    ],
)
log = logging.getLogger(__name__)

# Intervalo de búsqueda
INTERVAL = int(os.environ.get("CRON_INTERVAL", 21600))  # 6h default
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "/app/output")

# Parámetros del hunter (configurables por env sin reconstruir la imagen)
WORKER_MODE         = os.environ.get("WORKER_MODE", "all")
WORKER_ORIGINS      = os.environ.get("WORKER_ORIGINS", "tier1")
WORKER_WINDOW_START = int(os.environ.get("WORKER_WINDOW_START", 45))
WORKER_WINDOW_END   = int(os.environ.get("WORKER_WINDOW_END", 120))


def run_search():
    """Ejecuta una búsqueda completa del Flight Hunter."""
    log.info(f"=== INICIANDO BÚSQUEDA — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    log.info(f"   modo={WORKER_MODE} origins={WORKER_ORIGINS} ventana=+{WORKER_WINDOW_START}d..+{WORKER_WINDOW_END}d")
    start = time.time()

    try:
        import subprocess
        result = subprocess.run(
            [
                sys.executable,
                "/app/main.py",
                "--mode", WORKER_MODE,
                "--origins", WORKER_ORIGINS,
                "--date-from", get_date(WORKER_WINDOW_START),
                "--date-to", get_date(WORKER_WINDOW_END),
            ],
            capture_output=False,
            text=True,
            cwd="/app",
        )
        elapsed = time.time() - start
        if result.returncode == 0:
            log.info(f"✅ Búsqueda completada en {elapsed:.0f}s")
        else:
            log.error(f"❌ Búsqueda falló (returncode={result.returncode}) en {elapsed:.0f}s")
    except Exception as e:
        log.error(f"❌ Excepción en búsqueda: {e}", exc_info=True)


def get_date(days_ahead: int) -> str:
    """Devuelve fecha futura en formato YYYY-MM-DD."""
    from datetime import datetime, timedelta
    return (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")


def main():
    log.info(f"🚀 TripCazador Worker iniciado")
    log.info(f"   Intervalo: {INTERVAL}s ({INTERVAL//3600}h)")
    log.info(f"   Output dir: {OUTPUT_DIR}")

    # Ejecutar inmediatamente al arrancar
    run_search()

    # Luego en loop
    while True:
        log.info(f"⏰ Próxima búsqueda en {INTERVAL//3600}h...")
        time.sleep(INTERVAL)
        run_search()


if __name__ == "__main__":
    main()
