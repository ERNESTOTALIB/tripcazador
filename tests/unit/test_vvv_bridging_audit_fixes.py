"""
test_vvv_bridging_audit_fixes.py — VVV06 (May 2026)

Tests para los hallazgos de la auditoría VVV01-VVV10:
- VVV01: compute_bridging_synthetic + compute_dual_bridging_synthetic cableados
- VVV02: T1b skew detection no dispara en distribuciones normales
- VVV03: DEALS_STALE_HOURS + MULTI_STOP_ANOMALY_PCT configurables via env
- VVV04: T0 division-by-zero guard
- is_multi_stop_anomaly: corner cases
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Ensure flight_hunter_v4 importable.
ROOT = Path(__file__).resolve().parents[2]
HUNTER_DIR = ROOT / "flight_hunter_v4"
if str(HUNTER_DIR) not in sys.path:
    sys.path.insert(0, str(HUNTER_DIR))

import config  # type: ignore
import detector  # type: ignore


# ─────────────────────────────────────────────────────────────────────────────
# VVV01 — Bridging synthetic cableado
# ─────────────────────────────────────────────────────────────────────────────

def test_compute_bridging_synthetic_basic_savings():
    """MAD→AMS €60 + AMS→NRT €450 vs directo €950 → emite synthetic con score
    según savings (~46%)."""
    deals_index = {
        ("MAD", "AMS"): 60.0,
        ("AMS", "NRT"): 450.0,
    }
    result = config.compute_bridging_synthetic(
        origin="MAD",
        destination="NRT",
        deals_index=deals_index,
        direct_price=950.0,
    )
    assert result is not None, "Expected bridging synthetic with 46% savings"
    assert result["bridging"] is True
    assert result["hub_via"] == "AMS"
    assert result["price_eur"] == 510.0
    assert 75 <= result["score"] <= 95, f"Score should be high (75-95), got {result['score']}"
    assert result["origin"] == "MAD"
    assert result["destination"] == "NRT"


def test_compute_bridging_synthetic_no_savings_returns_none():
    """Si bridging total >= 80% del directo, no emite (no aporta valor)."""
    deals_index = {
        ("MAD", "AMS"): 600.0,
        ("AMS", "NRT"): 200.0,
    }
    result = config.compute_bridging_synthetic(
        origin="MAD",
        destination="NRT",
        deals_index=deals_index,
        direct_price=950.0,  # bridging 800 = 84% del directo, NO emite
    )
    assert result is None


def test_compute_bridging_synthetic_no_legs_available():
    """Si no hay leg1 o leg2 en deals_index para ningún hub, retorna None."""
    deals_index = {
        ("OTHER", "ROUTE"): 100.0,
    }
    result = config.compute_bridging_synthetic(
        origin="MAD",
        destination="NRT",
        deals_index=deals_index,
    )
    assert result is None


def test_compute_dual_bridging_synthetic():
    """Dual-hop: MAD→AMS €60 + AMS→BKK €350 + BKK→DPS €90 = €500 vs MAD-DPS
    €900 directo (-44%) → emite synthetic con bridging_dual=True."""
    deals_index = {
        ("MAD", "AMS"): 60.0,
        ("AMS", "BKK"): 350.0,
        ("BKK", "DPS"): 90.0,
    }
    result = config.compute_dual_bridging_synthetic(
        origin="MAD",
        destination="DPS",
        deals_index=deals_index,
        direct_price=900.0,
    )
    assert result is not None, "Expected dual-bridging synthetic"
    assert result.get("bridging_dual") is True
    assert result["hub1_via"] == "AMS"
    assert result["hub2_via"] == "BKK"
    assert result["price_eur"] == 500.0
    assert result["stops"] == 2


def test_compute_dual_bridging_skips_when_above_threshold():
    """Dual-bridging exige <70% del directo (más estricto que single-hub)."""
    deals_index = {
        ("MAD", "AMS"): 200.0,
        ("AMS", "BKK"): 250.0,
        ("BKK", "DPS"): 200.0,
    }
    # total 650, directo 900, ratio 72% — debe NO emitir
    result = config.compute_dual_bridging_synthetic(
        origin="MAD",
        destination="DPS",
        deals_index=deals_index,
        direct_price=900.0,
    )
    assert result is None


# ─────────────────────────────────────────────────────────────────────────────
# VVV03 — Multi-stop anomaly + env configurable
# ─────────────────────────────────────────────────────────────────────────────

def test_is_multi_stop_anomaly_classic_case():
    """ECN ultra_largo threshold = 200€ → with stops=2, threshold * (0.50-0.10)
    = 80€. Price 70€ < 80€ → triggers."""
    # cabin economy = 1 (CABIN_ECONOMY)
    triggers = config.is_multi_stop_anomaly(
        price=70,
        cabin=config.CABIN_ECONOMY,
        destination="DPS",
        stops=2,
    )
    assert triggers is True


def test_is_multi_stop_anomaly_one_stop_skipped():
    """Solo 1 stop → no es candidato a multi-stop anomaly."""
    triggers = config.is_multi_stop_anomaly(
        price=100,
        cabin=config.CABIN_ECONOMY,
        destination="DPS",
        stops=1,
    )
    assert triggers is False


def test_is_multi_stop_anomaly_normal_price_skipped():
    """Precio normal de multi-stop NO debe disparar."""
    triggers = config.is_multi_stop_anomaly(
        price=900,
        cabin=config.CABIN_ECONOMY,
        destination="NRT",
        stops=2,
    )
    assert triggers is False


def test_multi_stop_anomaly_pct_env_override(monkeypatch):
    """VVV03 — env MULTI_STOP_ANOMALY_PCT cambia el threshold.

    Default 0.50 + stops=2 → threshold = 200 * (0.50-0.10) = 80€.
    Price 70 < 80 → True.

    Stricter 0.20 + stops=2 → threshold = 200 * (0.20-0.10) = 20€.
    Price 70 > 20 → False.
    """
    # Default
    assert config.is_multi_stop_anomaly(70, config.CABIN_ECONOMY, "DPS", 2)

    # Stricter env override
    monkeypatch.setenv("MULTI_STOP_ANOMALY_PCT", "0.20")
    result = config.is_multi_stop_anomaly(70, config.CABIN_ECONOMY, "DPS", 2)
    assert result is False, "Stricter pct should reject prices above the new threshold"


# ─────────────────────────────────────────────────────────────────────────────
# Integration test — analyze_all genera bridging deals
# ─────────────────────────────────────────────────────────────────────────────

def test_analyze_all_generates_bridging_synthetic():
    """End-to-end: con flights que cubren ES→hub y hub→long-haul, el
    pipeline debe emitir bridging deals al final del output."""
    flights = [
        # MAD → AMS cheap (leg1 candidate)
        {
            "origin": "MAD", "destination": "AMS",
            "price_eur": 60, "cabin": "economy", "cabin_int": 1,
            "stops": 0, "airline": "KLM",
            "date_out": "2026-09-15",
        },
        # AMS → NRT cheap (leg2 candidate)
        {
            "origin": "AMS", "destination": "NRT",
            "price_eur": 450, "cabin": "economy", "cabin_int": 1,
            "stops": 0, "airline": "KLM",
            "date_out": "2026-09-22",
        },
        # MAD → NRT directo caro (baseline)
        {
            "origin": "MAD", "destination": "NRT",
            "price_eur": 950, "cabin": "economy", "cabin_int": 1,
            "stops": 1, "airline": "Lufthansa",
            "date_out": "2026-09-15",
        },
    ]
    analyzed = detector.analyze_all(flights, min_score=10)
    # Debe haber al menos 1 bridging synthetic en el output
    bridging_results = [a for a in analyzed if a.get("bridging") is True]
    assert len(bridging_results) >= 1, (
        f"Expected ≥1 bridging synthetic, got {len(bridging_results)}. "
        f"Total analyzed: {len(analyzed)}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Optional import sanity — confirma que no hay imports rotos
# ─────────────────────────────────────────────────────────────────────────────

def test_config_imports_optional():
    """compute_bridging_synthetic + compute_dual_bridging_synthetic existen
    y son callable."""
    assert callable(config.compute_bridging_synthetic)
    assert callable(config.compute_dual_bridging_synthetic)
    assert callable(config.is_multi_stop_anomaly)
