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
# El FileHandler sólo se añade si el directorio existe — así el módulo es
# importable fuera del contenedor (tests, dev local) sin crashear con
# FileNotFoundError: '/app/output/worker.log'.
_LOG_FILE = os.environ.get("WORKER_LOG_FILE", "/app/output/worker.log")
_handlers = [logging.StreamHandler(sys.stdout)]
try:
    _log_dir = os.path.dirname(_LOG_FILE)
    if _log_dir and os.path.isdir(_log_dir):
        _handlers.append(logging.FileHandler(_LOG_FILE))
except Exception:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=_handlers,
)
log = logging.getLogger(__name__)

# Intervalo de búsqueda
INTERVAL = int(os.environ.get("CRON_INTERVAL", 21600))  # 6h default
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "/app/output")

# ────────────────────────────────────────────────────────────
# Ventana de búsqueda: rango de días hacia adelante a escanear.
# Por qué existe esto: la ventana de reserva típica útil está entre 2-6 meses.
#   - <30 días: precios hinchados, los chollos reales ya están agotados
#   - >180 días: los error fares rara vez son visibles (inventory todavía abre),
#     y desperdiciamos quota del API en fechas que no tienen deals maduros.
#
# Parámetros (ENV):
#   SEARCH_WINDOW_DAYS_FROM  → días desde hoy al inicio del rango (default 60)
#   SEARCH_WINDOW_DAYS_TO    → días desde hoy al final del rango (default 180)
#
# Hard-clamp para proteger costes y relevancia:
#   from ∈ [14, 150], to ∈ [60, 210], to > from
# ────────────────────────────────────────────────────────────
_DEFAULT_FROM = 60    # ~2 meses
_DEFAULT_TO = 180     # ~6 meses
_MIN_FROM, _MAX_FROM = 14, 150
_MIN_TO, _MAX_TO = 60, 210


def _clamp(v: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, v))


