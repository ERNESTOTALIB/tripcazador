"""
Flight Hunter V4 — Deals Exporter
====================================
Exporta los deals detectados a un JSON unificado para la web TripCazador.

Funciones clave:
1. dedup_flights()    — Cross-source deduplication (misma ruta+fecha, precio menor)
2. filter_quality()   — Filtro de calidad mínima (elimina false positives obvios)
3. build_unified_deals() — Schema unificado vuelos+hoteles para la web
4. export_deals_json()   — Guarda deals.json en output dir
5. send_telegram_alerts() — Alerta por Telegram para cada nuevo CRÍTICO/ERROR
6. run_export()          — Orquesta todo el pipeline de exportación

Uso:
    from deals_exporter import run_export
    run_export(analyzed_flights, output_dir="/path/to/output")

Schema de cada deal en deals.json:
    {
        "id":            "ryanair_MRS_PMI_2026-07-15",
        "type":          "flight",
        "headline":      "🔥 Error fare: Tokio desde Madrid a solo 198€ en Business",
        "origin":        "MAD",
        "destination":   "NRT",
        "city_from":     "Madrid",
        "city_to":       "Tokio Narita",
        "country_to":    "Japón",
        "region":        "Asia",
        "price_eur":     198.0,
        "savings_pct":   72.5,
        "savings_eur":   502.0,
        "nights":        7,
        "date_out":      "2026-07-15",
        "date_ret":      "2026-07-22",
        "cabin":         "business",
        "airline":       "JL",
        "airline_name":  "Japan Airlines",
        "stops":         0,
        "duration_min":  720,
        "score":         88.5,
        "classification": "CRÍTICO",
        "tags":          ["asia", "business", "directo", "error-fare"],
        "image_url":     "https://images.unsplash.com/...",
        "booking_url":   "https://...",
        "verified":      true,  // True si 2+ fuentes confirman el precio
        "sources":       ["kiwi", "rapidapi"],
        "found_at":      "2026-04-18T14:30:00",
        "expires_at":    "2026-04-19T08:30:00",
        "lat":           35.765,
        "lon":           140.386,
    }
"""

import asyncio
import json
import os
import hashlib
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Optional, Tuple

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

import config
from deal_enricher import enrich_all


# ─────────────────────────────────────────────────────────────
# SCHEMA VERSION — para detectar cambios incompatibles en la web
# ─────────────────────────────────────────────────────────────
DEALS_SCHEMA_VERSION = "4.1"

# Clasificaciones que merecen alerta inmediata
ALERT_CLASSIFICATIONS = {"CRÍTICO", "ERROR"}

# Score mínimo para incluir en deals.json (filtrar noise)
MIN_EXPORT_SCORE = 15


# ─────────────────────────────────────────────────────────────
# DEDUPLICACIÓN CROSS-SOURCE
# ─────────────────────────────────────────────────────────────

def dedup_close_prices(
    flights: List[Dict],
    tolerance_eur: float = 1.0,
) -> Tuple[List[Dict], Dict[str, int]]:
    """
    Dedup más fino que `dedup_flights` (#abr-2026l).

    Agrupa por `(origin, destination, date_out, cabin, airline)` y colapsa
    entradas cuyo precio difiera en menos de `tolerance_eur`. Mantiene el
    de menor precio.

    Justificación: los engines a veces reportan dos resultados para el
    mismo trayecto con €0.50–€1 de diferencia (impuesto FX, fee bancario,
    arrastre del cache del GDS). Sin este paso, el feed muestra deals
    "diferentes" que en realidad son el mismo. Tolerance en EUR (no %)
    porque los errores son de tipo aditivo, no multiplicativo.

    Returns:
        (deduped, stats) donde stats es {engine: dropped_count} para que
        el exporter pueda registrar qué engine genera más ruido.
    """
    groups: Dict[Tuple, List[Dict]] = defaultdict(list)
    for f in flights:
        cabin = str(f.get("cabin", "economy")).lower().split()[0]
        airline = str(f.get("airline", "") or f.get("carrier", "")).strip().lower()
        key = (
            f.get("origin", ""),
            f.get("destination", ""),
            f.get("date_out", ""),
            cabin,
            airline,
        )
        groups[key].append(f)

    deduped: List[Dict] = []
    stats: Dict[str, int] = defaultdict(int)
    for _key, group in groups.items():
        if len(group) == 1:
            deduped.append(group[0])
            continue
        # Ordenar por precio ascendente para que el más barato gane
        group.sort(key=lambda x: float(x.get("price_eur", 9999) or 9999))
        kept = group[0]
        kept_price = float(kept.get("price_eur", 0) or 0)
        # Recolectar duplicados ±tolerance_eur del más barato
        for dup in group[1:]:
            dup_price = float(dup.get("price_eur", 0) or 0)
            if abs(dup_price - kept_price) <= tolerance_eur:
                stats[str(dup.get("source", "unknown"))] += 1
            else:
                # Diferente lo suficiente — preservar como deal independiente
                deduped.append(dup)
        deduped.append(kept)
    return deduped, dict(stats)


