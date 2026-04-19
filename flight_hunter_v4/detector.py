"""
Flight Hunter V4 — Detector Avanzado de Anomalías
===================================================
TÉCNICAS (8):
- T0: Error fare absoluto (precio imposiblemente bajo)
- T1: Comparación cross-date (misma ruta en distintas semanas)
- T1b: IQR outlier detection (skill statistical-analysis — robusto ante skew)
- T1c: Z-score con media/mediana (detección estadística normalizada)
- T4: Ratio Business/Economy (Business < 2-3x Economy = ERROR)
- T5: Caída vs. baseline histórico de la DB
- T6: Flash drop detector (caída brusca en < 24h)
- T7: Patrón de aerolínea (historial de error fares)

Mejoras estadísticas (skill data:statistical-analysis):
- IQR method: robusto ante distribuciones sesgadas de precios de vuelos
  Q1 - 1.5×IQR y Q3 + 1.5×IQR como límites de outlier
- Z-score: detecta precios > 2.5σ por debajo de la media de la ruta
- Siempre reportamos mean Y median: si divergen, la distribución está sesgada
- Percentil p10 como referencia de "precio bajo normal" (no error)

Scoring V4:
- Score 0-100 por cada vuelo
- Combina múltiples técnicas con pesos configurables
- Confianza multi-fuente
- Clasificación final: CRÍTICO / ERROR / ANOMALÍA / OFERTA
"""

from collections import defaultdict
from statistics import median, mean, stdev, quantiles
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
import math
import config
from geo_data import enrich_geo


# ══════════════════════════════════════════════════════
# UTILIDADES ESTADÍSTICAS (skill: statistical-analysis)
# ══════════════════════════════════════════════════════

