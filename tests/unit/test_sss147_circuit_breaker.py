"""
SSS147 — Circuit breaker deep edge cases.
=========================================
Tests for _Breaker state transitions, get_breaker registry,
all_status, reset_all, with_breaker decorator.
"""
from __future__ import annotations

import time
from unittest.mock import patch

import pytest

import circuit_breaker as cb


@pytest.fixture(autouse=True)
def _reset_registry():
    """Clean registry between tests."""
    cb._REGISTRY.clear()
    yield
    cb._REGISTRY.clear()


# ─────────────────────────────────────────────────────────────────
# _Breaker basic state transitions
# ─────────────────────────────────────────────────────────────────
def test_breaker_starts_closed():
    b = cb._Breaker(name="test", failure_threshold=3, cooldown_sec=60)
    assert b.state == cb.STATE_CLOSED
    assert b.allow() is True


def test_breaker_remains_closed_below_threshold():
    b = cb._Breaker(name="test", failure_threshold=3, cooldown_sec=60)
    b.record_failure("err1")
    b.record_failure("err2")
    assert b.state == cb.STATE_CLOSED
    assert b.allow() is True


def test_breaker_opens_after_threshold():
    b = cb._Breaker(name="test", failure_threshold=3, cooldown_sec=60)
    for _ in range(3):
        b.record_failure("err")
    assert b.state == cb.STATE_OPEN
    assert b.allow() is False


def test_breaker_remains_open_during_cooldown():
    b = cb._Breaker(name="test", failure_threshold=2, cooldown_sec=3600)
    b.record_failure()
    b.record_failure()
    assert b.state == cb.STATE_OPEN
    assert b.allow() is False  # within cooldown


def test_breaker_half_open_after_cooldown():
    b = cb._Breaker(name="test", failure_threshold=2, cooldown_sec=1)
    b.record_failure()
    b.record_failure()
    # Simulate cooldown elapsed
    b._opened_at = time.time() - 100
    assert b.allow() is True
    assert b.state == cb.STATE_HALF_OPEN


def test_breaker_half_open_then_success_closes():
    b = cb._Breaker(name="test", failure_threshold=2, cooldown_sec=60)
    b.state = cb.STATE_HALF_OPEN
    b.record_success()
    assert b.state == cb.STATE_CLOSED
    assert b._failures == 0


def test_breaker_half_open_then_failure_reopens():
    b = cb._Breaker(name="test", failure_threshold=2, cooldown_sec=60)
    b.state = cb.STATE_HALF_OPEN
    b._failures = 0
    b.record_failure("retry-failed")
    assert b.state == cb.STATE_OPEN


def test_breaker_record_success_resets_counters():
    b = cb._Breaker(name="test", failure_threshold=3, cooldown_sec=60)
    b.record_failure()
    b.record_failure()
    b.record_success()
    assert b._failures == 0
    assert b._last_error is None
    assert b._opened_at == 0.0


def test_breaker_record_failure_stores_last_error():
    b = cb._Breaker(name="test")
    b.record_failure(ValueError("kaboom"))
    assert b._last_error is not None
    assert "kaboom" in b._last_error


def test_breaker_record_failure_no_error_arg():
    b = cb._Breaker(name="test")
    b.record_failure()
    assert b._failures == 1


def test_breaker_status_dict_keys():
    b = cb._Breaker(name="test")
    s = b.status()
    expected = {"name", "state", "failures", "threshold", "cooldown_sec",
                "opened_at", "seconds_until_retry", "last_error"}
    assert expected.issubset(set(s.keys()))


def test_breaker_status_when_open_has_seconds_until_retry():
    b = cb._Breaker(name="test", failure_threshold=1, cooldown_sec=60)
    b.record_failure()
    s = b.status()
    assert s["state"] == cb.STATE_OPEN
    assert s["seconds_until_retry"] >= 0


def test_breaker_status_when_closed_seconds_zero():
    b = cb._Breaker(name="test")
    s = b.status()
    assert s["seconds_until_retry"] == 0