def _parse_int_env(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        log.warning(f"{name}='{raw}' no es un entero válido, usando default={default}")
        return default


def get_search_window() -> tuple[int, int]:
    """Devuelve (days_from, days_to) para la búsqueda, con clamping defensivo."""
    df = _clamp(_parse_int_env("SEARCH_WINDOW_DAYS_FROM", _DEFAULT_FROM), _MIN_FROM, _MAX_FROM)
    dt = _clamp(_parse_int_env("SEARCH_WINDOW_DAYS_TO", _DEFAULT_TO), _MIN_TO, _MAX_TO)
    if dt <= df:
        log.warning(f"Ventana inválida ({df}→{dt}), ajustando a default {_DEFAULT_FROM}→{_DEFAULT_TO}")
        df, dt = _DEFAULT_FROM, _DEFAULT_TO
    return df, dt


# ────────────────────────────────────────────────────────────
# Rotación de perfiles de caza (abr-2026g)
# ────────────────────────────────────────────────────────────
# Por qué: con una sola llamada cada 6h y solo `anywhere tier1`, el motor
# cubre bien destinos long-haul desde hubs grandes, pero desperdicia la
# posibilidad de atrapar:
#   - Error fares en destinos volátiles específicos (CUN, BKK, JNB, MLE…)
#   - Ofertas desde aeropuertos secundarios (tier2) — diferencias grandes
#     con low-cost que no vuelan desde CDG/FRA/LHR
#   - Business class con ratio anómalo
#   - Escapadas europeas de fin de semana (nights_min=2, nights_max=4)
#   - Paquetes familiares a playa (nights_min=7, pax familiar)
#
# Rotamos por TICK (cada 6h ⇒ 4 perfiles/día), no por hora, para respetar
# quota de APIs.  Cada perfil usa un modo distinto + un subconjunto de
# aeropuertos/destinos para maximizar diversidad sin duplicar llamadas.
#
# Se puede fijar un perfil concreto vía HUNT_PROFILE= env (útil para tests)
# o desactivar rotación con HUNT_ROTATION=0 (default: rotación activa).
# ────────────────────────────────────────────────────────────

# Perfiles de caza — nombre → argumentos extra para main.py
# No duplicamos --date-from/--date-to (se añaden siempre) ni --mode aquí
# para los perfiles "clásicos"; el modo va en el primer campo "mode".
HUNT_PROFILES = [
    # 0: Escaneo global principal — anywhere desde hubs grandes
    {
        "name": "anywhere-tier1",
        "mode": "anywhere",
        "extra": ["--origins", "tier1"],
        "nights_range": (5, 21),
    },
    # 1: Error fares en destinos super-volátiles
    {
        "name": "error-volatile",
        "mode": "error-hunter",
        "extra": ["--origins", "tier1", "--dest", "volatile"],
        "nights_range": (5, 21),
    },
    # 2: Business class a ratio anómalo desde orígenes transatlánticos
    {
        "name": "business-transatlantic",
        "mode": "business-hunter",
        "extra": ["--origins", "transatlantic", "--cabin", "business"],
        "nights_range": (5, 14),
    },
    # 3: Escapada de fin de semana europeo desde tier2 (low-cost)
    {
        "name": "weekend-tier2",
        "mode": "anywhere",
        "extra": ["--origins", "tier2"],
        "nights_range": (2, 4),
    },
]


def _select_profile(tick: int) -> dict:
    """
    Selecciona el perfil de caza para este tick.

    Override via env HUNT_PROFILE=<name>. Si no existe, o HUNT_ROTATION=0,
    vuelve al comportamiento legacy (anywhere-tier1 siempre).
    """
    forced = os.environ.get("HUNT_PROFILE", "").strip().lower()
    if forced:
        for p in HUNT_PROFILES:
            if p["name"] == forced:
                return p
        log.warning(f"HUNT_PROFILE='{forced}' no existe, usando rotación normal")

    rotation = os.environ.get("HUNT_ROTATION", "1").strip()
    if rotation == "0":
        return HUNT_PROFILES[0]

    return HUNT_PROFILES[tick % len(HUNT_PROFILES)]


# Contador global de ticks — persiste durante la vida del proceso.
# Se inicia en 0 para que el primer run_search() use anywhere-tier1 (legacy).
_tick_counter = 0


def run_search():
    """Ejecuta una búsqueda completa del Flight Hunter (perfil rotante)."""
    global _tick_counter

    profile = _select_profile(_tick_counter)
    log.info(
        f"=== INICIANDO BÚSQUEDA [{profile['name']}] — "
        f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ==="
    )
    start = time.time()

    days_from, days_to = get_search_window()
    nights_min, nights_max = profile.get("nights_range", (5, 21))
    log.info(f"   Ventana: hoy+{days_from}d → hoy+{days_to}d ({(days_to - days_from)}d)")
    log.info(f"   Noches: {nights_min}-{nights_max}")

    try:
        import subprocess
        cmd = [
            sys.executable,
            "/app/main.py",
            "--mode", profile["mode"],
            "--date-from", get_date(days_from),
            "--date-to", get_date(days_to),
            "--nights-min", str(nights_min),
            "--nights-max", str(nights_max),
            *profile.get("extra", []),
        ]
        result = subprocess.run(
            cmd,
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
    finally:
        _tick_counter += 1


def get_date(days_ahead: int) -> str:
    """Devuelve fecha futura en formato YYYY-MM-DD."""
    from datetime import datetime, timedelta
    return (datetime.now() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")


def main():
    log.info(f"🚀 TripCazador Worker iniciado")
    log.info(f"   Intervalo: {INTERVAL}s ({INTERVAL//3600}h)")
    log.info(f"   Output dir: {OUTPUT_DIR}")
    df, dt = get_search_window()
    log.info(f"   Ventana inicial: +{df}d → +{dt}d")

    # Ejecutar inmediatamente al arrancar
    run_search()

    # Luego en loop
    while True:
        log.info(f"⏰ Próxima búsqueda en {INTERVAL//3600}h...")
        time.sleep(INTERVAL)
        run_search()


if __name__ == "__main__":
    main()
