#!/usr/bin/env python3
"""
migrate_sqlite_to_postgres.py

Migra los datos de las BBDD SQLite locales (`flights_v4.db` + `price_history_v4.db`)
y del log JSONL (`deals_log.jsonl`) a la BD Postgres ya provisionada por `sql/init.sql`.

Uso:
    # requisitos:
    pip install psycopg[binary] python-dotenv

    # configurar variables:
    export DATABASE_URL=postgresql://tripcazador:PASS@localhost:5432/tripcazador
    export FLIGHTS_DB=/opt/tripcazador/flight_hunter_v4/flights_v4.db
    export PRICE_HISTORY_DB=/opt/tripcazador/flight_hunter_v4/price_history_v4.db
    export DEALS_LOG=/opt/tripcazador/flight_hunter_v4/deals_log.jsonl

    # ejecución:
    python scripts/migrate_sqlite_to_postgres.py --all
    python scripts/migrate_sqlite_to_postgres.py --flights-only
    python scripts/migrate_sqlite_to_postgres.py --dry-run

El script es IDEMPOTENTE: usa INSERT ... ON CONFLICT DO NOTHING en claves naturales.
Genera un informe final con contadores.
"""
from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from contextlib import contextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

try:
    import psycopg
except ImportError:
    print("❌ Falta dependencia: pip install 'psycopg[binary]'", file=sys.stderr)
    sys.exit(1)

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


FLIGHTS_DB = Path(os.getenv("FLIGHTS_DB", "flight_hunter_v4/flights_v4.db"))
PRICE_HISTORY_DB = Path(os.getenv("PRICE_HISTORY_DB", "flight_hunter_v4/price_history_v4.db"))
DEALS_LOG = Path(os.getenv("DEALS_LOG", "flight_hunter_v4/deals_log.jsonl"))
DATABASE_URL = os.getenv("DATABASE_URL")


@dataclass
class Stats:
    inserted: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)

    def report(self, name: str) -> None:
        print(f"[{name}] inserted={self.inserted} skipped={self.skipped} errors={len(self.errors)}")
        for e in self.errors[:5]:
            print(f"   · {e}")


@contextmanager
def sqlite_conn(path: Path):
    if not path.exists():
        print(f"⚠️  SQLite no encontrado: {path} — se omite")
        yield None
        return
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def migrate_flights(pg, src_conn, dry_run: bool) -> Stats:
    """Migra tabla `flights` de flights_v4.db."""
    stats = Stats()
    if src_conn is None:
        return stats

    # detectar nombre de tabla flexible
    tables = [r[0] for r in src_conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]
    table = next((t for t in tables if t in ("flights", "flights_v4", "vuelos")), None)
    if not table:
        stats.errors.append(f"ninguna tabla de vuelos encontrada en {tables}")
        return stats

    cursor = src_conn.execute(f"SELECT * FROM {table}")  # noqa: S608 (table whitelisted)
    cols = [d[0] for d in cursor.description]

    sql = """
    INSERT INTO flights (
        origin, destination, airline, airline_name, price_eur, cabin,
        date_out, date_back, nights, duration_min, booking_url,
        source_engine, found_at
    ) VALUES (
        %(origin)s, %(destination)s, %(airline)s, %(airline_name)s, %(price_eur)s, %(cabin)s,
        %(date_out)s, %(date_back)s, %(nights)s, %(duration_min)s, %(booking_url)s,
        %(source_engine)s, COALESCE(%(found_at)s, NOW())
    )
    ON CONFLICT DO NOTHING
    """

    with pg.cursor() as cur:
        for row in cursor:
            rec = {c: row[c] if c in cols else None for c in (
                "origin","destination","airline","airline_name","price_eur","cabin",
                "date_out","date_back","nights","duration_min","booking_url",
                "source_engine","found_at"
            )}
            try:
                if dry_run:
                    stats.inserted += 1
                    continue
                cur.execute(sql, rec)
                if cur.rowcount == 1:
                    stats.inserted += 1
                else:
                    stats.skipped += 1
            except Exception as e:
                stats.errors.append(str(e))
        if not dry_run:
            pg.commit()
    return stats


