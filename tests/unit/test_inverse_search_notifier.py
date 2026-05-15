"""
test_inverse_search_notifier.py — SSS220 (16 may 2026)

Regression tests para scripts/inverse_search_notifier.py (SSS211) y
scripts/telegram_inverse_search_bot.py (SSS218 /stop).

Casos cubiertos:
- match_deal con destination fuzzy + month + price_max
- unsubscribe_all marca timestamp + persist
- list_active_subs filtra unsubscribed
- notifier respeta unsubscribed_at (skip)
- Anti-dedup (chat_id, deal_id) key persistente

Las funciones se importan directamente (script standalone, no package).
"""
from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
from unittest.mock import patch

import pytest

ROOT = Path(__file__).resolve().parents[2]


def _load_module(rel_path: str, name: str) -> Any:
    """Carga script standalone como módulo importable."""
    path = ROOT / rel_path
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader, f"Cannot load {path}"
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def notifier_mod():
    # Set fake env vars antes de cargar — script falla import si BOT_TOKEN missing
    import os
    os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test_token_for_unit_tests")
    return _load_module("scripts/inverse_search_notifier.py", "inverse_search_notifier")


@pytest.fixture(scope="module")
def bot_mod():
    import os
    os.environ.setdefault("TELEGRAM_BOT_TOKEN", "test_token_for_unit_tests")
    return _load_module("scripts/telegram_inverse_search_bot.py", "telegram_inverse_search_bot")


# ────────────────────────────────────────────────
# match_deal logic (SSS211)
# ────────────────────────────────────────────────

def test_match_deal_destination_fuzzy(notifier_mod):
    """Destination matching is fuzzy + accent-insensitive."""
    deal = {
        "id": "test1",
        "city_to": "Tokio",
        "destination": "NRT",
        "country_to": "Japón",
        "headline": "Madrid → Tokio desde 450€",
        "date_out": "2026-09-15",
        "price_eur": 450,
    }
    # Match con destination case-insensitive
    assert notifier_mod.match_deal(deal, {"destination": "Tokio"})
    assert notifier_mod.match_deal(deal, {"destination": "tokio"})
    # Match con substring de country_to
    assert notifier_mod.match_deal(deal, {"destination": "Japon"})  # sin acento
    # NO match si destination no existe en ninguno
    assert not notifier_mod.match_deal(deal, {"destination": "París"})


def test_match_deal_month_filter(notifier_mod):
    """Month filter restricts to matching dep month."""
    deal = {
        "id": "x",
        "city_to": "Tokio",
        "destination": "NRT",
        "date_out": "2026-09-15",
        "price_eur": 450,
    }
    # Match mismo month
    assert notifier_mod.match_deal(deal, {"destination": "Tokio", "month": 9})
    # NO match diferente month
    assert not notifier_mod.match_deal(deal, {"destination": "Tokio", "month": 8})
    # Match si month not specified
    assert notifier_mod.match_deal(deal, {"destination": "Tokio"})


def test_match_deal_price_max(notifier_mod):
    """price_max filter caps at threshold."""
    deal = {
        "id": "x",
        "city_to": "Tokio",
        "destination": "NRT",
        "date_out": "2026-09-15",
        "price_eur": 450,
    }
    assert notifier_mod.match_deal(deal, {"destination": "Tokio", "price_max": 500})
    assert notifier_mod.match_deal(deal, {"destination": "Tokio", "price_max": 450})  # boundary
    assert not notifier_mod.match_deal(deal, {"destination": "Tokio", "price_max": 449})


def test_match_deal_empty_destination_returns_false(notifier_mod):
    """Sub sin destination es inválida → no match."""
    deal = {"id": "x", "city_to": "Tokio", "price_eur": 100, "date_out": "2026-09-01"}
    assert not notifier_mod.match_deal(deal, {"destination": ""})


# ────────────────────────────────────────────────
# unsubscribe_all + list_active_subs (SSS218)
# ────────────────────────────────────────────────

