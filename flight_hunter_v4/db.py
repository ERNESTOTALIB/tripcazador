"""
Flight Hunter V4 — Base de Datos SQLite
=========================================
Historial de precios para:
- Baseline histórico por ruta (T5)
- Flash drop detection (T6)
- Deduplicación de vuelos
- Tracking de anomalías detectadas
"""

import sqlite3
import json
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Tuple
import config


def get_conn():
    conn = sqlite3.connect(config.PRICE_DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS flights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        date_out TEXT,
        date_ret TEXT,
        price_eur REAL NOT NULL,
        airline TEXT,
        stops INTEGER DEFAULT 0,
        cabin TEXT DEFAULT 'Economy',
        cabin_code INTEGER DEFAULT 1,
        duration_minutes INTEGER,
        source TEXT,
        booking_url TEXT,
        scraped_at TEXT NOT NULL,
        run_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_route_cabin ON flights(origin, destination, cabin_code, scraped_at);
    CREATE INDEX IF NOT EXISTS idx_price ON flights(price_eur);

    CREATE TABLE IF NOT EXISTS anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin TEXT, destination TEXT,
        classification TEXT,
        price_eur REAL,
        cabin_code INTEGER,
        airline TEXT,
        final_score REAL,
        techniques TEXT,
        booking_url TEXT,
        detected_at TEXT NOT NULL,
        run_id TEXT
    );

    CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        started_at TEXT,
        finished_at TEXT,
        mode TEXT,
        origins TEXT,
        total_flights INTEGER,
        anomalies_found INTEGER
    );
    """)
    conn.commit()
    conn.close()


def save_flights(flights: List[Dict], run_id: str = None) -> int:
    if not flights:
        return 0
    conn = get_conn()
    saved = 0
    now = datetime.now().isoformat()
    for f in flights:
        try:
            conn.execute("""
            INSERT OR IGNORE INTO flights
              (origin, destination, date_out, date_ret, price_eur, airline,
               stops, cabin, cabin_code, source, booking_url, scraped_at, run_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                f.get("origin"), f.get("destination"),
                f.get("date_out"), f.get("date_ret"),
                f.get("price_eur", 0), f.get("airline", ""),
                f.get("stops", 0), f.get("cabin", "Economy"),
                f.get("cabin_code", 1), f.get("source", "kiwi"),
                f.get("booking_url", ""),
                f.get("scraped_at", now), run_id
            ))
            saved += conn.execute("SELECT changes()").fetchone()[0]
        except Exception:
            continue
    conn.commit()
    conn.close()
    return saved


def save_anomalies(anomalies: List[Dict], run_id: str = None):
    if not anomalies:
        return
    conn = get_conn()
    now = datetime.now().isoformat()
    for a in anomalies:
        try:
            conn.execute("""
            INSERT INTO anomalies
              (origin, destination, classification, price_eur, cabin_code,
               airline, final_score, techniques, booking_url, detected_at, run_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
            """, (
                a.get("origin"), a.get("destination"),
                a.get("classification"), a.get("price_eur"),
                a.get("cabin_code"), a.get("airline"),
                a.get("final_score"),
                json.dumps(a.get("techniques_triggered", [])),
                a.get("booking_url"), now, run_id
            ))
        except Exception:
            continue
    conn.commit()
    conn.close()


def get_historical_baselines(flights: List[Dict], days: int = 30) -> Dict:
    """
    Retorna baseline histórico por (origin, dest, cabin_code).
    Útil para T5 (comparación histórica).
    """
    if not flights:
        return {}

    routes = list(set(
        (f["origin"], f["destination"], f.get("cabin_code", 1))
        for f in flights
    ))

    conn = get_conn()
    since = (datetime.now() - timedelta(days=days)).isoformat()
    baselines = {}

    for origin, dest, cabin in routes:
        rows = conn.execute("""
        SELECT price_eur FROM flights
        WHERE origin=? AND destination=? AND cabin_code=?
          AND scraped_at >= ?
        ORDER BY scraped_at DESC LIMIT 100
        """, (origin, dest, cabin, since)).fetchall()

        if rows:
            prices = [r[0] for r in rows]
            baselines[(origin, dest, cabin)] = prices

    conn.close()
    return baselines


def get_recent_prices(flights: List[Dict], hours: int = 24) -> Dict:
    """
    Retorna precios de las últimas N horas por (origin, dest, cabin, airline).
    Útil para T6 (flash drop detection).
    """
    if not flights:
        return {}

    conn = get_conn()
    since = (datetime.now() - timedelta(hours=hours)).isoformat()
    recent = {}

    routes = list(set(
        (f["origin"], f["destination"], f.get("cabin_code", 1), f.get("airline", ""))
        for f in flights
    ))

    for origin, dest, cabin, airline in routes:
        row = conn.execute("""
        SELECT MIN(price_eur) FROM flights
        WHERE origin=? AND destination=? AND cabin_code=? AND airline=?
          AND scraped_at < ?
        ORDER BY scraped_at DESC LIMIT 1
        """, (origin, dest, cabin, airline, since)).fetchone()

        if row and row[0]:
            recent[(origin, dest, cabin, airline)] = row[0]

    conn.close()
    return recent


def start_run(mode: str, origins: List[str]) -> str:
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    conn = get_conn()
    conn.execute("""
    INSERT INTO runs (id, started_at, mode, origins)
    VALUES (?,?,?,?)
    """, (run_id, datetime.now().isoformat(), mode, json.dumps(origins)))
    conn.commit()
    conn.close()
    return run_id


def finish_run(run_id: str, total_flights: int, anomalies_found: int):
    conn = get_conn()
    conn.execute("""
    UPDATE runs SET finished_at=?, total_flights=?, anomalies_found=?
    WHERE id=?
    """, (datetime.now().isoformat(), total_flights, anomalies_found, run_id))
    conn.commit()
    conn.close()
