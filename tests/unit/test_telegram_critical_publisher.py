"""
Tests para telegram_critical_publisher.py — fase SSS34 (May 2026)

Cobertura:
  - filter_critical: classification + score + price + frescura
  - filter_unsent: dedup hash
  - check_throttle: ≥3 alertas/2h
  - format_message: HTML + escape
  - _deal_hash: estable y único por (origin, dest, airline, price, date_out)
"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

# Path setup
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "flight_hunter_v4"))

import telegram_critical_publisher as tcp


def _make_deal(origin="MAD", destination="JFK", airline="AY",
               price=180, classification="CRÍTICO", score=85,
               drop_pct=45, dtype="flight_deal", date_out="2026-09-15",
               cabin="Economy", booking_url="https://airline.com/book",
               found_at=None):
    """Factory para deal de prueba."""
    if found_at is None:
        found_at = datetime.now(timezone.utc).isoformat()
    return {
        "type": dtype,
        "origin": origin,
        "destination": destination,
        "airline": airline,
        "price_eur": price,
        "classification": classification,
        "final_score": score,
        "savings_pct": drop_pct,
        "cabin": cabin,
        "date_out": date_out,
        "booking_url": booking_url,
        "found_at": found_at,
    }


# ── filter_critical ────────────────────────────────────────────────────

def test_filter_passes_critico_with_high_score():
    deal = _make_deal()
    out = tcp.filter_critical([deal])
    assert len(out) == 1


def test_filter_rejects_low_score():
    deal = _make_deal(score=60)  # < MIN_SCORE 75
    out = tcp.filter_critical([deal])
    assert out == []


def test_filter_rejects_oferta_class():
    deal = _make_deal(classification="OFERTA")
    out = tcp.filter_critical([deal])
    assert out == []


def test_filter_accepts_error_class():
    deal = _make_deal(classification="ERROR")
    out = tcp.filter_critical([deal])
    assert len(out) == 1


def test_filter_rejects_expensive():
    deal = _make_deal(price=500)  # > MAX_PRICE_EUR 300
    out = tcp.filter_critical([deal])
    assert out == []


def test_filter_rejects_hotel_type():
    deal = _make_deal(dtype="hotel_deal")
    out = tcp.filter_critical([deal])
    assert out == []


def test_filter_rejects_stale():
    """Deal con found_at >6h debe filtrarse."""
    old = (datetime.now(timezone.utc) - timedelta(hours=10)).isoformat()
    deal = _make_deal(found_at=old)
    out = tcp.filter_critical([deal])
    assert out == [], "Deal stale (>6h) debe filtrarse"


def test_filter_sort_by_drop_then_price():
    """Orden: drop% DESC, precio ASC."""
    a = _make_deal(origin="MAD", destination="JFK", price=200, drop_pct=40)
    b = _make_deal(origin="BCN", destination="LAX", price=150, drop_pct=60)
    c = _make_deal(origin="LIS", destination="GRU", price=100, drop_pct=60)  # mismo drop, < price
    out = tcp.filter_critical([a, b, c])
    assert out[0]["origin"] == "LIS", "Mismo drop → más barato primero"
    assert out[1]["origin"] == "BCN"
    assert out[2]["origin"] == "MAD"


# ── _deal_hash ─────────────────────────────────────────────────────────

def test_hash_stable_same_inputs():
    d1 = _make_deal(price=180)
    d2 = _make_deal(price=180)
    assert tcp._deal_hash(d1) == tcp._deal_hash(d2)


def test_hash_changes_on_price_change():
    """Si cambia el precio, queremos reenviar — hash cambia."""
    d1 = _make_deal(price=180)
    d2 = _make_deal(price=170)
    assert tcp._deal_hash(d1) != tcp._deal_hash(d2)


def test_hash_changes_on_route_change():
    d1 = _make_deal(destination="JFK")
    d2 = _make_deal(destination="LAX")
    assert tcp._deal_hash(d1) != tcp._deal_hash(d2)


# ── filter_unsent ──────────────────────────────────────────────────────

def test_unsent_excludes_already_sent():
    deal = _make_deal()
    h = tcp._deal_hash(deal)
    dedup = {"sent": [{"hash": h, "ts": "2026-05-01T10:00:00+00:00"}]}
    out = tcp.filter_unsent([deal], dedup)
    assert out == []


def test_unsent_keeps_new_ones():
    a = _make_deal(origin="MAD")
    b = _make_deal(origin="BCN")
    dedup = {"sent": [{"hash": tcp._deal_hash(a), "ts": "now"}]}
    out = tcp.filter_unsent([a, b], dedup)
    assert len(out) == 1
    assert out[0]["origin"] == "BCN"


# ── check_throttle ─────────────────────────────────────────────────────

def test_throttle_off_when_recent_count_low():
    now = datetime.now(timezone.utc).isoformat()
    dedup = {"sent": [
        {"hash": "a", "ts": now},
        {"hash": "b", "ts": now},
    ]}
    assert tcp.check_throttle(dedup) is False


def test_throttle_on_when_3_in_2h():
    now = datetime.now(timezone.utc).isoformat()
    dedup = {"sent": [
        {"hash": "a", "ts": now},
        {"hash": "b", "ts": now},
        {"hash": "c", "ts": now},
    ]}
    assert tcp.check_throttle(dedup) is True


def test_throttle_off_when_old():
    """3 alertas pero todas >2h → no throttle."""
    old = (datetime.now(timezone.utc) - timedelta(hours=3)).isoformat()
    dedup = {"sent": [
        {"hash": "a", "ts": old},
        {"hash": "b", "ts": old},
        {"hash": "c", "ts": old},
    ]}
    assert tcp.check_throttle(dedup) is False


# ── format_message ─────────────────────────────────────────────────────

def test_format_includes_essentials():
    deal = _make_deal(origin="MAD", destination="JFK", price=180, drop_pct=45)
    msg = tcp.format_message(deal)
    assert "MAD" in msg
    assert "JFK" in msg
    assert "180" in msg
    assert "-45%" in msg
    assert "🚨" in msg  # CRÍTICO icon


def test_format_html_escapes_specials():
    deal = _make_deal(airline="AY <test>")
    msg = tcp.format_message(deal)
    assert "&lt;test&gt;" in msg
    assert "<test>" not in msg or msg.count("<test>") == 0


def test_format_includes_booking_link():
    deal = _make_deal(booking_url="https://airline.com/abc")
    msg = tcp.format_message(deal)
    assert 'href="https://airline.com/abc"' in msg
    assert "RESERVAR" in msg


# ── _is_fresh ──────────────────────────────────────────────────────────

def test_is_fresh_recent():
    now_iso = datetime.now(timezone.utc).isoformat()
    deal = _make_deal(found_at=now_iso)
    assert tcp._is_fresh(deal) is True


def test_is_fresh_with_z_suffix():
    """ISO con sufijo Z (UTC) debe parsear OK."""
    now_z = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    deal = _make_deal(found_at=now_z)
    assert tcp._is_fresh(deal) is True


def test_is_fresh_falls_back_to_true_on_missing():
    deal = _make_deal()
    deal.pop("found_at", None)
    assert tcp._is_fresh(deal) is True


# ── dedup roundtrip ────────────────────────────────────────────────────

def test_dedup_roundtrip(monkeypatch, tmp_path):
    """_load_dedup + _save_dedup roundtrip."""
    test_file = tmp_path / "test_dedup.json"
    monkeypatch.setattr(tcp, "DEDUP_FILE", test_file)

    data = {"sent": [{"hash": "abc123", "ts": "2026-05-03T20:00:00+00:00"}]}
    tcp._save_dedup(data)
    loaded = tcp._load_dedup()
    assert loaded["sent"][0]["hash"] == "abc123"


def test_dedup_caps_at_500(monkeypatch, tmp_path):
    """Si hay >500 entradas, mantener solo las últimas 500."""
    test_file = tmp_path / "test_dedup.json"
    monkeypatch.setattr(tcp, "DEDUP_FILE", test_file)

    data = {"sent": [{"hash": f"h{i}", "ts": "x"} for i in range(600)]}
    tcp._save_dedup(data)
    loaded = tcp._load_dedup()
    assert len(loaded["sent"]) == 500
    # Mantener las últimas: h100..h599
    assert loaded["sent"][0]["hash"] == "h100"
    assert loaded["sent"][-1]["hash"] == "h599"