def test_breaker_reset_returns_to_closed():
    b = cb._Breaker(name="test", failure_threshold=2, cooldown_sec=60)
    b.record_failure()
    b.record_failure()
    b.reset()
    assert b.state == cb.STATE_CLOSED
    assert b._failures == 0


# ─────────────────────────────────────────────────────────────────
# get_breaker registry
# ─────────────────────────────────────────────────────────────────
def test_get_breaker_creates_on_first_call():
    b = cb.get_breaker("new-api")
    assert b is not None
    assert b.name == "new-api"


def test_get_breaker_returns_same_instance_for_same_name():
    b1 = cb.get_breaker("api1")
    b2 = cb.get_breaker("api1")
    assert b1 is b2


def test_get_breaker_different_names_different_instances():
    b1 = cb.get_breaker("api1")
    b2 = cb.get_breaker("api2")
    assert b1 is not b2


def test_get_breaker_custom_threshold():
    b = cb.get_breaker("custom", failure_threshold=10, cooldown_sec=120)
    assert b.failure_threshold == 10
    assert b.cooldown_sec == 120


# ─────────────────────────────────────────────────────────────────
# all_status
# ─────────────────────────────────────────────────────────────────
def test_all_status_empty():
    assert cb.all_status() == []


def test_all_status_contains_registered():
    cb.get_breaker("a")
    cb.get_breaker("b")
    s = cb.all_status()
    names = {x["name"] for x in s}
    assert names == {"a", "b"}


def test_reset_all_resets_all_breakers():
    b1 = cb.get_breaker("a", failure_threshold=2)
    b2 = cb.get_breaker("b", failure_threshold=2)
    b1.record_failure()
    b1.record_failure()
    b2.record_failure()
    cb.reset_all()
    assert b1.state == cb.STATE_CLOSED
    assert b2.state == cb.STATE_CLOSED


# ─────────────────────────────────────────────────────────────────
# with_breaker decorator
# ─────────────────────────────────────────────────────────────────
def test_with_breaker_decorator_success():
    @cb.with_breaker("test-deco", fallback=[])
    def myfn(x):
        return [x, x + 1]

    assert myfn(5) == [5, 6]


def test_with_breaker_decorator_failure_returns_fallback():
    @cb.with_breaker("test-deco-fail", fallback="DEFAULT")
    def myfn():
        raise ValueError("boom")

    # 1st call counts as failure → returns fallback
    assert myfn() == "DEFAULT"


def test_with_breaker_decorator_opens_after_threshold():
    @cb.with_breaker("test-deco-thresh", fallback=None)
    def myfn():
        raise RuntimeError("err")

    # Trigger 3 failures (default threshold)
    for _ in range(cb.FAILURE_THRESHOLD):
        assert myfn() is None
    # Next call should hit the open circuit, still returning fallback
    assert myfn() is None
    breaker = cb.get_breaker("test-deco-thresh")
    assert breaker.state == cb.STATE_OPEN


def test_with_breaker_decorator_preserves_name():
    @cb.with_breaker("test-deco-name")
    def myfn():
        """docstring"""
        return 42

    assert myfn.__name__ == "myfn"
    assert myfn.__doc__ == "docstring"


def test_with_breaker_decorator_fallback_default_none():
    @cb.with_breaker("test-deco-none")
    def myfn():
        raise Exception()

    assert myfn() is None


@pytest.mark.parametrize("fallback", [[], {}, 0, "", None, "FALLBACK"])
def test_with_breaker_various_fallbacks(fallback):
    name = f"test-deco-fb-{fallback!r}"
    @cb.with_breaker(name, fallback=fallback)
    def myfn():
        raise IOError()

    assert myfn() == fallback


def test_breaker_threshold_param_to_record_failure():
    # Custom higher threshold
    b = cb._Breaker(name="t", failure_threshold=5)
    for _ in range(4):
        b.record_failure()
    assert b.state == cb.STATE_CLOSED
    b.record_failure()
    assert b.state == cb.STATE_OPEN