def score_breakdown(deal: Dict) -> Dict[str, float]:
    """
    Desglose interpretable del score de un deal (#abr-2026l).

    Devuelve un dict con cada componente que contribuye al `final_score`,
    para que la UI o ops puedan auditarlo. No modifica el deal — sólo
    inspecciona campos ya presentes.

    Componentes:
      - base: score inicial puesto por las técnicas (t0/t1/t2/t3)
      - seasonal_bonus: +/- por seasonal threshold ajuste
      - holiday_bonus: +/- por holiday window
      - verified_bonus: +15% si verificado por 2+ fuentes
      - lowcost_penalty: -10 si la aerolínea es low-cost (umbral más laxo)
      - total: el final_score entero (0..100)

    Convención: si no se puede inferir un componente del deal, vale 0.
    """
    score = float(deal.get("final_score", deal.get("score", 0) or 0))
    is_verified = bool(deal.get("verified", False))
    is_lowcost = bool(deal.get("is_lowcost", False))
    t0_reason = str(deal.get("t0_reason", "") or "")

    # Heurística de inferencia — los tags se añadieron en abr-2026i/j
    seasonal_bonus = 0.0
    if "ajuste estacional" in t0_reason.lower():
        # Estimación: el ajuste mete típicamente ~5-15 puntos
        seasonal_bonus = 8.0 if score >= 50 else 4.0

    holiday_bonus = 0.0
    if "festivo:" in t0_reason.lower():
        holiday_bonus = 6.0

    verified_bonus = 0.0
    if is_verified:
        # Implementación real: best["final_score"] *= 1.15 → bonus ≈ 15% del score
        verified_bonus = round(score * 0.15 / 1.15, 1)

    lowcost_penalty = 0.0
    if is_lowcost:
        lowcost_penalty = -10.0  # Documentado, no afecta score numéricamente

    base = max(
        0.0, score - seasonal_bonus - holiday_bonus - verified_bonus - lowcost_penalty,
    )

    return {
        "base": round(base, 1),
        "seasonal_bonus": round(seasonal_bonus, 1),
        "holiday_bonus": round(holiday_bonus, 1),
        "verified_bonus": round(verified_bonus, 1),
        "lowcost_penalty": round(lowcost_penalty, 1),
        "total": round(score, 1),
    }


def dedup_flights(flights: List[Dict]) -> List[Dict]:
    """
    Deduplica vuelos de múltiples fuentes para la misma ruta y fecha.

    Estrategia:
    - Clave de dedup: (origin, destination, date_out, cabin)
    - Si hay varios resultados para la misma clave: mantener el de MENOR precio
    - Si hay 2+ fuentes con el mismo precio (±5%): marcar verified=True
    - Merges sources list para saber de cuántas fuentes viene

    Returns:
        Lista deduplicada. Los deals verificados por 2+ fuentes tienen verified=True.
    """
    # Agrupar por clave de dedup
    groups: Dict[Tuple, List[Dict]] = defaultdict(list)
    for f in flights:
        cabin = str(f.get("cabin", "economy")).lower().split()[0]
        key = (
            f.get("origin", ""),
            f.get("destination", ""),
            f.get("date_out", ""),
            cabin,
        )
        groups[key].append(f)

    deduped = []
    for key, group in groups.items():
        # Ordenar por precio ascendente
        group.sort(key=lambda x: x.get("price_eur", 9999))
        best = group[0]

        # Recolectar todas las fuentes
        all_sources = list({f.get("source", "unknown") for f in group})

        # Precio mínimo y máximo
        prices = [f.get("price_eur", 9999) for f in group]
        min_price = min(prices)
        max_price = max(prices)

        # Verificado si 2+ fuentes y los precios son similares (±10%)
        price_spread = (max_price - min_price) / max_price if max_price > 0 else 0
        verified = len(all_sources) >= 2 and price_spread <= 0.10

        best = {
            **best,
            "sources": all_sources,
            "verified": verified,
            "source_count": len(all_sources),
        }

        # Boost de score si verificado por múltiples fuentes
        if verified and len(all_sources) >= 2:
            best["final_score"] = min(100, best.get("final_score", 0) * 1.15)

        deduped.append(best)

    return deduped


