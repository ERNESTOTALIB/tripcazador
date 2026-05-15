"""
test_engine_silent_failures.py — SSS189 anti-regresión (15 may 2026)

Tests que VERIFICAN por inspección AST que los engines críticos
(duffel_engine, amadeus_engine) NO tienen `except Exception:` que
inmediatamente devuelva [] / None SIN un `print(...)` con info de debug
en el mismo bloque.

Esto es complementario a los tests funcionales — esta clase de bug
(motor entero falla silenciosamente y produce 0 deals durante semanas)
no se detecta con mocks felices. Solo con análisis estático que niega
el anti-patrón.

Si más adelante reescribes un engine en otro estilo, este test fallará
y deberás justificar el cambio (añadir log estructurado o pytest skip
con motivo).
"""

import ast
from pathlib import Path

import pytest

ENGINES_DIR = Path(__file__).resolve().parents[2] / "flight_hunter_v4"

CRITICAL_ENGINES = [
    "duffel_engine.py",
    "amadeus_engine.py",
]


def _collect_silent_excepts(src_path: Path) -> list[tuple[int, str]]:
    """
    Recorre el AST buscando `except Exception:` cuyo body sea
    [Return(...)] sin un print/log antes — patrón anti.

    Acepta como "no silent" cualquier except donde el body contenga
    al menos una llamada a print/logger.error/sys.stderr antes del return.

    Devuelve lista de (lineno, snippet) de los excepts problemáticos.
    """
    tree = ast.parse(src_path.read_text())
    findings: list[tuple[int, str]] = []

    for node in ast.walk(tree):
        if not isinstance(node, ast.ExceptHandler):
            continue
        # Solo nos importa el bare `except Exception:` o `except (Exception, ...)`
        # con bodies que devuelvan inmediatamente. NO los except (HTTPError,) más
        # específicos donde el caller probably maneja a otro nivel.
        if not _is_exception_catch(node):
            continue

        # ¿Tiene print/log en el body?
        if _has_observability(node.body):
            continue

        # ¿Solo devuelve sin observability?
        if _only_returns(node.body):
            findings.append((node.lineno, ast.unparse(node).splitlines()[0]))

    return findings


def _is_exception_catch(handler: ast.ExceptHandler) -> bool:
    if handler.type is None:
        return True  # bare except
    if isinstance(handler.type, ast.Name) and handler.type.id == "Exception":
        return True
    if isinstance(handler.type, ast.Tuple):
        return any(
            isinstance(e, ast.Name) and e.id == "Exception" for e in handler.type.elts
        )
    return False


def _has_observability(body: list[ast.stmt]) -> bool:
    for stmt in body:
        # Recorre el sub-tree por si el print está dentro de un if
        for sub in ast.walk(stmt):
            if isinstance(sub, ast.Call) and isinstance(sub.func, (ast.Name, ast.Attribute)):
                name = sub.func.id if isinstance(sub.func, ast.Name) else sub.func.attr
                if name in {"print", "warning", "error", "captureException", "exception", "debug", "info"}:
                    return True
    return False


def _only_returns(body: list[ast.stmt]) -> bool:
    # Body es exactamente [Return(...)] o [Return(...)]; sin print
    return all(isinstance(s, ast.Return) for s in body)


@pytest.mark.parametrize("engine_file", CRITICAL_ENGINES)
def test_no_silent_exception_catches(engine_file: str) -> None:
    """
    Cada engine crítico NO debe tener `except Exception: return ...` sin
    print/log explicativo en el body.

    SSS189: Duffel produjo 0 deals durante semanas por exactamente este
    patrón — los 3 try/except en _create_offer_request, _retrieve_offers
    y _search_one silenciaban todos los errores.
    """
    src_path = ENGINES_DIR / engine_file
    assert src_path.exists(), f"Engine file {engine_file} no encontrado"

    findings = _collect_silent_excepts(src_path)

    assert not findings, (
        f"{engine_file} tiene {len(findings)} `except Exception:` que devuelven "
        f"sin log/print → motor entero falla silenciosamente.\n"
        f"Locations: {findings}\n"
        f"Fix: añade print(f'❌ <engine> <fn> exception: {{type(exc).__name__}}: {{exc}}', flush=True) "
        f"antes del return."
    )


def test_duffel_engine_has_three_logged_excepts() -> None:
    """
    SSS189 fix verificó que duffel_engine.py tiene print con flush=True
    en _create_offer_request, _retrieve_offers, y _search_one.
    """
    src = (ENGINES_DIR / "duffel_engine.py").read_text()
    # Mínimo 3 prints de error en el archivo (uno por handler)
    error_prints = src.count("❌ Duffel")
    assert error_prints >= 3, (
        f"duffel_engine.py debe tener ≥3 prints '❌ Duffel' en sus except handlers. "
        f"Encontrados: {error_prints}. Si refactorizaste a logger en su lugar, "
        f"actualiza este test."
    )


def test_amadeus_engine_has_logged_excepts() -> None:
    """SSS189: amadeus_engine también tiene prints en _get_token + _search_one."""
    src = (ENGINES_DIR / "amadeus_engine.py").read_text()
    error_prints = src.count("❌ Amadeus")
    assert error_prints >= 2, (
        f"amadeus_engine.py debe tener ≥2 prints '❌ Amadeus' en sus except handlers. "
        f"Encontrados: {error_prints}."
    )
