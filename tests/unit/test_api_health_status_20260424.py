"""
tests/unit/test_api_health_status_20260424.py
=============================================
Regresiones sobre los endpoints /api/health y /api/status refinados en
abr-2026j (#191).

No arrancamos FastAPI: inspeccionamos api/main.py como fuente para validar:
  - Endpoint /api/status existe con rate-limit 300/min
  - /api/health incluye version + git_sha + uptime_seconds
  - /api/health tiene rate-limit explícito 30/min
  - Helper _read_git_sha está definido
  - /api/status devuelve etiqueta `health` (fresh/healthy/stale/degraded)
  - Rate-limits fine-tuned: /api/search 30/min, /api/airports 240/min
"""
from __future__ import annotations

from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
API_MAIN = ROOT / "api" / "main.py"


def _src() -> str:
    assert API_MAIN.exists()
    return API_MAIN.read_text(encoding="utf-8")


class TestHealthEndpointEnhanced:
    def test_health_has_rate_limit(self):
        src = _src()
        # Rate-limit 30/min explícito encima del endpoint health
        # Busca la secuencia de decorators sobre health()
        idx = src.index('@app.get("/api/health")')
        # Los siguientes 300 chars deben contener @limiter.limit
        window = src[idx : idx + 400]
        assert '@limiter.limit("30/minute")' in window
        assert "async def health" in window

    def test_health_returns_version(self):
        src = _src()
        assert '"version": _APP_VERSION' in src

    def test_health_returns_git_sha(self):
        src = _src()
        assert '"git_sha": _APP_GIT_SHA' in src

    def test_health_returns_uptime(self):
        src = _src()
        assert '"uptime_seconds"' in src


class TestStatusEndpointPublic:
    def test_status_endpoint_exists(self):
        src = _src()
        assert '@app.get("/api/status")' in src
        assert "async def public_status" in src

    def test_status_rate_limit_generous(self):
        src = _src()
        idx = src.index('@app.get("/api/status")')
        window = src[idx : idx + 400]
        assert '@limiter.limit("300/minute")' in window

    def test_status_emits_health_label(self):
        src = _src()
        # Labels que consumer-facing widgets esperan
        for label in ["fresh", "healthy", "stale", "degraded", "unknown"]:
            assert f'"{label}"' in src, f"Label ausente: {label}"

    def test_status_does_not_leak_breakers(self):
        """Public status no debe exponer circuit breakers (a diferencia de /health)."""
        src = _src()
        idx = src.index('@app.get("/api/status")')
        # Busca el bloque hasta el siguiente `@app.`
        end = src.index("@app.", idx + 1)
        block = src[idx:end]
        assert "breakers" not in block.lower()

    def test_status_exposes_deals_total_and_verified(self):
        src = _src()
        idx = src.index('@app.get("/api/status")')
        end = src.index("@app.", idx + 1)
        block = src[idx:end]
        assert '"deals_total"' in block
        assert '"deals_verified"' in block
        assert '"price_min"' in block


class TestGitShaReader:
    def test_git_sha_reader_function_present(self):
        src = _src()
        assert "def _read_git_sha" in src

    def test_git_sha_reads_env_var_first(self):
        src = _src()
        # La función debe priorizar GIT_SHA env var
        fn_idx = src.index("def _read_git_sha")
        window = src[fn_idx : fn_idx + 800]
        assert 'os.getenv("GIT_SHA"' in window

    def test_git_sha_reads_head_ref_fallback(self):
        src = _src()
        fn_idx = src.index("def _read_git_sha")
        window = src[fn_idx : fn_idx + 800]
        assert ".git" in window
        assert "HEAD" in window

    def test_git_sha_truncates_to_12_chars(self):
        src = _src()
        fn_idx = src.index("def _read_git_sha")
        window = src[fn_idx : fn_idx + 800]
        assert "[:12]" in window


class TestRateLimitsFineTune:
    def test_search_tightened_to_30_per_minute(self):
        src = _src()
        idx = src.index('@app.get("/api/search"')
        window = src[idx : idx + 400]
        assert '@limiter.limit("30/minute")' in window

    def test_airports_at_240_per_minute(self):
        src = _src()
        idx = src.index('@app.get("/api/airports")')
        window = src[idx : idx + 400]
        assert '@limiter.limit("240/minute")' in window

    def test_deals_top_unchanged_120(self):
        """Regresión: /api/deals/top mantiene 120/min, no se ha tocado sin querer."""
        src = _src()
        idx = src.index('@app.get("/api/deals/top"')
        window = src[idx : idx + 400]
        assert '@limiter.limit("120/minute")' in window
