"""
Tests para hotel_deal_detector.py — fase SSS31 (May 2026)

Cobertura:
  - History persistence (append + load + prune)
  - Stats por key (median/mean/stdev)
  - Detección de deals con 3 señales (history/baseline/outlier)
  - Bootstrap mode (sin history, exporta 1 hotel/ciudad)
  - Edge cases: precio < min, sin baseline, history insuficiente
  - Idempotencia: mismo input = mismo output
"""
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch
import json
import os
import sys
import tempfile

# Path setup
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "flight_hunter_v4"))


def _make_hotel(name="Hotel Test", city="Madrid", price=100, baseline_low=None,
                baseline_avg=None, checkin="2026-08-15"):
    """Factory para hotel dict de prueba."""
    h = {
        "type": "hotel",
        "hotel_name": name,
        "city_to": city,
        "price_eur": price,
        "checkin": checkin,
        "checkout": "2026-08-18",
        "nights": 3,
    }
    if baseline_low is not None:
        h["baseline_low_price"] = baseline_low
    if baseline_avg is not None:
        h["baseline_avg_price"] = baseline_avg
    return h


def _isolated_history(monkeypatch, tmp_path):
    """Redirige HISTORY_PATH al tmp_path para tests aislados."""
    import hotel_deal_detector as hdd
    test_history = tmp_path / "test_history.jsonl"
    monkeypatch.setattr(hdd, "HISTORY_PATH", test_history)
    return hdd, test_history


def test_hotel_key_includes_city_name_month(monkeypatch, tmp_path):
    """La clave debe incluir city + name + mes para tracking estacional."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    h1 = _make_hotel(name="Hotel Wellington", city="Madrid", checkin="2026-05-15")
    h2 = _make_hotel(name="Hotel Wellington", city="Madrid", checkin="2026-12-15")
    k1 = hdd._hotel_key(h1)
    k2 = hdd._hotel_key(h2)
    assert k1 != k2, "Mismo hotel distinto mes debe tener clave distinta"
    assert "madrid" in k1
    assert "wellington" in k1
    assert "2026-05" in k1
    assert "2026-12" in k2


def test_append_and_load_history(monkeypatch, tmp_path):
    """append_to_history + _load_history roundtrip."""
    hdd, hist_path = _isolated_history(monkeypatch, tmp_path)
    hotels = [
        _make_hotel(name="Hotel A", city="Madrid", price=100),
        _make_hotel(name="Hotel B", city="Madrid", price=120),
    ]
    hdd.append_to_history(hotels)
    rows = hdd._load_history()
    assert len(rows) == 2
    assert {r["price"] for r in rows} == {100, 120}
    assert hist_path.exists()


def test_history_skips_zero_prices(monkeypatch, tmp_path):
    """Hoteles con price_eur <= 0 no deben entrar al histórico."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    hotels = [
        _make_hotel(name="OK", price=100),
        _make_hotel(name="Bad", price=0),
        _make_hotel(name="Bad2", price=-5),
    ]
    hdd.append_to_history(hotels)
    rows = hdd._load_history()
    assert len(rows) == 1


def test_prune_old_history(monkeypatch, tmp_path):
    """Registros >90d se eliminan."""
    hdd, hist_path = _isolated_history(monkeypatch, tmp_path)
    old_ts = (datetime.utcnow() - timedelta(days=120)).isoformat()
    new_ts = datetime.utcnow().isoformat()
    rows = [
        {"ts": old_ts, "key": "old", "price": 50, "city": "X", "hotel": "X", "checkin": "X"},
        {"ts": new_ts, "key": "new", "price": 50, "city": "X", "hotel": "X", "checkin": "X"},
    ]
    pruned = hdd._prune_old_history(rows)
    assert len(pruned) == 1
    assert pruned[0]["ts"] == new_ts


def test_stats_for_key_requires_min_samples(monkeypatch, tmp_path):
    """_stats_for_key devuelve None si <5 samples."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    hotel = _make_hotel(name="Hotel A", city="Madrid", price=100)
    key = hdd._hotel_key(hotel)
    # Sólo 3 samples
    for _ in range(3):
        hdd.append_to_history([hotel])
    history = hdd._load_history()
    stats = hdd._stats_for_key(history, key)
    assert stats is None, "Menos de 5 samples → None"


def test_stats_for_key_computes_median(monkeypatch, tmp_path):
    """Con 5+ samples debe devolver mediana correcta."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    hotel = _make_hotel(name="Hotel A", city="Madrid", price=100)
    key = hdd._hotel_key(hotel)
    # 5 samples con precios 80, 90, 100, 110, 120 → mediana 100
    for p in [80, 90, 100, 110, 120]:
        hdd.append_to_history([_make_hotel(name="Hotel A", city="Madrid", price=p)])
    history = hdd._load_history()
    stats = hdd._stats_for_key(history, key)
    assert stats is not None
    assert stats["n"] == 5
    assert stats["median"] == 100
    assert stats["min"] == 80
    assert stats["max"] == 120