def migrate_deals_log(pg, dry_run: bool) -> Stats:
    """Parsea deals_log.jsonl y mete las entradas en tabla `deals` + `flights`."""
    stats = Stats()
    if not DEALS_LOG.exists():
        print(f"⚠️  {DEALS_LOG} no existe — se omite")
        return stats

    sql_flight = """
    INSERT INTO flights (
        origin, destination, airline, airline_name, price_eur, cabin,
        date_out, date_back, source_engine, found_at
    ) VALUES (
        %(origin)s, %(destination)s, %(airline)s, %(airline_name)s, %(price_eur)s, %(cabin)s,
        %(date_out)s, %(date_ret)s, %(source)s, COALESCE(%(logged_at)s::timestamptz, NOW())
    )
    RETURNING id
    """

    with pg.cursor() as cur:
        for line in DEALS_LOG.read_text(errors="ignore").splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError as e:
                stats.errors.append(f"JSON inválido: {e}")
                continue

            if not entry.get("origin") or not entry.get("destination") or not entry.get("price_eur"):
                stats.skipped += 1
                continue

            if dry_run:
                stats.inserted += 1
                continue
            try:
                cur.execute(sql_flight, entry)
                stats.inserted += 1
            except Exception as e:
                stats.errors.append(str(e))
        if not dry_run:
            pg.commit()
    return stats


def migrate_price_history(pg, src_conn, dry_run: bool) -> Stats:
    stats = Stats()
    if src_conn is None:
        return stats

    tables = [r[0] for r in src_conn.execute("SELECT name FROM sqlite_master WHERE type='table'")]
    table = next((t for t in tables if "price" in t.lower() or "history" in t.lower()), None)
    if not table:
        return stats

    cursor = src_conn.execute(f"SELECT * FROM {table}")  # noqa: S608
    cols = [d[0] for d in cursor.description]

    sql = """
    INSERT INTO price_history (origin, destination, cabin, date_out, price_eur, recorded_at)
    VALUES (%(origin)s, %(destination)s, %(cabin)s, %(date_out)s, %(price_eur)s,
            COALESCE(%(recorded_at)s::timestamptz, NOW()))
    ON CONFLICT DO NOTHING
    """

    with pg.cursor() as cur:
        for row in cursor:
            rec = {c: (row[c] if c in cols else None) for c in ("origin","destination","cabin","date_out","price_eur","recorded_at")}
            rec.setdefault("cabin", "economy")
            try:
                if dry_run:
                    stats.inserted += 1
                    continue
                cur.execute(sql, rec)
                if cur.rowcount == 1:
                    stats.inserted += 1
                else:
                    stats.skipped += 1
            except Exception as e:
                stats.errors.append(str(e))
        if not dry_run:
            pg.commit()
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Migra SQLite/JSONL → Postgres")
    parser.add_argument("--all", action="store_true", help="Migra todo (flights + deals_log + price_history)")
    parser.add_argument("--flights-only", action="store_true")
    parser.add_argument("--deals-log-only", action="store_true")
    parser.add_argument("--price-history-only", action="store_true")
    parser.add_argument("--dry-run", action="store_true", help="No escribe en Postgres, solo cuenta")
    args = parser.parse_args()

    if not any([args.all, args.flights_only, args.deals_log_only, args.price_history_only]):
        parser.error("especifica qué migrar: --all / --flights-only / --deals-log-only / --price-history-only")

    if not DATABASE_URL:
        print("❌ Falta DATABASE_URL", file=sys.stderr)
        return 2

    print(f"🔌 Conectando a Postgres: {DATABASE_URL.split('@')[-1]}")
    print(f"   dry_run={args.dry_run}")
    with psycopg.connect(DATABASE_URL, autocommit=False) as pg:
        if args.all or args.flights_only:
            with sqlite_conn(FLIGHTS_DB) as src:
                migrate_flights(pg, src, args.dry_run).report("flights")
        if args.all or args.deals_log_only:
            migrate_deals_log(pg, args.dry_run).report("deals_log")
        if args.all or args.price_history_only:
            with sqlite_conn(PRICE_HISTORY_DB) as src:
                migrate_price_history(pg, src, args.dry_run).report("price_history")
    print("✅ Migración completada")
    return 0


if __name__ == "__main__":
    sys.exit(main())