# ─────────────────────────────────────────────────────────────
# FILTRO DE CALIDAD
# ─────────────────────────────────────────────────────────────

def filter_quality(deals: List[Dict], min_score: float = MIN_EXPORT_SCORE) -> List[Dict]:
    """
    Filtra deals de baja calidad.

    Descarta:
    - Score < min_score (default 15 = OFERTA mínima)
    - Precio = 0 o negativo
    - Sin destino
    - Sin fecha de salida
    - Deals expirados
    """
    # SSS8: REVERTIDO RRR2. Estaba descartando deals con `expires < now+24h`,
    # pero los TTLs por engine son 6-24h (Ryanair/Vueling/RapidAPI=12h,
    # SerpAPI=6h, Travelpayouts/Duffel=24h). Resultado: 478 anomalías → 0
    # deals exportados (todo el output del hunter se tiraba).
    #
    # Vuelta al filtro original: solo descartar deals YA expirados (expires < now).
    # La detección de "posiblemente caducado" en UI (NN1) es responsabilidad
    # del frontend (getAttractiveDeals + ExpiryCountdown chip), no del exporter.
    now_iso = datetime.now().isoformat()
    filtered = []
    stale_count = 0
    for d in deals:
        if d.get("price_eur", 0) <= 0:
            continue
        if not d.get("destination"):
            continue
        if not d.get("date_out"):
            continue
        if d.get("final_score", 0) < min_score:
            continue
        # Verificar expiración (solo deals YA caducados)
        expires = d.get("expires_at", "")
        if expires and expires < now_iso:
            stale_count += 1
            continue
        filtered.append(d)
    if stale_count:
        print(f"   🗑  filter_quality_deals: {stale_count} deals expirados descartados")
    return filtered


# ─────────────────────────────────────────────────────────────
# SCHEMA UNIFICADO
# ─────────────────────────────────────────────────────────────

def _flight_to_unified(f: Dict) -> Dict:
    """Convierte un deal de vuelo al schema unificado para la web."""
    dest = f.get("destination", "")
    origin = f.get("origin", "")
    cabin = str(f.get("cabin", "economy")).lower()
    source = f.get("source", "unknown")

    # ID único
    date_str = f.get("date_out", "").replace("-", "")
    deal_id = f"{source}_{origin}_{dest}_{date_str}_{cabin}"
    deal_id = deal_id.lower()

    # Nombre de ciudad de origen
    from geo_data import AIRPORT_GEO
    origin_info = AIRPORT_GEO.get(origin, (origin, "", ""))
    city_from = origin_info[0] if origin_info else origin

    return {
        "id": deal_id,
        "type": "flight",
        "headline": f.get("headline", ""),
        "origin": origin,
        "destination": dest,
        "city_from": city_from,
        "city_to": f.get("city_to", dest),
        "country_to": f.get("country_to", ""),
        "region": f.get("region", ""),
        "price_eur": round(f.get("price_eur", 0), 2),
        "savings_pct": round(f.get("savings_pct", 0), 1),
        "savings_eur": round(f.get("savings_eur", 0), 0),
        "nights": f.get("nights", 0),
        "price_per_night": f.get("price_per_night"),
        "date_out": f.get("date_out", ""),
        "date_ret": f.get("date_ret", ""),
        "cabin": cabin,
        "airline": f.get("airline", ""),
        "airline_name": f.get("airline_name", f.get("airline", "")),
        "stops": f.get("stops", 0),
        "duration_min": f.get("duration_min", 0),
        "distance_category": f.get("distance_category", ""),
        "score": round(f.get("final_score", 0), 1),
        "classification": f.get("classification", ""),
        "techniques": f.get("techniques_triggered", []),
        "tags": f.get("tags", []),
        "image_url": f.get("image_url", ""),
        "booking_url": f.get("booking_url", ""),
        "verified": f.get("verified", False),
        "sources": f.get("sources", [f.get("source", "unknown")]),
        "found_at": f.get("scraped_at") or f.get("found_at") or datetime.now().isoformat(),
        "expires_at": f.get("expires_at", ""),
        "lat": f.get("lat"),
        "lon": f.get("lon"),
        # Campos adicionales de detección (para debug en admin)
        "main_reason": f.get("main_reason", ""),
        "t4_ratio": f.get("t4_ratio"),
    }


