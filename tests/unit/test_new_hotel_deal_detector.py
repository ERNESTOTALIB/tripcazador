"""
test_new_hotel_deal_detector.py — May 2026
===========================================
Cobertura para hotel_deal_detector (drop ≥20% vs mediana, bootstrap mode,
JSONL persistence, prune ≥90d).
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import pytest

import hotel_deal_detector as hdd  # type: ignore[import-not-found]


@pytest.fixture
def isolated_history(tmp_path, monkeypatch):
    """Aísla HISTORY_PATH en tmp_path para cada test."""
    p = tmp_path / "hotel_history.jsonl"
    monkeypatch.setattr(hdd, "HISTORY_PATH", p)
    yield p


def _hotel(name="Hotel Test", city="Madrid", price=100.0, checkin="2026-08-15",
           baseline=None):
    h = {
        "hotel_name": name,
        "city_to": city,
        "price_eur": price,
        "checkin": checkin,
    }
    if baseline is not None:
        h["baseline_low_price"] = baseline
    return h


class TestHotelKey:
    def test_unique_per_city_name_month(self):
        h1 = _hotel("Plaza", "Madrid", checkin="2026-08-15")
        h2 = _hotel("Plaza", "Madrid", checkin="2026-09-15")
        h3 = _hotel("Plaza", "Barcelona", checkin="2026-08-15")
        assert hdd._hotel_key(h1) != hdd._hotel_key(h2)
        assert hdd._hotel_key(h1) != hdd._hotel_key(h3)

    def test_key_lowercase_normalized(self):
        h1 = _hotel("PLAZA Mayor", "MADRID", checkin="2026-08-15")
        h2 = _hotel("plaza mayor", "madrid", checkin="2026-08-15")
        assert hdd._hotel_key(h1) == hdd._hotel_key(h2)

    def test_key_handles_missing_fields(self):
        # No revienta
        key = hdd._hotel_key({"hotel_name": "X", "city_to": "Y"})
        assert "unknown" in key


class TestHistoryPersistence:
    def test_append_creates_file(self, isolated_history):
        hdd.append_to_history([_hotel(price=80)])
        assert isolated_history.exists()
        lines = isolated_history.read_text().strip().split("\n")
        assert len(lines) == 1
        row = json.loads(lines[0])
        assert row["price"] == 80.0
        assert row["city"] == "Madrid"

    def test_append_skips_zero_price(self, isolated_history):
        hdd.append_to_history([_hotel(price=0)])
        # No debe escribir nada si price <=0
        if isolated_history.exists():
            content = isolated_history.read_text().strip()
            assert content == ""

    def test_append_empty_list_noop(self, isolated_history):
        hdd.append_to_history([])
        assert not isolated_history.exists()

    def test_load_history_handles_missing_file(self, isolated_history):
        # No existe → []
        assert hdd._load_history() == []

    def test_load_skips_malformed_lines(self, isolated_history):
        isolated_history.write_text(
            '{"ts": "2026-01-01", "key": "a", "price": 50}\n'
            'not-json-at-all\n'
            '{"ts": "2026-01-02", "key": "b", "price": 60}\n'
        )
        rows = hdd._load_history()
        assert len(rows) == 2

    def test_prune_removes_old(self):
        now = datetime.utcnow()
        old = (now - timedelta(days=200)).isoformat()
        recent = (now - timedelta(days=10)).isoformat()
        rows = [
            {"ts": old, "key": "a", "price": 50},
            {"ts": recent, "key": "b", "price": 60},
        ]
        out = hdd._prune_old_history(rows)
        assert len(out) == 1
        assert out[0]["key"] == "b"


class TestBootstrapMode:
    def test_first_run_returns_bootstrap_pick(self, isolated_history):
        """Sin historia previa: primer hotel de cada ciudad sale como bootstrap."""
        hotels = [
            _hotel("Plaza", "Madrid", 80),
            _hotel("Ritz", "Madrid", 200),
            _hotel("Casa", "Barcelona", 90),
        ]
        deals, regular = hdd.detect_deals(hotels)
        # Una bootstrap-pick por ciudad (2 ciudades)
        bootstrap = [d for d in deals if d.get("classification") == "TRACKING"]
        assert len(bootstrap) == 2
        cities = {d["city_to"] for d in bootstrap}
        assert cities == {"Madrid", "Barcelona"}

    def test_low_price_excluded_from_bootstrap(self, isolated_history):
        # Hotel <MIN_PRICE_EUR (35€) no se incluye
        hotels = [_hotel("Hostel", "Madrid", 25)]
        deals, regular = hdd.detect_deals(hotels)
        assert len(deals) == 0
        assert len(regular) == 1


class TestDealDetection:
    def _seed_history(self, isolated_history, hotel, prices, days_back=10):
        """Siembra N samples para un hotel en tiempos distintos."""
        now = datetime.utcnow()
        rows = []
        key = hdd._hotel_key(hotel)
        for i, p in enumerate(prices):
            ts = (now - timedelta(days=days_back - i)).isoformat()
            rows.append({
                "ts": ts, "key": key, "price": p,
                "city": hotel["city_to"], "hotel": hotel["hotel_name"][:60],
                "checkin": hotel["checkin"],
            })
        isolated_history.parent.mkdir(parents=True, exist_ok=True)
        isolated_history.write_text(
            "\n".join(json.dumps(r) for r in rows) + "\n"
        )

    def test_drop_30pct_detected(self, isolated_history):
        # 8 samples ~100€, run actual 65€ (-35%)
        hotel = _hotel("Boutique", "Madrid", price=65)
        self._seed_history(isolated_history, hotel,
                           [100, 105, 95, 102, 98, 100, 99, 101], days_back=8)
        deals, _ = hdd.detect_deals([hotel])
        the_deal = [d for d in deals if d.get("hotel_name") == "Boutique"]
        assert len(the_deal) == 1
        d = the_deal[0]
        assert d["type"] == "hotel_deal"
        assert d["drop_pct"] >= 30
        # ≥35% caída → ERROR clasificación
        assert d["classification"] in ("ERROR", "CRÍTICO", "ANOMALÍA")

    def test_drop_below_threshold_not_deal(self, isolated_history):
        # 8 samples ~100€, run actual 90€ (-10%) → no es deal
        hotel = _hotel("Standard", "Madrid", price=90)
        self._seed_history(isolated_history, hotel,
                           [100, 102, 98, 101, 99, 100, 103, 97], days_back=8)
        deals, regular = hdd.detect_deals([hotel])
        # No debe aparecer como hotel_deal (≥20% threshold no cumplido)
        assert all(d.get("type") != "hotel_deal" for d in deals
                   if d.get("hotel_name") == "Standard")

    def test_baseline_drop_signal(self, isolated_history):
        # Sin historia interna, pero SerpAPI baseline=200€ y precio=120€ (-40%)
        hotel = _hotel("Lux", "Roma", price=120, baseline=200)
        # Sembramos historia para otro hotel para que no entre bootstrap
        other = _hotel("Other", "Roma", price=80)
        self._seed_history(isolated_history, other,
                           [80] * 8, days_back=8)
        deals, _ = hdd.detect_deals([hotel, other])
        # El hotel con baseline drop debe salir como deal
        lux = [d for d in deals if d.get("hotel_name") == "Lux"]
        # Bootstrap o deal — debe estar en deals
        assert len(lux) == 1

    def test_min_drop_eur_filter(self, isolated_history):
        """Drop 25% pero diferencia <30€ → no es deal (filtro MIN_DROP_EUR)."""
        hotel = _hotel("Cheap", "Madrid", price=42)  # >35€ min
        # samples ~55€, drop 23% pero solo 13€ → no cumple MIN_DROP_EUR
        self._seed_history(isolated_history, hotel,
                           [55, 56, 54, 55, 55, 56, 55, 54], days_back=8)
        deals, _ = hdd.detect_deals([hotel])
        # Sólo aparece como hotel_deal si ABS drop ≥ MIN_DROP_EUR (30€)
        cheap_deals = [d for d in deals if d.get("hotel_name") == "Cheap"
                       and d.get("type") == "hotel_deal"]
        assert len(cheap_deals) == 0


class TestHistoryStats:
    def test_empty_history(self, isolated_history):
        st = hdd.get_history_stats()
        assert st["total_samples"] == 0
        assert st["unique_hotels"] == 0
        assert st["oldest"] is None
        assert st["newest"] is None

    def test_with_samples(self, isolated_history):
        hdd.append_to_history([
            _hotel("A", "Madrid", 100),
            _hotel("B", "Roma", 150),
            _hotel("A", "Madrid", 110),  # mismo hotel/mes
        ])
        st = hdd.get_history_stats()
        assert st["total_samples"] == 3
        # 2 hoteles únicos (A-Madrid y B-Roma comparten checkin month)
        assert st["unique_hotels"] == 2
        assert st["oldest"] is not None
        assert st["newest"] is not None