def test_unsubscribe_all_marks_timestamp(bot_mod, tmp_path):
    """unsubscribe_all marca todos los subs del chat_id con timestamp."""
    subs = [
        {"chat_id": 100, "destination": "Tokio", "month": 9},
        {"chat_id": 100, "destination": "Bali", "month": None},
        {"chat_id": 200, "destination": "Lisboa", "month": 6},
    ]
    subs_file = tmp_path / "subs.json"
    subs_file.write_text(json.dumps(subs), encoding="utf-8")

    with patch.object(bot_mod, "SUBS_FILE", subs_file):
        count = bot_mod.unsubscribe_all(100)
    assert count == 2  # 2 subs of chat_id=100

    after = json.loads(subs_file.read_text("utf-8"))
    # chat 100's subs marked
    for s in after:
        if s["chat_id"] == 100:
            assert "unsubscribed_at" in s and s["unsubscribed_at"]
        if s["chat_id"] == 200:
            assert "unsubscribed_at" not in s


def test_unsubscribe_all_idempotent(bot_mod, tmp_path):
    """Calling unsubscribe_all 2x doesn't double-mark."""
    subs = [{"chat_id": 100, "destination": "Tokio"}]
    subs_file = tmp_path / "subs.json"
    subs_file.write_text(json.dumps(subs), encoding="utf-8")

    with patch.object(bot_mod, "SUBS_FILE", subs_file):
        c1 = bot_mod.unsubscribe_all(100)
        c2 = bot_mod.unsubscribe_all(100)
    assert c1 == 1
    assert c2 == 0  # nothing left to unsub


def test_list_active_subs_excludes_unsubscribed(bot_mod, tmp_path):
    """list_active_subs solo devuelve subs sin unsubscribed_at."""
    now = datetime.now(timezone.utc).isoformat()
    subs = [
        {"chat_id": 100, "destination": "Tokio"},
        {"chat_id": 100, "destination": "Bali", "unsubscribed_at": now},
        {"chat_id": 100, "destination": "Lisboa"},
        {"chat_id": 200, "destination": "Paris"},  # other user
    ]
    subs_file = tmp_path / "subs.json"
    subs_file.write_text(json.dumps(subs), encoding="utf-8")

    with patch.object(bot_mod, "SUBS_FILE", subs_file):
        active = bot_mod.list_active_subs(100)
    # Should return Tokio + Lisboa, NOT Bali (unsubscribed) ni Paris (other user)
    dests = sorted([s["destination"] for s in active])
    assert dests == ["Lisboa", "Tokio"]


def test_list_active_subs_empty_file(bot_mod, tmp_path):
    """Sin archivo subs → []."""
    subs_file = tmp_path / "nonexistent.json"
    with patch.object(bot_mod, "SUBS_FILE", subs_file):
        active = bot_mod.list_active_subs(100)
    assert active == []


# ────────────────────────────────────────────────
# Notifier dedup key
# ────────────────────────────────────────────────

def test_notif_key_consistent(notifier_mod):
    """notif_key produces stable string per (chat_id, deal_id)."""
    k1 = notifier_mod.notif_key(100, "deal_abc")
    k2 = notifier_mod.notif_key(100, "deal_abc")
    k3 = notifier_mod.notif_key(100, "deal_xyz")
    k4 = notifier_mod.notif_key(200, "deal_abc")
    assert k1 == k2  # determinístico
    assert k1 != k3  # distinto deal
    assert k1 != k4  # distinto user


# ────────────────────────────────────────────────
# format_notif rendering
# ────────────────────────────────────────────────

def test_format_notif_includes_destination_and_price(notifier_mod):
    deal = {
        "id": "ryanair_mad_tko_20260910",
        "origin": "MAD",
        "destination": "NRT",
        "city_to": "Tokio",
        "price_eur": 489.50,
        "date_out": "2026-09-10",
        "airline_name": "Lufthansa",
        "booking_url": "https://example.com/book",
        "classification": "CRÍTICO",
    }
    sub = {"destination": "Tokio"}
    text = notifier_mod.format_notif(deal, sub)
    assert "Tokio" in text
    assert "489" in text  # price truncated to int
    assert "MAD" in text
    assert "Lufthansa" in text
    assert "🚨" in text  # CRÍTICO emoji
    assert "RESERVAR" in text
    assert "/stop" in text  # unsubscribe hint
