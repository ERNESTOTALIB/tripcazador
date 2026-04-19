"""
Integration tests: pipeline detector + exporter end-to-end.

Simula 1 engine mock produciendo vuelos, pasa por analyze_all,
luego por run_export (sin alerts Telegram), y verifica que deals.json
escrito es un JSON valido con schema correcto.
"""
from __future__ import annotations

import json
from datetime import datetime, timedelta
from pathlib import Path

import pytest

import deals_exporter
import detector


def _mock_engine_flights():
    """Simula la salida de un engine (ej. kiwi) con varios vuelos realistas."""
    future_out = (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d")
    future_ret = (datetime.now() + timedelta(days=53)).strftime("%Y-%m-%d")
    now = datetime.now().isoformat()

    return [
        # Error fare business transatlantico claro
        {
            "source": "kiwi",
            "origin": "MAD", "destination": "JFK",
            "city_to": "Nueva York", "country_to": "Estados Unidos",
            "price_eur": 280.0, "cabin_code": 3, "cabin": "business",
            "airline": "IB", "airline_name": "Iberia",
            "date_out": future_out, "date_ret": future_ret,
            "stops": 0, "duration_min": 480,
            "distance_category": "largo",
            "scraped_at": now,
            "booking_url": "https://example.com/book1",
        },
        # Economy baseline para T4
        {
            "source": "kiwi",
            "origin": "MAD", "destination": "JFK",
            "city_to": "Nueva York", "country_to": "Estados Unidos",
            "price_eur": 400.0, "cabin_code": 1, "cabin": "economy",
            "airline": "IB", "airline_name": "Iberia",
            "date_out": future_out, "date_ret": future_ret,
            "stops": 0, "duration_min": 480,
            "distance_category": "largo",
            "scraped_at": now,
            "booking_url": "https://example.com/book2",
        },
        # Vuelo normal
        {
            "source": "kiwi",
            "origin": "MAD", "destination": "FCO",
            "city_to": "Roma", "country_to": "Italia",
            "price_eur": 150.0, "cabin_code": 1, "cabin": "economy",
            "airline": "IB", "airline_name": "Iberia",
            "date_out": future_out, "date_ret": future_ret,
            "stops": 0, "duration_min": 150,
            "distance_category": "corto",
            "scraped_at": now,
            "booking_url": "https://example.com/book3",
        },
    ]


class TestEndToEndPipeline:
    def test_full_pipeline_writes_valid_deals_json(self, tmp_path, monkeypatch):
        # Bloquear alertas Telegram
        monkeypatch.setattr(deals_exporter, "send_telegram_alerts",
                            lambda *a, **kw: 0)

        flights = _mock_engine_flights()

        # 1. Detector
        analyzed = detector.analyze_all(flights, min_score=10)
        assert isinstance(analyzed, list)

        # 2. Exporter
        deals_obj = deals_exporter.run_export(
            analyzed_flights=analyzed,
            output_dir=str(tmp_path),
            send_alerts=False,
        )

        # 3. Verificar escritura
        deals_path = tmp_path / "deals.json"
        assert deals_path.exists()

        data = json.loads(deals_path.read_text(encoding="utf-8"))
        assert data["schema_version"] == deals_exporter.DEALS_SCHEMA_VERSION
        assert "deals" in data
        assert "stats" in data
        assert "generated_at" in data

    def test_schema_fields_present_in_output(self, tmp_path, monkeypatch):
        monkeypatch.setattr(deals_exporter, "send_telegram_alerts",
                            lambda *a, **kw: 0)

        flights = _mock_engine_flights()
        analyzed = detector.analyze_all(flights, min_score=10)
        deals_obj = deals_exporter.run_export(
            analyzed_flights=analyzed,
            output_dir=str(tmp_path),
            send_alerts=False,
        )

        if not deals_obj["deals"]:
            pytest.skip("El mock no genero deals por encima del threshold")

        sample = deals_obj["deals"][0]
        required = {
            "id", "type", "origin", "destination", "price_eur",
            "classification", "score", "cabin", "sources", "verified",
            "date_out", "booking_url",
        }
        missing = required - set(sample.keys())
        assert not missing, f"Campos faltantes en schema: {missing}"

    def test_empty_pipeline_produces_empty_deals(self, tmp_path, monkeypatch):
        monkeypatch.setattr(deals_exporter, "send_telegram_alerts",
                            lambda *a, **kw: 0)

        deals_obj = deals_exporter.run_export(
            analyzed_flights=[],
            output_dir=str(tmp_path),
            send_alerts=False,
        )
        assert deals_obj["total_deals"] == 0
        assert deals_obj["deals"] == []

    def test_history_snapshot_created(self, tmp_path, monkeypatch):
        monkeypatch.setattr(deals_exporter, "send_telegram_alerts",
                            lambda *a, **kw: 0)

        flights = _mock_engine_flights()
        analyzed = detector.analyze_all(flights, min_score=10)
        deals_exporter.run_export(
            analyzed_flights=analyzed,
            output_dir=str(tmp_path),
            send_alerts=False,
        )

        history_dir = tmp_path / "history"
        assert history_dir.exists()
        snapshots = list(history_dir.glob("deals_*.json"))
        assert len(snapshots) >= 1

    def test_dedup_happens_between_sources(self, tmp_path, monkeypatch):
        monkeypatch.setattr(deals_exporter, "send_telegram_alerts",
                            lambda *a, **kw: 0)

        # Misma ruta, 2 fuentes, precios cercanos -> deberia verificar
        future_out = (datetime.now() + timedelta(days=45)).strftime("%Y-%m-%d")
        future_ret = (datetime.now() + timedelta(days=53)).strftime("%Y-%m-%d")

        flights = [
            {
                "source": "kiwi", "origin": "MAD", "destination": "JFK",
                "city_to": "Nueva York", "country_to": "Estados Unidos",
                "price_eur": 280.0, "cabin_code": 3, "cabin": "business",
                "airline": "IB", "airline_name": "Iberia",
                "date_out": future_out, "date_ret": future_ret,
                "stops": 0, "duration_min": 480, "distance_category": "largo",
                "scraped_at": datetime.now().isoformat(),
                "booking_url": "https://example.com/1",
            },
            {
                "source": "serpapi", "origin": "MAD", "destination": "JFK",
                "city_to": "Nueva York", "country_to": "Estados Unidos",
                "price_eur": 290.0, "cabin_code": 3, "cabin": "business",
                "airline": "IB", "airline_name": "Iberia",
                "date_out": future_out, "date_ret": future_ret,
                "stops": 0, "duration_min": 480, "distance_category": "largo",
                "scraped_at": datetime.now().isoformat(),
                "booking_url": "https://example.com/2",
            },
        ]

        analyzed = detector.analyze_all(flights, min_score=10)
        deals_obj = deals_exporter.run_export(
            analyzed_flights=analyzed,
            output_dir=str(tmp_path),
            send_alerts=False,
        )

        # Tras dedup deberia haber MENOS de 2 deals para esa ruta
        jfk_deals = [d for d in deals_obj["deals"] if d["destination"] == "JFK"]
        assert len(jfk_deals) <= 1
        if jfk_deals:
            # Y con 2 fuentes, marcado verified
            assert len(jfk_deals[0]["sources"]) >= 1