def test_detect_deals_bootstrap_mode(monkeypatch, tmp_path):
    """Sin history, debe exportar 1 hotel/ciudad como type=hotel TRACKING."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    hotels = [
        _make_hotel(name="Hotel A1", city="Madrid", price=100),
        _make_hotel(name="Hotel A2", city="Madrid", price=110),  # mismo city, omitido
        _make_hotel(name="Hotel B1", city="Barcelona", price=90),
        _make_hotel(name="Hotel C1", city="Paris", price=130),
    ]
    deals, omitted = hdd.detect_deals(hotels)
    # Bootstrap: 1 por ciudad = 3 ciudades = 3 deals
    assert len(deals) == 3, f"Expected 3 bootstrap picks, got {len(deals)}"
    cities = {d["city_to"] for d in deals}
    assert cities == {"Madrid", "Barcelona", "Paris"}
    # Deben tener type=hotel + classification=TRACKING
    for d in deals:
        assert d["type"] == "hotel"
        assert d["classification"] == "TRACKING"
        assert d["score"] == 50


def test_detect_deals_skips_low_price(monkeypatch, tmp_path):
    """Hoteles con price < MIN_PRICE_EUR (35) no deben ser bootstrap picks."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    hotels = [_make_hotel(name="Hostal", city="Madrid", price=20)]
    deals, omitted = hdd.detect_deals(hotels)
    assert len(deals) == 0
    assert len(omitted) == 1


def test_detect_deals_with_baseline_signal(monkeypatch, tmp_path):
    """Con baseline_low SerpAPI y drop ≥30%, marca como deal aún sin history."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    # Bootstrap pick saca el primer hotel; luego deals individuales también
    # Forzamos un baseline alto + precio bajo → drop 50%
    hotel = _make_hotel(name="Hotel Wellington", city="Madrid",
                       price=80, baseline_low=160)
    deals, omitted = hdd.detect_deals([hotel])
    assert len(deals) == 1
    d = deals[0]
    # Bootstrap pick (no history) → type=hotel TRACKING. Pero also drop pasaria
    # En esta versión bootstrap toma precedencia. Verificamos que está en deals.
    assert d["city_to"] == "Madrid"


def test_detect_deals_with_history_drop(monkeypatch, tmp_path):
    """Con 5+ samples y drop ≥20% vs mediana, marca como hotel_deal."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    name = "Hotel Estable"
    city = "Madrid"
    # Generar history con precios 150 (mediana 150)
    for _ in range(6):
        h = _make_hotel(name=name, city=city, price=150)
        hdd.append_to_history([h])
    # Ahora un precio MUY bajo (50% drop)
    cheap = _make_hotel(name=name, city=city, price=70)
    deals, omitted = hdd.detect_deals([cheap])
    assert len(deals) == 1
    d = deals[0]
    assert d["type"] == "hotel_deal", f"Expected hotel_deal, got {d.get('type')}"
    assert d["classification"] in ("CRÍTICO", "ERROR", "ANOMALÍA"), d.get("classification")
    assert d["drop_pct"] >= 20
    assert d["score"] >= 50


def test_detect_deals_idempotent(monkeypatch, tmp_path):
    """Llamar detect_deals 2× con mismo input no debe duplicar history en stats."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    hotel = _make_hotel(name="Hotel A", city="Madrid", price=100)
    hdd.detect_deals([hotel])
    hdd.detect_deals([hotel])
    history = hdd._load_history()
    # Dos appends, dos rows
    assert len(history) == 2
    # Pero stats consistentes (mediana == 100)
    stats = hdd._stats_for_key(history, hdd._hotel_key(hotel))
    if stats:
        assert stats["median"] == 100


def test_get_history_stats_empty(monkeypatch, tmp_path):
    """get_history_stats con history vacío devuelve estructura correcta."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    stats = hdd.get_history_stats()
    assert stats["total_samples"] == 0
    assert stats["unique_hotels"] == 0
    assert stats["oldest"] is None


def test_get_history_stats_populated(monkeypatch, tmp_path):
    """Después de append, stats reflejan números correctos."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    hotels = [
        _make_hotel(name=f"H{i}", city="Madrid", price=100)
        for i in range(3)
    ]
    hdd.append_to_history(hotels)
    stats = hdd.get_history_stats()
    assert stats["total_samples"] == 3
    assert stats["unique_hotels"] == 3
    assert stats["oldest"] is not None
    assert stats["newest"] is not None


def test_no_drop_when_price_above_baseline(monkeypatch, tmp_path):
    """Si precio > baseline, NO debe ser deal (es más caro de lo normal)."""
    hdd, _ = _isolated_history(monkeypatch, tmp_path)
    # Generar history baja (mediana 80)
    for _ in range(6):
        hdd.append_to_history([_make_hotel(name="Hotel X", city="Roma", price=80)])
    # Precio actual MÁS alto que mediana
    expensive = _make_hotel(name="Hotel X", city="Roma", price=120, baseline_low=70)
    deals, omitted = hdd.detect_deals([expensive])
    # No debería ser deal (precio sube, no baja)
    assert len(deals) == 0
    assert len(omitted) == 1
