"""
Hotel Deal Detector — fase SSS31 (May 2026)
============================================
Detecta DROPS significativos de precio en hoteles, similar a como el
hunter de vuelos detecta error fares.

Filosofía:
- Booking afiliado ya cubre TODO el inventario via redirección con aid
- El hunter SOLO debe añadir valor mostrando deals reales (drops vs baseline)
- Sin esto, /hoteles compite con Booking directo y pierde

Lógica:
- Tracker persistente en hotel_history.jsonl (1 línea por measurement)
- Para cada hotel detecta:
  1. drop_vs_history ≥ 20% (vs propia mediana 30d)
  2. drop_vs_serpapi_baseline ≥ 25% (low_price reportado por SerpAPI)
  3. outlier estadístico (precio < mediana - 1.5×stdev)
- Si ≥2 condiciones se cumplen → marca como DEAL
- Bootstrap: primeros 14 días sin historia → usa baseline SerpAPI

Storage: append-only JSONL ~90KB/mes para 60 hotels × 30 days.
"""
import json
import os
import statistics
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Path al archivo de histórico — repo root + flight_hunter_v4/
HISTORY_PATH = Path(__file__).parent / "hotel_history.jsonl"

# Umbrales — ajustables sin modificar lógica
THRESHOLD_DROP_VS_HISTORY = 0.20    # -20% vs mediana propia
THRESHOLD_DROP_VS_BASELINE = 0.25   # -25% vs low_price SerpAPI
THRESHOLD_OUTLIER_STDEV = 1.5       # 1.5 × stdev por debajo de mediana
HISTORY_MIN_SAMPLES = 5             # mínimo para usar histórico (sino baseline)
HISTORY_PRUNE_DAYS = 90             # eliminar registros >90d

# Mínimo absoluto para evitar falsos positivos en hostales €30-50
MIN_DROP_EUR = 30                   # diferencia mínima absoluta
MIN_PRICE_EUR = 35                  # ignorar hoteles muy baratos (ya bajos)