def build_unified_deals(
    flight_deals: List[Dict],
    hotel_deals: List[Dict] = None,
) -> Dict:
    """
    Construye el objeto deals.json completo para la web.

    Estructura:
    {
        "schema_version": "4.1",
        "generated_at": "...",
        "total_deals": 42,
        "stats": { ... },
        "deals": [ ... ]
    }
    """
    hotel_deals = hotel_deals or []

    # abr-2026l (#202): aplicar dedup fino ±1€ ANTES del schema unifier para
    # quitar entradas casi-iguales que no aportan valor. El stats con drops
    # por engine se incluye en `stats.engine_stats` para auditar qué fuente
    # genera más ruido.
    deduped_flights, dedup_engine_stats = dedup_close_prices(flight_deals, tolerance_eur=1.0)

    # Convertir vuelos al schema unificado
    unified_flights = [_flight_to_unified(f) for f in deduped_flights]

    # Combinar y ordenar por score
    all_deals = unified_flights + hotel_deals
    all_deals.sort(key=lambda x: x.get("score", 0), reverse=True)

    # Estadísticas para el dashboard
    by_class = defaultdict(int)
    by_region = defaultdict(int)
    by_cabin = defaultdict(int)

    for d in all_deals:
        by_class[d.get("classification", "NORMAL")] += 1
        by_region[d.get("region", "Desconocido")] += 1
        by_cabin[d.get("cabin", "economy")] += 1

    prices = [d["price_eur"] for d in all_deals if d.get("price_eur", 0) > 0]
    # abr-2026l: contar deals por engine — útil para alertas tipo "rapidapi
    # no aportó nada en el último hunt, ¿está degradado?".
    by_engine = defaultdict(int)
    for d in unified_flights:
        for src in d.get("sources", []) or []:
            by_engine[str(src)] += 1
    stats = {
        "total": len(all_deals),
        "flights": len(unified_flights),
        "hotels": len(hotel_deals),
        "by_classification": dict(by_class),
        "by_region": dict(by_region),
        "by_cabin": dict(by_cabin),
        "price_min": min(prices) if prices else 0,
        "price_max": max(prices) if prices else 0,
        "price_avg": round(sum(prices) / len(prices), 0) if prices else 0,
        "verified_count": sum(1 for d in all_deals if d.get("verified")),
        "by_engine": dict(by_engine),
        "engine_dedup_drops": dedup_engine_stats,
    }

    return {
        "schema_version": DEALS_SCHEMA_VERSION,
        "generated_at": datetime.now().isoformat(),
        "total_deals": len(all_deals),
        "stats": stats,
        "deals": all_deals,
    }


# ─────────────────────────────────────────────────────────────
# EXPORT JSON
# ─────────────────────────────────────────────────────────────