def compute_iqr_bounds(prices: list) -> dict:
    """
    Calcula límites IQR para detección de outliers.
    Método robusto ante distribuciones sesgadas (precios de vuelos son right-skewed).

    Skill ref: "IQR method (robust to non-normal distributions)"
    Q1 - 1.5×IQR = lower_bound  → precios por debajo = outlier bajo (posible error)
    Q3 + 1.5×IQR = upper_bound  → precios por encima = outlier alto
    """
    if len(prices) < 4:
        return {"q1": None, "q3": None, "iqr": None, "lower": None, "upper": None}
    sorted_p = sorted(prices)
    n = len(sorted_p)
    q1 = sorted_p[n // 4]
    q3 = sorted_p[(3 * n) // 4]
    iqr = q3 - q1
    return {
        "q1": q1, "q3": q3, "iqr": iqr,
        "lower": q1 - 1.5 * iqr,
        "upper": q3 + 1.5 * iqr,
        "median": sorted_p[n // 2],
        "mean": mean(prices),
        "p10": sorted_p[max(0, n // 10)],
        "p90": sorted_p[min(n - 1, (9 * n) // 10)],
    }


def compute_zscore(price: float, prices: list) -> float:
    """
    Z-score de un precio respecto a la distribución de precios de la ruta.
    z = (x - μ) / σ
    Un z-score muy negativo (< -2.5) indica precio anómalamente bajo.
    Skill ref: "Z-score method (for normally distributed data)"
    """
    if len(prices) < 5:
        return 0.0
    try:
        mu = mean(prices)
        sigma = stdev(prices)
        if sigma == 0:
            return 0.0
        return (price - mu) / sigma
    except Exception:
        return 0.0


# ══════════════════════════════════════════════════════
# CLASIFICACIONES
# ══════════════════════════════════════════════════════

CLASS_CRITICO  = "CRÍTICO"   # Error fare confirmado por 3+ técnicas o score muy alto
CLASS_ERROR    = "ERROR"     # Error fare detectado por 2+ técnicas
CLASS_ANOMALIA = "ANOMALÍA"  # Precio inusualmente bajo
CLASS_OFERTA   = "OFERTA"    # Precio muy bueno pero no error
CLASS_NORMAL   = "NORMAL"    # Precio normal

SCORE_CRITICO  = 75
SCORE_ERROR    = 50
SCORE_ANOMALIA = 30
SCORE_OFERTA   = 15

# Aerolíneas low-cost: un vuelo de 15€ MRS→PMI es NORMAL, no un error fare.
# Para estas aerolíneas, T0 solo se activa si el precio es extremadamente bajo
# (< 8€ corto, < 30€ medio, < 80€ largo). CLASS_CRITICO requiere también T4.
LOWCOST_AIRLINES_DETECTOR = config.LOWCOST_AIRLINES

# Umbrales T0 para low-cost (mucho más permisivos)
LOWCOST_T0_THRESHOLDS = {
    "corto":       8,    # < 8€ en low-cost = sí podría ser error
    "medio":       30,   # < 30€ en low-cost = anomalía
    "largo":       80,   # < 80€ en low-cost = posible error
    "ultra_largo": 150,  # < 150€ en low-cost = posible error
}


def classify_by_score(score: float, techniques_triggered: int, is_lowcost: bool = False) -> str:
    """
    Clasifica un vuelo basándose en su score y técnicas disparadas.

    Reglas reforzadas para evitar falsos positivos:
    - CRÍTICO: score >= 75 Y >= 3 técnicas (o 2 si no es low-cost)
    - ERROR: score >= 50 Y >= 2 técnicas
    - Low-cost: CLASS_CRITICO requiere siempre >= 3 técnicas
    """
    min_techniques_critico = 3 if is_lowcost else 2
    if score >= SCORE_CRITICO and techniques_triggered >= min_techniques_critico:
        return CLASS_CRITICO
    elif score >= SCORE_ERROR and techniques_triggered >= 2:
        return CLASS_ERROR
    elif score >= SCORE_ANOMALIA:
        return CLASS_ANOMALIA
    elif score >= SCORE_OFERTA:
        return CLASS_OFERTA
    return CLASS_NORMAL


# ══════════════════════════════════════════════════════
# T0: ERROR FARE ABSOLUTO
# ══════════════════════════════════════════════════════

def t0_absolute_error_fare(flights: List[Dict]) -> List[Dict]:
    """
    T0: Detecta precios por debajo de umbrales absolutos.
    Precio < X€ para una ruta determinada = imposible en condiciones normales.

    Retorna lista de vuelos con 't0_triggered' y 't0_score'.
    """
    results = []
    for f in flights:
        price = f.get("price_eur", 0)
        cabin = f.get("cabin_code", config.CABIN_ECONOMY)
        dest = f.get("destination", "")
        dist = f.get("distance_category") or config.get_distance_category(dest)
        airline = f.get("airline", "")
        is_lowcost = airline in LOWCOST_AIRLINES_DETECTOR

        t0_score = 0
        t0_triggered = False
        t0_reason = ""

        if is_lowcost:
            # Low-cost: solo activar T0 si el precio es absurdamente bajo
            lowcost_threshold = LOWCOST_T0_THRESHOLDS.get(dist, 30)
            if price < lowcost_threshold:
                t0_triggered = True
                t0_score = min(30, 15 + (lowcost_threshold - price) / max(1, lowcost_threshold) * 30)
                t0_reason = f"[Low-cost] Precio {price:.0f}€ por debajo de umbral low-cost {lowcost_threshold:.0f}€ ({dist})"
        else:
            # Aerolíneas regulares: usar umbrales normales
            if config.is_error_fare(price, cabin, dest):
                t0_triggered = True
                thresholds = config.ERROR_FARE_ABSOLUTE_THRESHOLDS.get(cabin, {})
                threshold = thresholds.get(dist, 999)
                gap = (threshold - price) / threshold * 100
                t0_score = min(50, 20 + gap * 0.5)
                t0_reason = f"Precio {price:.0f}€ por debajo de umbral absoluto {threshold:.0f}€ ({gap:.0f}% por debajo)"

            # Verificar rango normal (solo para aerolíneas no low-cost)
            normal_range = config.PRICE_THRESHOLDS.get(cabin, {}).get(dist, (0, 9999))
            low_normal, _ = normal_range
            if price < low_normal * 0.5 and not t0_triggered:
                t0_triggered = True
                t0_score = 25
                t0_reason = f"Precio {price:.0f}€ < 50% del mínimo normal {low_normal:.0f}€"

        results.append({
            **f,
            "t0_triggered": t0_triggered,
            "t0_score": t0_score,
            "t0_reason": t0_reason,
            "is_lowcost": is_lowcost,
        })

    return results


# ══════════════════════════════════════════════════════
# T1: COMPARACIÓN CROSS-DATE
# ══════════════════════════════════════════════════════

def t1_cross_date(flights: List[Dict]) -> List[Dict]:
    """
    T1: Compara el precio de una ruta en distintas fechas.
    Si un vuelo es significativamente más barato que las otras fechas
    para la misma ruta, es una anomalía.
    """
    # Agrupar por (origen, destino, aerolínea, cabina)
    route_prices = defaultdict(list)
    for f in flights:
        key = (f["origin"], f["destination"], f.get("airline", ""), f.get("cabin_code", 1))
        route_prices[key].append(f["price_eur"])

    results = []
    for f in flights:
        key = (f["origin"], f["destination"], f.get("airline", ""), f.get("cabin_code", 1))
        prices = route_prices[key]
        price = f["price_eur"]

        t1_triggered = False
        t1_score = 0
        t1_reason = ""

        if len(prices) >= 3:
            median_price = median(prices)
            if median_price > 0 and price < median_price:
                drop_pct = (median_price - price) / median_price * 100
                if drop_pct >= config.ANOMALY_THRESHOLDS["error"]:
                    t1_triggered = True
                    t1_score = min(35, drop_pct * 0.5)
                    t1_reason = f"Precio {drop_pct:.0f}% por debajo de la mediana ({median_price:.0f}€) para esta ruta"
                elif drop_pct >= config.ANOMALY_THRESHOLDS["anomalia"]:
                    t1_triggered = True
                    t1_score = min(20, drop_pct * 0.4)
                    t1_reason = f"Precio {drop_pct:.0f}% por debajo de la mediana ({median_price:.0f}€)"
                elif drop_pct >= config.ANOMALY_THRESHOLDS["oferta"]:
                    t1_triggered = True
                    t1_score = 10
                    t1_reason = f"Precio {drop_pct:.0f}% por debajo de la mediana"

        results.append({
            **f,
            "t1_triggered": t1_triggered,
            "t1_score": t1_score,
            "t1_reason": t1_reason,
        })

    return results


# ══════════════════════════════════════════════════════
# T1b: IQR OUTLIER DETECTION (statistical-analysis skill)
# ══════════════════════════════════════════════════════

def t1b_iqr_outlier(flights: List[Dict]) -> List[Dict]:
    """
    T1b: Detecta outliers usando el método IQR.
    Robusto ante distribuciones sesgadas (los precios de vuelos son right-skewed).

    Un precio < Q1 - 1.5×IQR para su ruta+cabina es un outlier bajo estadístico.
    Cuanto más por debajo del límite, mayor el score.

    Skill ref: IQR method — "robust to non-normal distributions"
    """
    # Agrupar precios por (origin, destination, cabin_code)
    route_prices = defaultdict(list)
    for f in flights:
        key = (f.get("origin"), f.get("destination"), f.get("cabin_code", 1))
        route_prices[key].append(f.get("price_eur", 0))

    # Pre-calcular estadísticas IQR por ruta
    route_stats = {}
    for key, prices in route_prices.items():
        if len(prices) >= 4:
            route_stats[key] = compute_iqr_bounds(prices)

    results = []
    for f in flights:
        key = (f.get("origin"), f.get("destination"), f.get("cabin_code", 1))
        stats = route_stats.get(key)
        price = f.get("price_eur", 0)

        t1b_triggered = False
        t1b_score = 0
        t1b_reason = ""

        if stats and stats["lower"] is not None:
            lower = stats["lower"]
            q1 = stats["q1"]
            median_p = stats["median"]
            mean_p = stats["mean"]

            if price < lower:
                # Precio es outlier bajo según IQR
                gap_pct = (lower - price) / lower * 100 if lower > 0 else 0
                t1b_triggered = True
                t1b_score = min(35, 15 + gap_pct * 0.5)
                t1b_reason = (
                    f"Outlier IQR: {price:.0f}€ < límite inferior {lower:.0f}€ "
                    f"(mediana: {median_p:.0f}€, media: {mean_p:.0f}€)"
                )
                # Nota: si median >> mean, hay skew — el precio es aún más anómalo
                if mean_p > median_p * 1.3:
                    t1b_score *= 1.2
                    t1b_reason += " — distribución sesgada (media > mediana 30%)"
            elif price < q1:
                # Precio en Q1 — bajo pero no outlier extremo
                t1b_triggered = True
                t1b_score = 8
                t1b_reason = f"Precio en percentil <25% de la ruta (Q1={q1:.0f}€)"

        results.append({
            **f,
            "t1b_triggered": t1b_triggered,
            "t1b_score": min(40, t1b_score),
            "t1b_reason": t1b_reason,
        })

    return results


# ══════════════════════════════════════════════════════
# T1c: Z-SCORE (statistical-analysis skill)
# ══════════════════════════════════════════════════════

def t1c_zscore(flights: List[Dict]) -> List[Dict]:
    """
    T1c: Z-score por ruta+cabina.
    z = (precio - media) / desv_std
    z < -2.5 indica precio anómalamente bajo (> 2.5σ por debajo de la media).

    Complementa IQR: IQR es mejor para distribuciones sesgadas,
    z-score es mejor cuando tenemos >30 observaciones y distribución más simétrica.
    Skill ref: "Z-score method (for normally distributed data)"
    """
    route_prices = defaultdict(list)
    for f in flights:
        key = (f.get("origin"), f.get("destination"), f.get("cabin_code", 1))
        route_prices[key].append(f.get("price_eur", 0))

    results = []
    for f in flights:
        key = (f.get("origin"), f.get("destination"), f.get("cabin_code", 1))
        prices = route_prices.get(key, [])
        price = f.get("price_eur", 0)

        t1c_triggered = False
        t1c_score = 0
        t1c_reason = ""
        t1c_zscore_val = None

        if len(prices) >= 8:  # Necesitamos más datos para z-score
            z = compute_zscore(price, prices)
            t1c_zscore_val = round(z, 2)

            if z < -3.0:
                t1c_triggered = True
                t1c_score = min(35, abs(z) * 8)
                t1c_reason = f"Z-score extremo: {z:.2f}σ (precio {abs(z):.1f}σ por debajo de la media)"
            elif z < -2.5:
                t1c_triggered = True
                t1c_score = min(25, abs(z) * 6)
                t1c_reason = f"Z-score bajo: {z:.2f}σ — precio estadísticamente anómalo"
            elif z < -2.0:
                t1c_triggered = True
                t1c_score = 10
                t1c_reason = f"Z-score inusual: {z:.2f}σ"

        results.append({
            **f,
            "t1c_triggered": t1c_triggered,
            "t1c_score": t1c_score,
            "t1c_reason": t1c_reason,
            "t1c_zscore": t1c_zscore_val,
        })

    return results


# ══════════════════════════════════════════════════════
# T4: RATIO BUSINESS/ECONOMY (más sofisticado)
# ══════════════════════════════════════════════════════

def t4_business_economy_ratio(flights: List[Dict]) -> List[Dict]:
    """
    T4: Detecta anomalías en el ratio Business/Economy.

    Cuando Business cuesta solo 1.5-2x Economy en rutas largas,
    es casi siempre un error fare. El ratio normal transatlántico es 5-8x.

    Esta técnica solo actúa cuando hay vuelos de ambas cabinas disponibles.
    """
    # Indexar economy: clave = (origin, destination, date_out aprox)
    eco_prices = defaultdict(list)
    for f in flights:
        if f.get("cabin_code", 0) == config.CABIN_ECONOMY:
            # Clave flexible: misma ruta ±3 días
            key = (f["origin"], f["destination"])
            eco_prices[key].append(f["price_eur"])

    results = []
    for f in flights:
        cabin = f.get("cabin_code", config.CABIN_ECONOMY)
        dest = f.get("destination", "")

        t4_triggered = False
        t4_score = 0
        t4_reason = ""
        t4_ratio = None
        t4_eco_price = None

        if cabin in (config.CABIN_BUSINESS, config.CABIN_FIRST):
            key = (f["origin"], dest)
            eco = eco_prices.get(key, [])
            if eco:
                eco_min = min(eco)
                biz_price = f["price_eur"]
                ratio = biz_price / eco_min if eco_min > 0 else 99
                t4_ratio = round(ratio, 2)
                t4_eco_price = round(eco_min, 0)

                bec_class = config.classify_ratio(ratio, dest)

                if bec_class == "ERROR":
                    t4_triggered = True
                    t4_score = 45
                    t4_reason = f"Ratio B/E {ratio:.1f}x (normal: 4-8x) — posible ERROR FARE"
                elif bec_class == "ANOMALIA":
                    t4_triggered = True
                    t4_score = 25
                    t4_reason = f"Ratio B/E {ratio:.1f}x — precio Business inusualmente bajo"
                elif bec_class == "OFERTA":
                    t4_triggered = True
                    t4_score = 12
                    t4_reason = f"Ratio B/E {ratio:.1f}x — Business a buen precio"

        results.append({
            **f,
            "t4_triggered": t4_triggered,
            "t4_score": t4_score,
            "t4_reason": t4_reason,
            "t4_ratio": t4_ratio,
            "t4_eco_price": t4_eco_price,
        })

    return results


# ══════════════════════════════════════════════════════
# T5: COMPARACIÓN CON HISTÓRICO DE BASE DE DATOS
# ══════════════════════════════════════════════════════

def t5_historical_baseline(flights: List[Dict], historical_data: Dict) -> List[Dict]:
    """
    T5: Compara precios actuales vs. baseline histórico almacenado en DB.
    Si el precio cae > 30% respecto al promedio de los últimos 30 días,
    es una anomalía.

    Args:
        flights: Vuelos actuales
        historical_data: Dict {(origin, dest, cabin): [historical_prices]}
    """
    results = []
    for f in flights:
        key = (f["origin"], f["destination"], f.get("cabin_code", 1))
        history = historical_data.get(key, [])
        price = f["price_eur"]

        t5_triggered = False
        t5_score = 0
        t5_reason = ""
        t5_baseline = None

        if len(history) >= 5:
            baseline = mean(history)
            t5_baseline = round(baseline, 0)
            if baseline > 0 and price < baseline:
                drop_pct = (baseline - price) / baseline * 100
                if drop_pct >= config.ANOMALY_THRESHOLDS["error"]:
                    t5_triggered = True
                    t5_score = min(40, drop_pct * 0.6)
                    t5_reason = f"Precio {drop_pct:.0f}% por debajo del baseline histórico ({baseline:.0f}€)"
                elif drop_pct >= config.ANOMALY_THRESHOLDS["anomalia"]:
                    t5_triggered = True
                    t5_score = min(20, drop_pct * 0.4)
                    t5_reason = f"Precio {drop_pct:.0f}% por debajo del histórico ({baseline:.0f}€)"

        results.append({
            **f,
            "t5_triggered": t5_triggered,
            "t5_score": t5_score,
            "t5_reason": t5_reason,
            "t5_baseline": t5_baseline,
        })

    return results


# ══════════════════════════════════════════════════════
# T6: FLASH DROP (caída brusca reciente)
# ══════════════════════════════════════════════════════

def t6_flash_drop(flights: List[Dict], recent_prices: Dict) -> List[Dict]:
    """
    T6: Detecta caídas de precio bruscas en las últimas 24h.
    Una caída > 25% en < 24h es típico de un error fare publicado por error.

    Args:
        recent_prices: Dict {(origin, dest, cabin, airline): precio_hace_<24h}
    """
    results = []
    for f in flights:
        key = (f["origin"], f["destination"], f.get("cabin_code", 1), f.get("airline", ""))
        prev_price = recent_prices.get(key)
        price = f["price_eur"]

        t6_triggered = False
        t6_score = 0
        t6_reason = ""

        if prev_price and prev_price > 0:
            drop_pct = (prev_price - price) / prev_price * 100
            if drop_pct >= 40:
                t6_triggered = True
                t6_score = 40
                t6_reason = f"FLASH DROP: cayó {drop_pct:.0f}% en < 24h (antes: {prev_price:.0f}€)"
            elif drop_pct >= 25:
                t6_triggered = True
                t6_score = 25
                t6_reason = f"Flash drop: cayó {drop_pct:.0f}% en < 24h (antes: {prev_price:.0f}€)"

        results.append({
            **f,
            "t6_triggered": t6_triggered,
            "t6_score": t6_score,
            "t6_reason": t6_reason,
        })

    return results


# ══════════════════════════════════════════════════════
# T7: AEROLÍNEA CON HISTORIAL DE ERROR FARES
# ══════════════════════════════════════════════════════

def t7_airline_pattern(flights: List[Dict]) -> List[Dict]:
    """
    T7: Las aerolíneas con historial de error fares frecuentes reciben
    un boost en el score. Cuando el precio ya es bajo Y la aerolínea
    es propensa a errores, la probabilidad se amplifica.
    """
    results = []
    for f in flights:
        airline = f.get("airline", "")
        cabin = f.get("cabin_code", config.CABIN_ECONOMY)

        t7_triggered = False
        t7_score = 0
        t7_reason = ""

        # Solo boosteamos si el precio ya es sospechoso
        is_suspicious = f.get("t0_triggered") or f.get("t4_triggered")

        if is_suspicious and airline in config.AIRLINES_ERROR_PRONE:
            t7_triggered = True
            t7_score = 15
            t7_reason = f"{airline} tiene historial de error fares frecuentes"

        if cabin == config.CABIN_BUSINESS and airline in config.AIRLINES_PREMIUM_BUSINESS:
            # Business premium a precio sospechoso = deal muy valioso
            if is_suspicious:
                t7_triggered = True
                t7_score = max(t7_score, 20)
                t7_reason = (t7_reason + f" | " if t7_reason else "") + \
                    f"{airline} ofrece Business premium — deal de máximo valor"

        results.append({
            **f,
            "t7_triggered": t7_triggered,
            "t7_score": t7_score,
            "t7_reason": t7_reason,
        })

    return results


# ══════════════════════════════════════════════════════
# ANÁLISIS COMPLETO — PIPELINE PRINCIPAL
# ══════════════════════════════════════════════════════

def analyze_all(
    flights: List[Dict],
    historical_data: Dict = None,
    recent_prices: Dict = None,
    min_score: float = SCORE_OFERTA,
) -> List[Dict]:
    """
    Pipeline completo de detección: aplica todas las técnicas y calcula
    el score final y la clasificación.

    Args:
        flights: Lista de vuelos a analizar
        historical_data: {(origin, dest, cabin): [prices]} de la DB
        recent_prices: {(origin, dest, cabin, airline): precio_reciente} para T6
        min_score: Score mínimo para incluir en resultados (default: OFERTA)

    Returns:
        Lista de vuelos con anomalías, ordenados por score descendente.
        Solo incluye vuelos con score >= min_score.
    """
    if not flights:
        return []

    historical_data = historical_data or {}
    recent_prices = recent_prices or {}

    # Pre-paso: geo-enrich + normalizar cabin + distance_category
    for f in flights:
        enrich_geo(f)
        # Normalizar cabin a lowercase
        if "cabin" in f:
            f["cabin"] = str(f["cabin"]).lower()
        # Recalcular distance_category con la corrección de aeropuertos europeos
        if not f.get("distance_category") or f.get("distance_category") == "largo":
            dest = f.get("destination", "")
            if dest:
                f["distance_category"] = config.get_distance_category(dest)

    # Aplicar técnicas en secuencia
    print(f"\n   🧠 Analizando {len(flights)} vuelos con 8 técnicas...")

    flights = t0_absolute_error_fare(flights)
    flights = t1_cross_date(flights)
    flights = t1b_iqr_outlier(flights)   # IQR — robusto ante distribuciones sesgadas
    flights = t1c_zscore(flights)         # Z-score — complementa IQR con normalización
    flights = t4_business_economy_ratio(flights)
    flights = t5_historical_baseline(flights, historical_data)
    flights = t6_flash_drop(flights, recent_prices)
    flights = t7_airline_pattern(flights)

    # Calcular score final y clasificación
    analyzed = []
    for f in flights:
        # Sumar scores de todas las técnicas
        raw_score = (
            f.get("t0_score",  0) * 1.0 +
            f.get("t1_score",  0) * 0.8 +
            f.get("t1b_score", 0) * 0.9 +  # IQR — peso similar a cross-date
            f.get("t1c_score", 0) * 0.7 +  # Z-score — complementario, peso algo menor
            f.get("t4_score",  0) * 1.2 +  # T4 (B/E ratio) tiene más peso
            f.get("t5_score",  0) * 0.9 +
            f.get("t6_score",  0) * 1.1 +  # Flash drops tienen más urgencia
            f.get("t7_score",  0) * 0.5    # Boost de aerolínea es complementario
        )

        # Contar técnicas disparadas
        techniques = [
            "t0"  if f.get("t0_triggered")  else None,
            "t1"  if f.get("t1_triggered")  else None,
            "t1b" if f.get("t1b_triggered") else None,
            "t1c" if f.get("t1c_triggered") else None,
            "t4"  if f.get("t4_triggered")  else None,
            "t5"  if f.get("t5_triggered")  else None,
            "t6"  if f.get("t6_triggered")  else None,
            "t7"  if f.get("t7_triggered")  else None,
        ]
        techniques_triggered = [t for t in techniques if t]
        n_techniques = len(techniques_triggered)

        # Bonus por múltiples técnicas (confirma el error)
        if n_techniques >= 3:
            raw_score *= 1.4
        elif n_techniques >= 2:
            raw_score *= 1.2

        # Score final 0-100
        final_score = min(100, raw_score)

        if final_score < min_score:
            continue

        # Clasificación (con corrección low-cost)
        is_lowcost = f.get("is_lowcost", False)
        classification = classify_by_score(final_score, n_techniques, is_lowcost=is_lowcost)

        # Calcular ahorro estimado
        savings_info = _compute_savings(f)

        # Razones combinadas
        reasons = [
            r for r in [
                f.get("t0_reason"),  f.get("t1_reason"),
                f.get("t1b_reason"), f.get("t1c_reason"),
                f.get("t4_reason"),  f.get("t5_reason"),
                f.get("t6_reason"),  f.get("t7_reason"),
            ] if r
        ]

        analyzed.append({
            **f,
            "final_score": round(final_score, 1),
            "classification": classification,
            "techniques_triggered": techniques_triggered,
            "n_techniques": n_techniques,
            "reasons": reasons,
            "main_reason": reasons[0] if reasons else "Precio inusualmente bajo",
            **savings_info,
        })

    # Ordenar por score descendente
    analyzed.sort(key=lambda x: x["final_score"], reverse=True)

    # Stats de clasificación
    by_class = defaultdict(int)
    for a in analyzed:
        by_class[a["classification"]] += 1

    print(f"   ✅ {len(analyzed)} anomalías detectadas:")
    for cls in [CLASS_CRITICO, CLASS_ERROR, CLASS_ANOMALIA, CLASS_OFERTA]:
        if by_class[cls]:
            print(f"      {'🚨' if cls == CLASS_CRITICO else '❌' if cls == CLASS_ERROR else '⚠️' if cls == CLASS_ANOMALIA else '💰'} {cls}: {by_class[cls]}")

    return analyzed


def _compute_savings(f: Dict) -> Dict:
    """Calcula el ahorro estimado de un vuelo."""
    price = f.get("price_eur", 0)
    cabin = f.get("cabin_code", config.CABIN_ECONOMY)
    dest = f.get("destination", "")
    dist = f.get("distance_category") or config.get_distance_category(dest)

    # Precio normal estimado
    normal_range = config.PRICE_THRESHOLDS.get(cabin, {}).get(dist, (price, price * 2))
    normal_low, normal_high = normal_range
    normal_mid = (normal_low + normal_high) / 2

    # Si tenemos baseline histórico, usarlo
    baseline = f.get("t5_baseline")
    if baseline and baseline > price:
        normal_mid = baseline

    savings_eur = max(0, normal_mid - price)
    savings_pct = (savings_eur / normal_mid * 100) if normal_mid > 0 else 0

    return {
        "estimated_normal_price": round(normal_mid, 0),
        "savings_eur": round(savings_eur, 0),
        "savings_pct": round(savings_pct, 1),
    }


# ══════════════════════════════════════════════════════
# RANKINGS
# ══════════════════════════════════════════════════════

def rank_by_score(analyzed: List[Dict], top_n: int = 50) -> List[Dict]:
    """Top N por score final (mejor detección combinada)."""
    return sorted(analyzed, key=lambda x: x.get("final_score", 0), reverse=True)[:top_n]


def rank_by_savings(analyzed: List[Dict], cabin: int = None, top_n: int = 50) -> List[Dict]:
    """Top N por ahorro en EUR."""
    filtered = [f for f in analyzed if cabin is None or f.get("cabin_code") == cabin]
    return sorted(filtered, key=lambda x: x.get("savings_eur", 0), reverse=True)[:top_n]


def rank_cheapest_business(analyzed: List[Dict], top_n: int = 30) -> List[Dict]:
    """Top N Business más baratos (para modo Business Hunter)."""
    biz = [f for f in analyzed if f.get("cabin_code") in (config.CABIN_BUSINESS, config.CABIN_FIRST)]
    return sorted(biz, key=lambda x: x.get("price_eur", 9999))[:top_n]


def rank_best_ratio(analyzed: List[Dict], top_n: int = 20) -> List[Dict]:
    """Top N mejores ratios B/E (Business a precio de economy)."""
    with_ratio = [f for f in analyzed if f.get("t4_ratio") is not None and f.get("t4_triggered")]
    return sorted(with_ratio, key=lambda x: x.get("t4_ratio", 99))[:top_n]


# ══════════════════════════════════════════════════════
# GENERACIÓN DE REPORTE MARKDOWN
# ══════════════════════════════════════════════════════

def generate_markdown_report(
    analyzed: List[Dict],
    search_params: Dict,
    stats: Dict = None,
) -> str:
    """Genera reporte Markdown con los mejores hallazgos."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = []

    criticos = [a for a in analyzed if a["classification"] == CLASS_CRITICO]
    errores  = [a for a in analyzed if a["classification"] == CLASS_ERROR]
    anomalias = [a for a in analyzed if a["classification"] == CLASS_ANOMALIA]
    ofertas  = [a for a in analyzed if a["classification"] == CLASS_OFERTA]

    lines.append(f"# ✈️ FLIGHT HUNTER V4 — Resultados")
    lines.append(f"*Generado: {now}*\n")
    lines.append(f"**Orígenes:** {', '.join(search_params.get('origins', [])[:5])}{'...' if len(search_params.get('origins', [])) > 5 else ''}")
    lines.append(f"**Modo:** {search_params.get('mode', 'custom')}")
    lines.append(f"**Cabina:** {search_params.get('cabin', 'Economy')}")
    lines.append(f"**Rango:** {search_params.get('date_from', '')} → {search_params.get('date_to', '')}\n")

    lines.append(f"---\n")
    lines.append(f"## 📊 Resumen")
    lines.append(f"- 🚨 **CRÍTICOS** (error fare confirmado): {len(criticos)}")
    lines.append(f"- ❌ **ERRORES** (posible error fare): {len(errores)}")
    lines.append(f"- ⚠️ **ANOMALÍAS**: {len(anomalias)}")
    lines.append(f"- 💰 **OFERTAS**: {len(ofertas)}")
    lines.append(f"- **Total analizado**: {len(analyzed)} vuelos\n")

    def format_deal(deal: Dict, rank: int) -> List[str]:
        lines = []
        cabin = deal.get("cabin", "Economy")
        price = deal.get("price_eur", 0)
        origin = deal.get("origin", "")
        dest = deal.get("destination", "")
        city = deal.get("city_to", dest)
        country = deal.get("country_to", "")
        airline = deal.get("airline", "")
        date_out = deal.get("date_out", "")
        date_ret = deal.get("date_ret", "")
        stops = deal.get("stops", 0)
        score = deal.get("final_score", 0)
        booking = deal.get("booking_url", "")
        savings_eur = deal.get("savings_eur", 0)
        savings_pct = deal.get("savings_pct", 0)
        ratio = deal.get("t4_ratio")

        eco_price = deal.get("t4_eco_price") or deal.get("bec_eco_price")

        lines.append(f"### {rank}. {origin} → {city} ({dest}), {country}")
        lines.append(f"**{cabin.upper()}** | **{price:.0f}€** | {airline}")
        lines.append(f"📅 {date_out} → {date_ret} | {'✈️ Directo' if stops == 0 else f'🔄 {stops} escala(s)'}")

        if ratio and eco_price:
            lines.append(f"💡 Economy: {eco_price:.0f}€ | Business: {price:.0f}€ | **Ratio: {ratio:.1f}x** (normal: 5-8x)")

        if savings_eur > 0:
            lines.append(f"💰 Ahorro estimado: **{savings_eur:.0f}€** ({savings_pct:.0f}% descuento)")

        lines.append(f"🎯 Score: {score:.0f}/100 | Técnicas: {', '.join(deal.get('techniques_triggered', []))}")

        for reason in deal.get("reasons", [])[:2]:
            lines.append(f"📌 {reason}")

        if booking:
            lines.append(f"🔗 [**RESERVAR AHORA**]({booking})")

        lines.append("")
        return lines

    # Sección CRÍTICOS
    if criticos:
        lines.append(f"\n---\n## 🚨 ERROR FARES CRÍTICOS ({len(criticos)} encontrados)")
        lines.append("*Precios confirmados por múltiples técnicas — ACTUAR RÁPIDO*\n")
        for i, deal in enumerate(criticos[:20], 1):
            lines.extend(format_deal(deal, i))

    # Sección ERRORES
    if errores:
        lines.append(f"\n---\n## ❌ POSIBLES ERROR FARES ({len(errores)} encontrados)\n")
        for i, deal in enumerate(errores[:15], 1):
            lines.extend(format_deal(deal, i))

    # Sección ANOMALÍAS
    if anomalias:
        lines.append(f"\n---\n## ⚠️ ANOMALÍAS DE PRECIO ({len(anomalias)} encontradas)\n")
        for i, deal in enumerate(anomalias[:10], 1):
            lines.extend(format_deal(deal, i))

    # Top Business más baratos
    biz_deals = rank_cheapest_business(analyzed, top_n=10)
    if biz_deals:
        lines.append(f"\n---\n## 👑 TOP 10 BUSINESS MÁS BARATOS\n")
        for i, deal in enumerate(biz_deals, 1):
            lines.extend(format_deal(deal, i))

    # Footer
    lines.append(f"\n---")
    lines.append(f"*Flight Hunter V4 | {now} | {len(analyzed)} vuelos analizados*")

    return "\n".join(lines)
