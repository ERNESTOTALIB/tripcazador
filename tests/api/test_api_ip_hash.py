"""
Tests de regresión para el hash estable de IP usado en /api/subscribe.

Contexto: antes se usaba `hash(client_ip)` de Python, que varía entre procesos por
PYTHONHASHSEED. Eso rompía la deduplicación histórica de suscripciones tras cada
reinicio del contenedor. El fix reemplaza por SHA256(salt + ip)[:16] con salt
configurable vía env var IP_HASH_SALT.
"""
from __future__ import annotations

import hashlib
import os
from unittest import mock

import pytest


# Importamos la función sin arrancar la app (es un helper puro).
# La conftest añade api/ a sys.path como top-level, así que importamos 'main'.
from main import _stable_ip_hash  # type: ignore[import-not-found]


class TestStableIpHash:
    def test_same_ip_same_salt_deterministic(self):
        """Misma IP + misma salt → mismo hash (requisito para dedupe cross-restart)."""
        h1 = _stable_ip_hash("192.168.1.1")
        h2 = _stable_ip_hash("192.168.1.1")
        assert h1 == h2

    def test_different_ips_different_hashes(self):
        """IPs distintas → hashes distintos (sin colisiones en el espacio de prueba)."""
        ips = ["10.0.0.1", "10.0.0.2", "172.16.5.4", "::1", "2001:db8::1", "unknown"]
        hashes = [_stable_ip_hash(ip) for ip in ips]
        assert len(set(hashes)) == len(ips), f"colisión detectada: {hashes}"

    def test_hash_length_is_16_hex(self):
        """Hash trunc a 16 chars hex (2^64, suficiente para anti-enumeración de IPs)."""
        h = _stable_ip_hash("1.2.3.4")
        assert len(h) == 16
        assert all(c in "0123456789abcdef" for c in h), f"no-hex char en {h}"

    def test_salt_rotation_changes_hash(self):
        """Cambiar IP_HASH_SALT produce hashes distintos (para rotación controlada)."""
        with mock.patch.dict(os.environ, {"IP_HASH_SALT": "salt-v1"}):
            h_v1 = _stable_ip_hash("8.8.8.8")
        with mock.patch.dict(os.environ, {"IP_HASH_SALT": "salt-v2"}):
            h_v2 = _stable_ip_hash("8.8.8.8")
        assert h_v1 != h_v2, "rotar salt debería cambiar el hash"

    def test_default_salt_is_tripcazador(self):
        """Salt por defecto explícita, no una cadena vacía (evita hashes predecibles)."""
        # Forzar ausencia de la env var
        env = {k: v for k, v in os.environ.items() if k != "IP_HASH_SALT"}
        with mock.patch.dict(os.environ, env, clear=True):
            h = _stable_ip_hash("1.1.1.1")
        expected = hashlib.sha256(b"tripcazador" + b"1.1.1.1").hexdigest()[:16]
        assert h == expected

    def test_avalanche_neighbouring_ips_produce_distant_hashes(self):
        """Propiedad avalanche: cambiar 1 bit de IP produce hashes muy distintos (no prefijo compartido)."""
        h1 = _stable_ip_hash("203.0.113.42")
        h2 = _stable_ip_hash("203.0.113.43")
        # Longest common prefix debería ser corto (≤ 2 chars para SHA256 truncado a 16)
        common = 0
        for a, b in zip(h1, h2):
            if a == b:
                common += 1
            else:
                break
        assert common <= 4, f"demasiado prefijo común ({common}) entre {h1} y {h2}"

    def test_unknown_ip_still_hashes(self):
        """El fallback 'unknown' (cuando request.client es None) produce un hash estable."""
        h1 = _stable_ip_hash("unknown")
        h2 = _stable_ip_hash("unknown")
        assert h1 == h2
        assert len(h1) == 16

    def test_ipv4_ipv6_produce_distinct_hashes(self):
        """IPv4 y IPv6 de la misma máquina lógica → hashes distintos (no equivalencia)."""
        h4 = _stable_ip_hash("127.0.0.1")
        h6 = _stable_ip_hash("::1")
        assert h4 != h6


class TestStableIpHashRegressionAgainstPythonHash:
    """
    Demuestra por qué no usar hash() de Python:
    no testeamos el comportamiento inestable (requeriría re-exec),
    pero sí el contrato que _stable_ip_hash ofrece y que hash() no ofrece.
    """

    def test_output_is_string_not_int(self):
        """hash() devuelve int negativo/positivo variable; nosotros necesitamos string para JSON."""
        result = _stable_ip_hash("10.0.0.1")
        assert isinstance(result, str)

    def test_no_collisions_in_small_ipv4_range(self):
        """Sin colisiones triviales en un rango de IPs vecinas (regresión anti-hashing naive)."""
        hashes = {_stable_ip_hash(f"10.0.0.{i}") for i in range(256)}
        assert len(hashes) == 256