def export_deals_json(
    deals_obj: Dict,
    output_dir: str,
    filename: str = "deals.json",
) -> str:
    """
    Guarda deals.json en output_dir.
    También guarda un archivo histórico con timestamp.
    Returns la ruta del archivo principal.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Archivo principal (sobrescribe)
    main_path = os.path.join(output_dir, filename)
    with open(main_path, "w", encoding="utf-8") as f:
        json.dump(deals_obj, f, ensure_ascii=False, indent=2)

    print(f"   💾 deals.json guardado: {main_path} ({len(deals_obj.get('deals', []))} deals)")

    # Archivo histórico con timestamp
    ts = datetime.now().strftime("%Y%m%d_%H%M")
    hist_filename = f"deals_{ts}.json"
    hist_path = os.path.join(output_dir, "history", hist_filename)
    os.makedirs(os.path.dirname(hist_path), exist_ok=True)
    with open(hist_path, "w", encoding="utf-8") as f:
        json.dump(deals_obj, f, ensure_ascii=False, indent=2)

    return main_path


# ─────────────────────────────────────────────────────────────
# COMPARACIÓN CON EJECUCIÓN ANTERIOR (para alertas)
# ─────────────────────────────────────────────────────────────

def load_previous_deals(output_dir: str, filename: str = "deals.json") -> Dict[str, Dict]:
    """
    Carga deals.json de la ejecución anterior.
    Retorna dict keyed por deal_id para comparación rápida.
    """
    path = os.path.join(output_dir, filename)
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {d["id"]: d for d in data.get("deals", []) if "id" in d}
    except Exception as e:
        print(f"   ⚠️  No se pudo cargar deals anteriores: {e}")
        return {}


def find_new_deals(
    current_deals: List[Dict],
    previous_deals: Dict[str, Dict],
) -> List[Dict]:
    """
    Identifica deals nuevos que no estaban en la ejecución anterior.
    Solo devuelve deals con clasificación CRÍTICO o ERROR.
    """
    new_deals = []
    for deal in current_deals:
        deal_id = deal.get("id", "")
        classification = deal.get("classification", "")

        if classification not in ALERT_CLASSIFICATIONS:
            continue

        if deal_id not in previous_deals:
            new_deals.append(deal)
        else:
            # También alertar si el precio bajó significativamente
            prev = previous_deals[deal_id]
            prev_price = prev.get("price_eur", 9999)
            curr_price = deal.get("price_eur", 9999)
            if curr_price < prev_price * 0.85:  # > 15% más barato
                deal["price_drop_from"] = prev_price
                new_deals.append(deal)

    return new_deals


# ─────────────────────────────────────────────────────────────
# TELEGRAM ALERTS
# ─────────────────────────────────────────────────────────────

def _format_telegram_message(deal: Dict) -> str:
    """Formatea un deal para enviar por Telegram."""
    classification = deal.get("classification", "")
    emoji = "🔥" if classification == "CRÍTICO" else "⚡"
    price = deal.get("price_eur", 0)
    origin = deal.get("origin", "")
    city = deal.get("city_to", deal.get("destination", ""))
    cabin = deal.get("cabin", "economy").title()
    date_out = deal.get("date_out", "")
    stops = deal.get("stops", 0)
    score = deal.get("score", 0)
    booking_url = deal.get("booking_url", "")
    savings_pct = deal.get("savings_pct", 0)
    airline = deal.get("airline_name") or deal.get("airline", "")

    direct_str = "✈️ Directo" if stops == 0 else f"🔄 {stops} escala(s)"
    drop_str = ""
    if "price_drop_from" in deal:
        drop_str = f"\n📉 Bajó de {deal['price_drop_from']:.0f}€ a {price:.0f}€"

    msg = (
        f"{emoji} *{classification}: {city}*\n"
        f"💶 *{price:.0f}€* ({cabin}) desde {origin}\n"
        f"📅 {date_out} | {direct_str} | {airline}\n"
        f"💰 Ahorro estimado: {savings_pct:.0f}%"
        f"{drop_str}\n"
        f"🎯 Score: {score:.0f}/100\n"
    )
    if booking_url:
        msg += f"\n🔗 [Reservar ahora]({booking_url})"
    return msg


async def _send_telegram_message_async(
    session,
    bot_token: str,
    chat_id: str,
    text: str,
) -> bool:
    """Envía un mensaje por Telegram (async)."""
    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False,
    }
    try:
        async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"   ⚠️  Telegram error: {e}")
        return False


async def send_telegram_alerts_async(
    new_deals: List[Dict],
    bot_token: str,
    chat_id: str,
    max_alerts: int = 10,
) -> int:
    """
    Envía alertas Telegram para deals nuevos (async).
    Limita a max_alerts para no saturar.
    Returns número de alertas enviadas.
    """
    if not bot_token or not chat_id:
        print("   ⚠️  Telegram no configurado (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)")
        return 0

    if not AIOHTTP_AVAILABLE:
        print("   ⚠️  aiohttp no disponible para alertas Telegram")
        return 0

    if not new_deals:
        print("   ℹ️  Sin deals nuevos para alertar")
        return 0

    # Ordenar por score y limitar
    sorted_deals = sorted(new_deals, key=lambda x: x.get("score", 0), reverse=True)
    to_send = sorted_deals[:max_alerts]

    sent = 0
    timeout = aiohttp.ClientTimeout(total=15)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        for deal in to_send:
            msg = _format_telegram_message(deal)
            ok = await _send_telegram_message_async(session, bot_token, chat_id, msg)
            if ok:
                sent += 1
                print(f"   📱 Alerta enviada: {deal.get('city_to', '')} ({deal.get('price_eur', 0):.0f}€)")

    return sent


def send_telegram_alerts(
    new_deals: List[Dict],
    bot_token: str = None,
    chat_id: str = None,
    max_alerts: int = 10,
) -> int:
    """Wrapper síncrono para send_telegram_alerts_async."""
    bot_token = bot_token or config.TELEGRAM_BOT_TOKEN
    chat_id = chat_id or config.TELEGRAM_CHAT_ID

    if not bot_token or not chat_id:
        return 0

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future = pool.submit(
                    asyncio.run,
                    send_telegram_alerts_async(new_deals, bot_token, chat_id, max_alerts)
                )
                return future.result(timeout=60)
        else:
            return loop.run_until_complete(
                send_telegram_alerts_async(new_deals, bot_token, chat_id, max_alerts)
            )
    except Exception as e:
        print(f"   ⚠️  Error enviando alertas Telegram: {e}")
        return 0


# ─────────────────────────────────────────────────────────────
# PIPELINE PRINCIPAL
# ─────────────────────────────────────────────────────────────

def run_export(
    analyzed_flights: List[Dict],
    hotel_deals: List[Dict] = None,
    output_dir: str = None,
    send_alerts: bool = True,
    min_score: float = MIN_EXPORT_SCORE,
) -> Dict:
    """
    Orquesta el pipeline completo de exportación:
    1. Enriquecer deals con headline, tags, imagen, coords, expires_at
    2. Deduplicar cross-source
    3. Filtrar calidad mínima
    4. Detectar deals nuevos vs ejecución anterior
    5. Construir objeto deals.json unificado
    6. Guardar en disco
    7. Enviar alertas Telegram para nuevos CRÍTICO/ERROR

    Args:
        analyzed_flights: Lista de vuelos analizados por detector.analyze_all()
        hotel_deals: Lista opcional de deals de hotel (schema unificado)
        output_dir: Directorio de salida (default: ../output/ relativo al módulo)
        send_alerts: Si True, envía alertas Telegram para deals nuevos
        min_score: Score mínimo para incluir en el export

    Returns:
        El objeto deals_json exportado (para uso en tests/reporting).
    """
    if output_dir is None:
        _dir = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.join(_dir, "..")

    hotel_deals = hotel_deals or []

    print(f"\n📦 DEALS EXPORTER — Pipeline de exportación")
    print(f"   Vuelos de entrada: {len(analyzed_flights)}")

    # 1. Enriquecer (headline, tags, imagen, coords, expires_at)
    print(f"   🏷️  Enriqueciendo deals...")
    enriched = enrich_all(analyzed_flights)

    # 2. Deduplicar
    print(f"   🔀 Deduplicando cross-source...")
    deduped = dedup_flights(enriched)
    print(f"      {len(enriched)} → {len(deduped)} deals únicos")

    # 3. Filtrar calidad
    filtered = filter_quality(deduped, min_score=min_score)
    print(f"   🎯 Filtro de calidad: {len(deduped)} → {len(filtered)} deals")

    # 4. Detectar nuevos vs ejecución anterior
    previous_deals = load_previous_deals(output_dir)
    new_deals = find_new_deals(filtered, previous_deals)
    print(f"   🆕 Deals nuevos/actualizados: {len(new_deals)}")

    # 5. Construir JSON unificado
    deals_obj = build_unified_deals(filtered, hotel_deals)

    # 6. Guardar
    main_path = export_deals_json(deals_obj, output_dir)

    # 7. Alertas Telegram
    if send_alerts and new_deals:
        alert_deals = [d for d in new_deals if d.get("classification") in ALERT_CLASSIFICATIONS]
        if alert_deals:
            print(f"   📱 Enviando {len(alert_deals)} alertas Telegram...")
            sent = send_telegram_alerts(alert_deals)
            print(f"   ✅ {sent} alertas enviadas")

    # Resumen
    stats = deals_obj["stats"]
    print(f"\n   📊 Resumen export:")
    print(f"      Total deals: {stats['total']}")
    for cls, count in stats.get("by_classification", {}).items():
        emoji = {"CRÍTICO": "🔥", "ERROR": "⚡", "ANOMALÍA": "⚠️", "OFERTA": "💰"}.get(cls, "ℹ️")
        print(f"      {emoji} {cls}: {count}")
    print(f"      ✅ Verificados (2+ fuentes): {stats.get('verified_count', 0)}")

    return deals_obj
