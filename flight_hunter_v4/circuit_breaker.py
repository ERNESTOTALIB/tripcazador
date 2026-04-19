"""
Flight Hunter V4 — Circuit Breaker por API externa
===================================================
Tras N fallos consecutivos en una API (SerpAPI, Kiwi, RapidAPI, Duffel,
Travelpayouts...) el circuito se abre y las llamadas devuelven fallback
durante COOLDOWN segundos sin golpear el endpoint. Tras el cooldown el
circuito pasa a "half-open" y prueba una sola llamada; si tiene éxito se
cierra, si falla vuelve a abrirse.

Estados:
    CLOSED     → llamadas normales, errores contabilizados
    OPEN       → llamadas bloqueadas hasta que pase el cooldown
    HALF_OPEN  → una llamada de prueba permitida

Uso desde un engine::

    from circuit_breaker import get_breaker

    breaker = get_breaker("serpapi")

    def search(...):
        if not breaker.allow():
            log.warning("SerpAPI circuit open, skipping")
            return []
        try:
            data = _raw_call(...)
            breaker.record_success()
            return data
        except Exception as e:
            breaker.record_failure(e)
            return []

Configurable vía variables de entorno:
    CB_FAILURE_THRESHOLD  (default 3)   — fallos para abrir circuito
    CB_COOLDOWN_SEC       (default 900) — 15 minutos
"""
from __future__ import annotations

import os
import time
import threading
from dataclasses import dataclass, field
from typing import Dict, Optional

# ── Config ────────────────────────────────────────────────────────────
FAILURE_THRESHOLD = int(os.environ.get("CB_FAILURE_THRESHOLD", "3"))
COOLDOWN_SEC      = int(os.environ.get("CB_COOLDOWN_SEC", "900"))  # 15 min

# ── Estados ────────────────────────────────────────────────────────────
STATE_CLOSED    = "closed"
STATE_OPEN      = "open"
STATE_HALF_OPEN = "half_open"


@dataclass
class _Breaker:
    """Circuit breaker para una API externa específica."""

    name: str
    failure_threshold: int = FAILURE_THRESHOLD
    cooldown_sec: int = COOLDOWN_SEC

    state: str = STATE_CLOSED
    _failures: int = 0
    _opened_at: float = 0.0
    _last_error: Optional[str] = None
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def allow(self) -> bool:
        """Devuelve True si la llamada está permitida. Gestiona transición
        OPEN → HALF_OPEN tras el cooldown."""
        with self._lock:
            if self.state == STATE_CLOSED:
                return True
            if self.state == STATE_OPEN:
                if time.time() - self._opened_at >= self.cooldown_sec:
                    self.state = STATE_HALF_OPEN
                    return True
                return False
            # HALF_OPEN → solo una prueba; quien llama decide resultado
            return True

    def record_success(self) -> None:
        """Éxito: cierra el circuito y resetea contadores."""
        with self._lock:
            self.state = STATE_CLOSED
            self._failures = 0
            self._opened_at = 0.0
            self._last_error = None

    def record_failure(self, err: Exception | str | None = None) -> None:
        """Fallo: incrementa contador. Al llegar al umbral abre el
        circuito. Si estamos en HALF_OPEN cualquier fallo reabre el
        circuito inmediatamente."""
        with self._lock:
            self._last_error = str(err) if err else None
            if self.state == STATE_HALF_OPEN:
                self.state = STATE_OPEN
                self._opened_at = time.time()
                return
            self._failures += 1
            if self._failures >= self.failure_threshold:
                self.state = STATE_OPEN
                self._opened_at = time.time()

    def status(self) -> dict:
        """Snapshot para logging/monitoring."""
        with self._lock:
            return {
                "name": self.name,
                "state": self.state,
                "failures": self._failures,
                "threshold": self.failure_threshold,
                "cooldown_sec": self.cooldown_sec,
                "opened_at": self._opened_at,
                "seconds_until_retry": max(
                    0, self.cooldown_sec - (time.time() - self._opened_at)
                ) if self.state == STATE_OPEN else 0,
                "last_error": self._last_error,
            }

    def reset(self) -> None:
        """Reseteo manual (útil en tests o tras fix de API)."""
        with self._lock:
            self.state = STATE_CLOSED
            self._failures = 0
            self._opened_at = 0.0
            self._last_error = None


# ── Registro global de breakers (uno por API) ─────────────────────────
_REGISTRY: Dict[str, _Breaker] = {}
_REGISTRY_LOCK = threading.Lock()


def get_breaker(
    name: str,
    failure_threshold: Optional[int] = None,
    cooldown_sec: Optional[int] = None,
) -> _Breaker:
    """Devuelve el circuit breaker para la API `name`, creándolo la
    primera vez. Se comparte entre hilos y llamadas."""
    with _REGISTRY_LOCK:
        breaker = _REGISTRY.get(name)
        if breaker is None:
            breaker = _Breaker(
                name=name,
                failure_threshold=failure_threshold or FAILURE_THRESHOLD,
                cooldown_sec=cooldown_sec or COOLDOWN_SEC,
            )
            _REGISTRY[name] = breaker
        return breaker


def all_status() -> list[dict]:
    """Snapshot de todos los breakers — útil para /api/health."""
    with _REGISTRY_LOCK:
        return [b.status() for b in _REGISTRY.values()]


def reset_all() -> None:
    """Resetea todos los breakers (tests)."""
    with _REGISTRY_LOCK:
        for b in _REGISTRY.values():
            b.reset()


# ── Decorator opcional ─────────────────────────────────────────────────

def with_breaker(name: str, fallback=None):
    """Decorator: envuelve una función en un circuit breaker.

    Si el circuito está abierto, devuelve `fallback` sin llamar a la
    función. Cualquier excepción cuenta como fallo. Cualquier retorno
    sin excepción cuenta como éxito.

    Ejemplo::

        @with_breaker("serpapi", fallback=[])
        def search_serpapi(origin, destination): ...
    """
    breaker = get_breaker(name)

    def deco(fn):
        def wrapper(*args, **kwargs):
            if not breaker.allow():
                return fallback
            try:
                result = fn(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure(e)
                return fallback

        wrapper.__name__ = fn.__name__
        wrapper.__doc__ = fn.__doc__
        return wrapper

    return deco
