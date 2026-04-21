"""
seasonal_threshold.py
─────────────────────
Umbrales de categorización de precio adaptativos por temporada y por
distribución observada en el origen.

Motivación (observada en rondas 1-4 abr-2026):
- Ronda 1 (verano pico, jul-ago): floor ~€11-13, sí hay error fares < €15
- Ronda 2 (invierno, dic-feb): floor ~€19-22, 0 error fares < €15
- Ronda 3 (shoulder oct-nov):   floor €17.99, 0 error fares < €15
- Ronda 4 (Q2 2027 early, ~12M): floor €25.30, 0 error fares

Un umbral absoluto `<€15` sólo detecta anomalías en temporada alta; fuera
de esta ventana los precios bajos legítimos ya están en ~€17-22 y el
detector genera falsos negativos (deja de alertar). La propuesta:

1. Clasificación por percentil local respecto a la distribución del origen.
   `cheap_bucket(price, median, p10)` → ERROR/CRIT/CHOLLO/OFERTA/NORMAL
   basado en cuán por debajo del p10 o mediana local está el precio.

2. Piso absoluto defensivo para detectar "glitch pricing" imposible
   (< €5 cualquier vuelo). Esto no depende de temporada.

3. Helpers reutilizables por scripts/real_ryanair_*_hunt.py para
   uniformizar reporting entre rondas.

NOTA: Este módulo NO sustituye `detector.py` (que usa IQR/z-score sobre
histórico multi-día por ruta). Sirve para la capa de scripts exploratorios
donde sólo tenemos una lista de "cheapest flight por fecha" por origen.
"""

from __future__ import annotations
from statistics import median
from typing import Iterable, Literal


Season = Literal["peak_summer", "winter", "shoulder", "early_booking", "unknown"]
Bucket = Literal["ERROR", "CRIT", "CHOLLO", "OFERTA", "NORMAL"]

# Piso absoluto: precios por debajo de este umbral son glitch o error de
# precio con casi total certeza, independientemente de la temporada.
# Ryanair nunca publica vuelos sub-€5 ni siquiera en promociones agresivas.
ABSOLUTE_GLITCH_FLOOR_EUR = 5.0

# Expected seasonal floor range (EUR) — para Ryanair intra-Europa.
# Se deriva empíricamente de las 4 rondas de abril 2026. Si una ronda futura
# muestra floor consistentemente fuera de este rango, actualizar.
SEASONAL_FLOOR_EUR: dict[Season, tuple[float, float]] = {
    "peak_summer":   (10.0, 15.0),
    "shoulder":      (15.0, 22.0),
    "winter":        (17.0, 25.0),
    "early_booking": (22.0, 35.0),
    "unknown":       (10.0, 35.0),
}


def percentile(values: list[float], pct: float) -> float:
    """p-ésimo percentil sin numpy (interpolación lineal simple)."""
    if not values:
        raise ValueError("values vacía")
    if pct <= 0:
        return min(values)
    if pct >= 100:
        return max(values)
    s = sorted(values)
    k = (len(s) - 1) * (pct / 100.0)
    f = int(k)
    c = min(f + 1, len(s) - 1)
    if f == c:
        return s[f]
    return s[f] + (s[c] - s[f]) * (k - f)


def cheap_bucket(price: float, prices_in_origin: Iterable[float]) -> Bucket:
    """
    Clasifica `price` relativa a la distribución del origen.

    Reglas (empíricamente derivadas para distribuciones Ryanair right-skewed):
      - price < ABSOLUTE_GLITCH_FLOOR_EUR    → ERROR  (glitch)
      - price ≤ p10 * 0.6                    → ERROR  (60% por debajo del p10)
      - price ≤ p10                          → CRIT   (precio mínimo regular)
      - price ≤ mediana * 0.65               → CHOLLO
      - price ≤ mediana * 0.85               → OFERTA
      - en otro caso                         → NORMAL

    La referencia dual (p10 + mediana) evita dos modos de fallo:
    - Sólo mediana → errores no detectados en orígenes con p10 muy bajo
      (Báltico, Polonia).
    - Sólo p10 → etiqueta todo CHOLLO en orígenes con distribución plana.
    """
    if price < ABSOLUTE_GLITCH_FLOOR_EUR:
        return "ERROR"
    prices = [p for p in prices_in_origin if p > 0]
    if len(prices) < 3:
        # Pocas muestras: no podemos distinguir → caer al floor absoluto y listo.
        return "NORMAL"
    p10 = percentile(prices, 10)
    med = median(prices)
    if price <= p10 * 0.6:
        return "ERROR"
    if price <= p10:
        return "CRIT"
    if price <= med * 0.65:
        return "CHOLLO"
    if price <= med * 0.85:
        return "OFERTA"
    return "NORMAL"


def season_for_dates(date_from_iso: str, date_to_iso: str) -> Season:
    """Heurística ligera para etiquetar temporada a partir del rango de
    búsqueda. No usa calendarios regionales, sólo mes/rango."""
    from datetime import date as _date
    try:
        d_from = _date.fromisoformat(date_from_iso)
        d_to = _date.fromisoformat(date_to_iso)
    except ValueError:
        return "unknown"
    if d_from > d_to:
        return "unknown"
    # Meses representativos (usamos el mes del punto medio)
    mid_month = ((d_from.toordinal() + d_to.toordinal()) // 2)
    mid = _date.fromordinal(mid_month).month
    # Ventana a > 8 meses vista → early booking
    from datetime import datetime as _dt
    months_ahead = (d_from - _dt.utcnow().date()).days / 30.0
    if months_ahead >= 8:
        return "early_booking"
    if mid in (7, 8):
        return "peak_summer"
    if mid in (12, 1, 2):
        return "winter"
    return "shoulder"


def seasonal_floor_range(season: Season) -> tuple[float, float]:
    """Rango esperado de floor (min, max) para la temporada dada."""
    return SEASONAL_FLOOR_EUR.get(season, SEASONAL_FLOOR_EUR["unknown"])


def floor_is_anomalous(observed_floor: float, season: Season) -> bool:
    """True si el floor observado está fuera del rango esperado para la
    temporada — señal de que algo cambió (mercado, bug de datos)."""
    lo, hi = seasonal_floor_range(season)
    return observed_floor < lo * 0.5 or observed_floor > hi * 1.8