def _load_history() -> List[Dict]:
    """Carga el histórico desde JSONL. Devuelve lista de dicts."""
    if not HISTORY_PATH.exists():
        return []
    rows = []
    try:
        with open(HISTORY_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    except FileNotFoundError:
        # SSS203 (15 may 2026): first run sin history es esperado (silent OK)
        pass
    except (OSError, IOError) as exc:
        # SSS203: otros OS errors (permissions, disk full) NO son normales.
        # Antes silent → baseline de precios siempre vacío → filter rechazaba
        # todos los hoteles → 0 hotel deals durante semanas sin diagnóstico.
        print(
            f"   ⚠️  Hotel history load failed (OS error — baseline vacío, "
            f"0 hotel deals esperados): {type(exc).__name__}: {exc}",
            flush=True,
        )
    return rows


def _prune_old_history(rows: List[Dict]) -> List[Dict]:
    """Elimina registros >90 días para mantener archivo manageable."""
    cutoff = (datetime.utcnow() - timedelta(days=HISTORY_PRUNE_DAYS)).isoformat()
    return [r for r in rows if r.get("ts", "") >= cutoff]


def _save_history(rows: List[Dict]) -> None:
    """Sobrescribe el JSONL con la lista actualizada."""
    HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def _hotel_key(hotel: Dict) -> str:
    """Clave única hotel + ventana check-in (mes). Permite tracking por
    estacionalidad — Madrid Mayo es distinto de Madrid Diciembre."""
    name = (hotel.get("hotel_name") or "").strip().lower().replace(" ", "_")[:40]
    city = (hotel.get("city_to") or "").strip().lower().replace(" ", "_")[:20]
    checkin = hotel.get("checkin", "")
    month = checkin[:7] if len(checkin) >= 7 else "unknown"
    return f"{city}|{name}|{month}"


def append_to_history(hotels: List[Dict]) -> None:
    """Añade los precios actuales al histórico (append + prune)."""
    if not hotels:
        return
    rows = _load_history()
    ts = datetime.utcnow().isoformat()
    for h in hotels:
        price = h.get("price_eur") or 0
        if price <= 0:
            continue
        rows.append({
            "ts": ts,
            "key": _hotel_key(h),
            "price": round(float(price), 2),
            "city": h.get("city_to", ""),
            "hotel": (h.get("hotel_name") or "")[:60],
            "checkin": h.get("checkin", ""),
        })
    rows = _prune_old_history(rows)
    _save_history(rows)


def _stats_for_key(history_rows: List[Dict], key: str,
                    days_back: int = 30) -> Optional[Dict]:
    """Calcula estadísticas para una clave de hotel en los últimos N días."""
    cutoff = (datetime.utcnow() - timedelta(days=days_back)).isoformat()
    samples = [r["price"] for r in history_rows
               if r.get("key") == key and r.get("ts", "") >= cutoff
               and r.get("price", 0) > 0]
    if len(samples) < HISTORY_MIN_SAMPLES:
        return None
    return {
        "n": len(samples),
        "median": statistics.median(samples),
        "mean": statistics.mean(samples),
        "stdev": statistics.stdev(samples) if len(samples) >= 2 else 0,
        "min": min(samples),
        "max": max(samples),
    }


def detect_deals(hotels: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
    """
    Para una lista de hoteles del run actual, devuelve:
      - exports: hoteles para incluir en deals.json (con type=hotel_deal si
        cumplen drop, o type=hotel cuando estamos en bootstrap fase)
      - omitted: hoteles que NO se exportan (son ruido o ya ranqueados bajo)

    Bootstrap: si no hay history para ningún hotel (primeros 14d), el primer
    hotel de cada ciudad sale como type=hotel (representativo) — luego con
    history acumulada solo saldrán los que tengan drops reales.

    También append-ea al histórico ANTES de calcular stats (para que el
    sample del run actual cuente al cabo de 14 días).
    """
    # Primero append al histórico (para futuras runs)
    append_to_history(hotels)

    # Recargar histórico (ahora incluye este run)
    history = _load_history()

    # Bootstrap detection: si no hay datos suficientes, exportar 1 hotel
    # representativo por ciudad para no dejar /hoteles vacío
    has_meaningful_history = any(
        len([r for r in history if r.get("key") == _hotel_key(h)]) >= HISTORY_MIN_SAMPLES
        for h in hotels
    )

    deals: List[Dict] = []
    regular: List[Dict] = []
    bootstrap_seen_cities: set = set()

    for h in hotels:
        price = h.get("price_eur") or 0
        if price < MIN_PRICE_EUR:
            regular.append(h)
            continue

        key = _hotel_key(h)
        stats = _stats_for_key(history, key, days_back=30)

        # Recoger señales de drop
        signals = []
        drop_pct_history = 0
        median_30d = None

        if stats:
            median_30d = stats["median"]
            drop_pct_history = (median_30d - price) / median_30d if median_30d > 0 else 0
            if drop_pct_history >= THRESHOLD_DROP_VS_HISTORY and (median_30d - price) >= MIN_DROP_EUR:
                signals.append("history")

            # Outlier estadístico
            if stats["stdev"] > 0:
                lower_bound = median_30d - THRESHOLD_OUTLIER_STDEV * stats["stdev"]
                if price <= lower_bound:
                    signals.append("outlier")

        # SerpAPI baseline — usamos low_price/high_price si vienen
        baseline = h.get("baseline_low_price") or h.get("baseline_avg_price")
        drop_pct_baseline = 0
        if baseline and baseline > 0:
            drop_pct_baseline = (baseline - price) / baseline
            if drop_pct_baseline >= THRESHOLD_DROP_VS_BASELINE and (baseline - price) >= MIN_DROP_EUR:
                signals.append("baseline")

        # Decisión: ≥1 señal fuerte (drop_pct ≥30%) o ≥2 señales mixtas
        max_drop = max(drop_pct_history, drop_pct_baseline)
        is_deal = (max_drop >= 0.30) or (len(signals) >= 2)

        # Bootstrap: si no hay history suficiente en TODA la corrida,
        # incluir el 1er hotel de cada ciudad como representativo
        # (para que /hoteles no esté vacío durante los primeros 14 días).
        is_bootstrap_pick = (
            not has_meaningful_history
            and h.get("city_to") not in bootstrap_seen_cities
            and price >= MIN_PRICE_EUR
        )
        if is_bootstrap_pick:
            bootstrap_seen_cities.add(h.get("city_to"))
            h_boot = dict(h)
            h_boot["type"] = "hotel"  # mantenido como "hotel" durante bootstrap
            h_boot["classification"] = "TRACKING"
            h_boot["headline"] = f"{h.get('hotel_name','Hotel')} desde {int(price)}€/noche"
            h_boot["score"] = 50
            deals.append(h_boot)
            continue

        if is_deal:
            # Enriquecer hotel con metadata de deal
            classification = (
                "CRÍTICO" if max_drop >= 0.50 else
                "ERROR"   if max_drop >= 0.35 else
                "ANOMALÍA" if max_drop >= 0.25 else
                "OFERTA"
            )
            score = min(95, int(50 + max_drop * 100))
            h_deal = dict(h)
            h_deal["type"] = "hotel_deal"
            h_deal["classification"] = classification
            h_deal["deal_signals"] = signals
            h_deal["drop_pct"] = round(max_drop * 100, 1)
            h_deal["drop_eur"] = round((median_30d or baseline or price) - price, 2)
            h_deal["median_30d_eur"] = round(median_30d, 2) if median_30d else None
            h_deal["baseline_eur"] = round(baseline, 2) if baseline else None
            h_deal["history_samples"] = stats["n"] if stats else 0
            h_deal["score"] = score
            h_deal["headline"] = f"-{int(max_drop*100)}% en {h.get('hotel_name','Hotel')}"
            deals.append(h_deal)
        else:
            regular.append(h)

    return deals, regular


def get_history_stats() -> Dict:
    """Diagnóstico — útil para /admin: número de samples, hoteles tracked, etc."""
    rows = _load_history()
    if not rows:
        return {"total_samples": 0, "unique_hotels": 0, "oldest": None, "newest": None}
    keys = set(r.get("key", "") for r in rows)
    timestamps = [r.get("ts", "") for r in rows if r.get("ts")]
    return {
        "total_samples": len(rows),
        "unique_hotels": len(keys),
        "oldest": min(timestamps) if timestamps else None,
        "newest": max(timestamps) if timestamps else None,
    }
