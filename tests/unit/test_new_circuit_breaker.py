"""
test_new_circuit_breaker.py — May 2026
=======================================
Cobertura completa para circuit_breaker.{_Breaker,get_breaker,with_breaker,all_status,reset_all}.

Verifica los 3 estados (CLOSED/OPEN/HALF_OPEN), el cooldown, el decorator y
el thread-safety básico.
"""
from __future__ import annotations

import threading
import time

import pytest

import circuit_breaker as cb  # type: ignore[import-not-found]


@pytest.fixture(autouse=True)
def _reset_breakers():
    """Cada test parte de un registry limpio."""
    cb.reset_all()
    yield
    cb.reset_all()


class TestBreakerLifecycle:
    def test_initially_closed(self):
        b = cb.get_breaker("test_a", failure_threshold=3, cooldown_sec=1)
        assert b.state == cb.STATE_CLOSED
        assert b.allow() is True

    def test_opens_after_threshold(self):
        b = cb.get_breaker("test_b", failure_threshold=3, cooldown_sec=10)
        b.record_failure("fail1")
        b.record_failure("fail2")
        assert b.state == cb.STATE_CLOSED
        b.record_failure("fail3")
        assert b.state == cb.STATE_OPEN
        assert b.allow() is False

    def test_success_resets_counter(self):
        b = cb.get_breaker("test_c", failure_threshold=3, cooldown_sec=10)
        b.record_failure("fail")
        b.record_failure("fail")
        b.record_success()
        b.record_failure("fail")  # contador reseteado, solo 1
        assert b.state == cb.STATE_CLOSED

    def test_half_open_after_cooldown(self):
        b = cb.get_breaker("test_d", failure_threshold=2, cooldown_sec=0.1)
        b.record_failure()
        b.record_failure()
        assert b.state == cb.STATE_OPEN
        time.sleep(0.15)
        # allow() debe transicionar a HALF_OPEN
        assert b.allow() is True
        assert b.state == cb.STATE_HALF_OPEN

    def test_half_open_failure_reopens(self):
        b = cb.get_breaker("test_e", failure_threshold=2, cooldown_sec=0.1)
        b.record_failure()
        b.record_failure()
        time.sleep(0.15)
        b.allow()  # transición a HALF_OPEN
        b.record_failure("test")
        # En HALF_OPEN cualquier fallo reabre inmediatamente
        assert b.state == cb.STATE_OPEN

    def test_half_open_success_closes(self):
        b = cb.get_breaker("test_f", failure_threshold=2, cooldown_sec=0.1)
        b.record_failure()
        b.record_failure()
        time.sleep(0.15)
        b.allow()
        b.record_success()
        assert b.state == cb.STATE_CLOSED


class TestBreakerStatus:
    def test_status_shape(self):
        b = cb.get_breaker("test_status", failure_threshold=5, cooldown_sec=30)
        s = b.status()
        for key in ("name", "state", "failures", "threshold", "cooldown_sec",
                    "opened_at", "seconds_until_retry", "last_error"):
            assert key in s
        assert s["name"] == "test_status"
        assert s["state"] == cb.STATE_CLOSED
        assert s["seconds_until_retry"] == 0

    def test_status_seconds_until_retry_when_open(self):
        b = cb.get_breaker("test_retry", failure_threshold=1, cooldown_sec=10)
        b.record_failure("err")
        s = b.status()
        assert s["state"] == cb.STATE_OPEN
        assert s["seconds_until_retry"] > 0
        assert s["last_error"] == "err"


class TestGetBreakerRegistry:
    def test_same_name_returns_same_instance(self):
        b1 = cb.get_breaker("dup")
        b2 = cb.get_breaker("dup")
        assert b1 is b2

    def test_different_names_different_instances(self):
        b1 = cb.get_breaker("a")
        b2 = cb.get_breaker("b")
        assert b1 is not b2

    def test_all_status_includes_all_breakers(self):
        cb.get_breaker("api1")
        cb.get_breaker("api2")
        cb.get_breaker("api3")
        statuses = cb.all_status()
        names = [s["name"] for s in statuses]
        assert {"api1", "api2", "api3"}.issubset(set(names))

    def test_reset_all_resets_failures(self):
        b = cb.get_breaker("reset_target", failure_threshold=2)
        b.record_failure()
        b.record_failure()
        assert b.state == cb.STATE_OPEN
        cb.reset_all()
        assert b.state == cb.STATE_CLOSED


class TestWithBreakerDecorator:
    def test_decorator_passes_through_when_closed(self):
        @cb.with_breaker("deco_a", fallback="FB")
        def fn(x):
            return x * 2

        assert fn(5) == 10

    def test_decorator_returns_fallback_when_open(self):
        @cb.with_breaker("deco_b", fallback="FB")
        def fn():
            raise RuntimeError("kaboom")

        # Forzar apertura ejecutando 3 veces (threshold default)
        for _ in range(cb.FAILURE_THRESHOLD):
            assert fn() == "FB"

        # Ahora el breaker está abierto: ya no llama a fn, devuelve FB sin error
        assert fn() == "FB"

    def test_decorator_preserves_name_and_doc(self):
        @cb.with_breaker("deco_c")
        def my_func():
            """My doc."""
            return 1

        assert my_func.__name__ == "my_func"
        assert my_func.__doc__ == "My doc."


class TestThreadSafety:
    def test_concurrent_failures_safe(self):
        b = cb.get_breaker("concurrent", failure_threshold=50, cooldown_sec=60)
        n = 30
        threads = []

        def worker():
            for _ in range(10):
                b.record_failure()

        for _ in range(n):
            t = threading.Thread(target=worker)
            threads.append(t)
            t.start()
        for t in threads:
            t.join()

        # 30 threads × 10 fails = 300 fallos. Threshold=50 → abierto.
        assert b.state == cb.STATE_OPEN
