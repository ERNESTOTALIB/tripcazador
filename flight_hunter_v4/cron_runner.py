"""
TripCazador — Cron Runner (Docker Worker)
=========================================
Ejecuta el Flight Hunter en un loop con intervalos configurables.
Usa APScheduler para gestionar el cron sin depender de crontab del sistema.

Variables de entorno:
  CRON_INTERVAL  → Intervalo en segundos (default: 21600 = 6h)
  OUTPUT_DIR     → Directorio de salida para deals.json
  KIWI_API_KEY   → (y demás API keys)
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


def run_search():
    """Ejecuta una búsqueda completa del Flight Hunter."""
    log.info(f"=== INICIANDO BÚSQUEDA — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
    start = time.time()

    try:
        import subprocess
        result = subprocess.run(
            [
                sys.executable,
                "/app/main.py",
                "--mode", "anywhere",
                "--origins", "tier1",
                "--date-from", get_date(60),
                "--date-to", get_date(120),
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
