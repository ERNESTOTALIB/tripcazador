"""
Travel Hunter - Price Tracker
Almacena historial de precios en SQLite para detectar bajadas y errores de precio.
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict
from dataclasses import asdict


# Importar tipos del scraper
import sys
sys.path.insert(0, os.path.dirname(__file__))
from scraper import FlightResult, HotelResult


class PriceTracker:
    """Gestiona historial de precios y detecta oportunidades."""

    def __init__(self, db_path: str = "travel_prices.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Crea las tablas si no existen."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        c.execute("""
            CREATE TABLE IF NOT EXISTS flight_prices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id TEXT,
                platform TEXT,
                airline TEXT,
                price REAL,
                currency TEXT,
                origin TEXT,
                destination TEXT,
                date_depart TEXT,
                date_return TEXT,
                stops INTEGER,
                duration TEXT,
                url TEXT,
                is_direct_airline INTEGER DEFAULT 0,
                scraped_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS hotel_prices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id TEXT,
                platform TEXT,
                name TEXT,
                price_per_night REAL,
                price_total REAL,
                currency TEXT,
                destination TEXT,
                checkin TEXT,
                checkout TEXT,
                rating REAL,
                review_count INTEGER,
                board_type TEXT,
                stars INTEGER,
                url TEXT,
                is_direct_hotel INTEGER DEFAULT 0,
                scraped_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS price_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_type TEXT,
                route TEXT,
                old_price REAL,
                new_price REAL,
                drop_percent REAL,
                platform TEXT,
                details TEXT,
                url TEXT,
                notified INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                search_id TEXT,
                search_type TEXT,
                params TEXT,
                results_count INTEGER,
                best_price REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ---- TABLAS PARA DETECCIÓN DE ANOMALÍAS ----

        c.execute("""
            CREATE TABLE IF NOT EXISTS hotel_room_variants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scan_id TEXT,
                hotel_name TEXT,
                destination TEXT,
                occupancy_label TEXT,
                adults INTEGER,
                rooms INTEGER,
                price_per_night REAL,
                price_total REAL,
                currency TEXT,
                rating REAL,
                review_count INTEGER,
                stars INTEGER,
                board_type TEXT,
                checkin TEXT,
                checkout TEXT,
                url TEXT,
                scraped_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS zone_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                destination TEXT,
                checkin TEXT,
                checkout TEXT,
                star_category TEXT,
                median_price REAL,
                p10_price REAL,
                p25_price REAL,
                p75_price REAL,
                p90_price REAL,
                mean_price REAL,
                std_dev REAL,
                sample_count INTEGER,
                data_date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        c.execute("""
            CREATE TABLE IF NOT EXISTS hotel_anomalies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                scan_id TEXT,
                hotel_name TEXT,
                destination TEXT,
                anomaly_type TEXT,
                severity_score INTEGER,
                explanation TEXT,
                evidence_json TEXT,
                booking_url TEXT,
                checkin TEXT,
                checkout TEXT,
                notified INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Índices para consultas frecuentes
        c.execute("CREATE INDEX IF NOT EXISTS idx_flight_route ON flight_prices(origin, destination, date_depart)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_hotel_dest ON hotel_prices(destination, checkin)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_alerts_notified ON price_alerts(notified)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_variants_dest ON hotel_room_variants(destination, checkin)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_variants_hotel ON hotel_room_variants(hotel_name, destination)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_zone_dest ON zone_profiles(destination, checkin)")
        c.execute("CREATE INDEX IF NOT EXISTS idx_anomalies_notified ON hotel_anomalies(notified)")

        conn.commit()
        conn.close()

    # =========================================================================
    # GUARDAR RESULTADOS
    # =========================================================================

    def save_flights(self, search_id: str, flights: List[FlightResult]):
        """Guarda resultados de vuelos."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        for f in flights:
            c.execute("""
                INSERT INTO flight_prices
                (search_id, platform, airline, price, currency, origin, destination,
                 date_depart, date_return, stops, duration, url, is_direct_airline, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                search_id, f.platform, f.airline, f.price, f.currency,
                f.origin, f.destination, f.date_depart, f.date_return,
                f.stops, f.duration, f.url, int(f.is_direct_airline), f.scraped_at
            ))

        conn.commit()
        conn.close()

    def save_hotels(self, search_id: str, hotels: List[HotelResult]):
        """Guarda resultados de hoteles."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        for h in hotels:
            c.execute("""
                INSERT INTO hotel_prices
                (search_id, platform, name, price_per_night, price_total, currency,
                 destination, checkin, checkout, rating, review_count, board_type,
                 stars, url, is_direct_hotel, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                search_id, h.platform, h.name, h.price_per_night, h.price_total,
                h.currency, h.destination, h.checkin, h.checkout, h.rating,
                h.review_count, h.board_type, h.stars, h.url,
                int(h.is_direct_hotel), h.scraped_at
            ))

        conn.commit()
        conn.close()

    def save_search(self, search_id: str, search_type: str, params: dict,
                    results_count: int, best_price: float):
        """Guarda registro de búsqueda."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            INSERT INTO search_history (search_id, search_type, params, results_count, best_price)
            VALUES (?, ?, ?, ?, ?)
        """, (search_id, search_type, json.dumps(params), results_count, best_price))
        conn.commit()
        conn.close()

    # =========================================================================
    # ANÁLISIS DE PRECIOS
    # =========================================================================

    def get_price_history(
        self, origin: str, destination: str, date_depart: str, days_back: int = 30
    ) -> List[dict]:
        """Obtiene historial de precios de vuelos para una ruta."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        cutoff = (datetime.now() - timedelta(days=days_back)).isoformat()
        c.execute("""
            SELECT platform, airline, price, currency, stops, duration, scraped_at
            FROM flight_prices
            WHERE origin = ? AND destination = ? AND date_depart = ?
              AND scraped_at > ?
            ORDER BY scraped_at DESC
        """, (origin, destination, date_depart, cutoff))

        results = [dict(row) for row in c.fetchall()]
        conn.close()
        return results

    def get_hotel_price_history(
        self, destination: str, checkin: str, days_back: int = 30
    ) -> List[dict]:
        """Obtiene historial de precios de hoteles para un destino."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        cutoff = (datetime.now() - timedelta(days=days_back)).isoformat()
        c.execute("""
            SELECT platform, name, price_per_night, price_total, currency,
                   rating, board_type, stars, scraped_at
            FROM hotel_prices
            WHERE destination = ? AND checkin = ? AND scraped_at > ?
            ORDER BY scraped_at DESC
        """, (destination, checkin, cutoff))

        results = [dict(row) for row in c.fetchall()]
        conn.close()
        return results

    def detect_price_drops(
        self,
        flights: List[FlightResult],
        min_drop_percent: float = 5.0,
    ) -> List[dict]:
        """
        Detecta bajadas de precio comparando con datos históricos.

        Args:
            flights: Resultados actuales de vuelos
            min_drop_percent: Porcentaje mínimo de bajada para alertar

        Returns:
            Lista de alertas de bajada de precio
        """
        alerts = []
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        for flight in flights:
            # Buscar el precio más bajo anterior para esta ruta+aerolínea
            c.execute("""
                SELECT MIN(price) as min_price, AVG(price) as avg_price
                FROM flight_prices
                WHERE origin = ? AND destination = ? AND date_depart = ?
                  AND airline = ? AND platform = ?
                  AND scraped_at < ?
            """, (
                flight.origin, flight.destination, flight.date_depart,
                flight.airline, flight.platform, flight.scraped_at
            ))

            row = c.fetchone()
            if row and row[0] is not None:
                prev_min = row[0]
                prev_avg = row[1]

                if flight.price < prev_min:
                    drop_pct = ((prev_min - flight.price) / prev_min) * 100
                    if drop_pct >= min_drop_percent:
                        alert = {
                            "type": "price_drop",
                            "category": "flight",
                            "route": f"{flight.origin} → {flight.destination}",
                            "airline": flight.airline,
                            "platform": flight.platform,
                            "old_price": prev_min,
                            "new_price": flight.price,
                            "avg_price": round(prev_avg, 2),
                            "drop_percent": round(drop_pct, 2),
                            "dates": f"{flight.date_depart} → {flight.date_return}",
                            "url": flight.url,
                        }
                        alerts.append(alert)

                        # Guardar alerta en DB
                        c.execute("""
                            INSERT INTO price_alerts
                            (alert_type, route, old_price, new_price, drop_percent,
                             platform, details, url)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            "flight_drop",
                            f"{flight.origin}-{flight.destination}",
                            prev_min, flight.price, drop_pct,
                            flight.platform,
                            json.dumps(alert),
                            flight.url,
                        ))

        conn.commit()
        conn.close()
        return alerts

    def detect_hotel_price_drops(
        self,
        hotels: List[HotelResult],
        min_drop_percent: float = 5.0,
    ) -> List[dict]:
        """Detecta bajadas de precio en hoteles."""
        alerts = []
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        for hotel in hotels:
            c.execute("""
                SELECT MIN(price_total) as min_price, AVG(price_total) as avg_price
                FROM hotel_prices
                WHERE destination = ? AND checkin = ? AND name = ? AND platform = ?
                  AND scraped_at < ?
            """, (
                hotel.destination, hotel.checkin, hotel.name,
                hotel.platform, hotel.scraped_at
            ))

            row = c.fetchone()
            if row and row[0] is not None:
                prev_min = row[0]
                prev_avg = row[1]

                if hotel.price_total < prev_min:
                    drop_pct = ((prev_min - hotel.price_total) / prev_min) * 100
                    if drop_pct >= min_drop_percent:
                        alert = {
                            "type": "price_drop",
                            "category": "hotel",
                            "name": hotel.name,
                            "platform": hotel.platform,
                            "old_price": prev_min,
                            "new_price": hotel.price_total,
                            "avg_price": round(prev_avg, 2),
                            "drop_percent": round(drop_pct, 2),
                            "dates": f"{hotel.checkin} → {hotel.checkout}",
                            "url": hotel.url,
                        }
                        alerts.append(alert)

                        c.execute("""
                            INSERT INTO price_alerts
                            (alert_type, route, old_price, new_price, drop_percent,
                             platform, details, url)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            "hotel_drop",
                            hotel.destination,
                            prev_min, hotel.price_total, drop_pct,
                            hotel.platform,
                            json.dumps(alert),
                            hotel.url,
                        ))

        conn.commit()
        conn.close()
        return alerts

    def detect_price_errors(
        self,
        aggregator_results: List[FlightResult],
        direct_results: List[FlightResult],
        threshold_percent: float = 15.0,
    ) -> List[dict]:
        """
        Detecta posibles errores de precio comparando agregadores vs aerolíneas directas.

        Un "price error" es cuando la web directa de la aerolínea tiene un precio
        significativamente más bajo que los agregadores (o viceversa).
        Estos errores suelen corregirse en pocas horas.

        Args:
            aggregator_results: Precios de Google Flights/Skyscanner
            direct_results: Precios de webs directas de aerolíneas
            threshold_percent: Diferencia mínima para considerar error

        Returns:
            Lista de posibles errores de precio
        """
        errors = []

        for direct in direct_results:
            # Encontrar el precio más bajo del mismo vuelo en agregadores
            matching_agg = [
                a for a in aggregator_results
                if a.airline.lower() == direct.airline.lower()
                and a.origin == direct.origin
                and a.destination == direct.destination
            ]

            if not matching_agg:
                continue

            min_agg_price = min(a.price for a in matching_agg)

            if direct.price < min_agg_price:
                diff_pct = ((min_agg_price - direct.price) / min_agg_price) * 100
                if diff_pct >= threshold_percent:
                    error = {
                        "type": "price_error",
                        "category": "flight",
                        "airline": direct.airline,
                        "route": f"{direct.origin} → {direct.destination}",
                        "direct_price": direct.price,
                        "aggregator_price": min_agg_price,
                        "difference_percent": round(diff_pct, 2),
                        "savings": round(min_agg_price - direct.price, 2),
                        "direct_url": direct.url,
                        "urgency": "ALTA - Los errores de precio se corrigen rápido",
                    }
                    errors.append(error)

                    # Guardar en DB
                    conn = sqlite3.connect(self.db_path)
                    c = conn.cursor()
                    c.execute("""
                        INSERT INTO price_alerts
                        (alert_type, route, old_price, new_price, drop_percent,
                         platform, details, url)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        "price_error",
                        f"{direct.origin}-{direct.destination}",
                        min_agg_price, direct.price, diff_pct,
                        f"direct_{direct.airline}",
                        json.dumps(error),
                        direct.url,
                    ))
                    conn.commit()
                    conn.close()

            elif min_agg_price < direct.price:
                # Agregador más barato que directo (también interesante)
                diff_pct = ((direct.price - min_agg_price) / direct.price) * 100
                if diff_pct >= threshold_percent:
                    best_agg = min(matching_agg, key=lambda a: a.price)
                    error = {
                        "type": "aggregator_deal",
                        "category": "flight",
                        "airline": direct.airline,
                        "route": f"{direct.origin} → {direct.destination}",
                        "aggregator_price": min_agg_price,
                        "direct_price": direct.price,
                        "difference_percent": round(diff_pct, 2),
                        "savings": round(direct.price - min_agg_price, 2),
                        "aggregator_platform": best_agg.platform,
                        "aggregator_url": best_agg.url,
                    }
                    errors.append(error)

        return errors

    def get_pending_alerts(self) -> List[dict]:
        """Obtiene alertas no notificadas."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()

        c.execute("""
            SELECT * FROM price_alerts WHERE notified = 0
            ORDER BY created_at DESC
        """)

        alerts = [dict(row) for row in c.fetchall()]
        conn.close()
        return alerts

    def mark_alerts_notified(self, alert_ids: List[int]):
        """Marca alertas como notificadas."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        placeholders = ",".join("?" * len(alert_ids))
        c.execute(f"UPDATE price_alerts SET notified = 1 WHERE id IN ({placeholders})", alert_ids)
        conn.commit()
        conn.close()

    def get_best_prices_summary(self, origin: str, destination: str, date_depart: str) -> dict:
        """Resumen de mejores precios encontrados para una ruta."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()

        # Mejor precio de vuelo
        c.execute("""
            SELECT platform, airline, MIN(price) as best_price, scraped_at
            FROM flight_prices
            WHERE origin = ? AND destination = ? AND date_depart = ?
            GROUP BY platform
            ORDER BY best_price ASC
        """, (origin, destination, date_depart))

        flights = [{"platform": r[0], "airline": r[1], "price": r[2], "when": r[3]}
                   for r in c.fetchall()]

        # Estadísticas generales
        c.execute("""
            SELECT MIN(price), AVG(price), MAX(price), COUNT(*)
            FROM flight_prices
            WHERE origin = ? AND destination = ? AND date_depart = ?
        """, (origin, destination, date_depart))

        stats = c.fetchone()
        conn.close()

        return {
            "best_by_platform": flights,
            "overall_min": stats[0],
            "overall_avg": round(stats[1], 2) if stats[1] else None,
            "overall_max": stats[2],
            "total_records": stats[3],
        }

    # =========================================================================
    # MÉTODOS PARA DETECCIÓN DE ANOMALÍAS
    # =========================================================================

    def save_room_variants(self, scan_id: str, variants: List[dict]):
        """Guarda variantes de ocupación scrapeadas."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        for v in variants:
            c.execute("""
                INSERT INTO hotel_room_variants
                (scan_id, hotel_name, destination, occupancy_label, adults, rooms,
                 price_per_night, price_total, currency, rating, review_count,
                 stars, board_type, checkin, checkout, url, scraped_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                scan_id, v["hotel_name"], v["destination"], v["occupancy_label"],
                v["adults"], v["rooms"], v["price_per_night"], v["price_total"],
                v["currency"], v.get("rating", 0), v.get("review_count", 0),
                v.get("stars", 0), v.get("board_type", "solo_alojamiento"),
                v["checkin"], v["checkout"], v.get("url", ""), v["scraped_at"],
            ))
        conn.commit()
        conn.close()

    def get_room_variants_for_destination(
        self, destination: str, checkin: str
    ) -> List[dict]:
        """Obtiene todas las variantes de ocupación para un destino."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT * FROM hotel_room_variants
            WHERE destination = ? AND checkin = ?
            ORDER BY hotel_name, occupancy_label
        """, (destination, checkin))
        results = [dict(row) for row in c.fetchall()]
        conn.close()
        return results

    def get_hotels_for_zone_analysis(
        self, destination: str, checkin: str, checkout: str, min_stars: int = 3
    ) -> List[dict]:
        """Obtiene hoteles recientes para análisis de zona."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        # Combina datos de hotel_prices y hotel_room_variants
        c.execute("""
            SELECT name as hotel_name, price_per_night, price_total, rating,
                   review_count, stars, board_type, destination, checkin, checkout, url
            FROM hotel_prices
            WHERE destination = ? AND checkin = ? AND checkout = ? AND stars >= ?
            ORDER BY price_per_night ASC
        """, (destination, checkin, checkout, min_stars))
        results = [dict(row) for row in c.fetchall()]
        conn.close()
        return results

    def save_zone_profile(self, profile: dict):
        """Guarda o actualiza perfil de zona."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            INSERT INTO zone_profiles
            (destination, checkin, checkout, star_category,
             median_price, p10_price, p25_price, p75_price, p90_price,
             mean_price, std_dev, sample_count, data_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            profile["destination"], profile["checkin"], profile["checkout"],
            profile["star_category"], profile["median_price"],
            profile["p10_price"], profile["p25_price"],
            profile["p75_price"], profile["p90_price"],
            profile["mean_price"], profile["std_dev"],
            profile["sample_count"], profile["data_date"],
        ))
        conn.commit()
        conn.close()

    def get_zone_profile(self, destination: str, checkin: str, star_category: str = "all") -> Optional[dict]:
        """Obtiene el perfil de zona más reciente."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT * FROM zone_profiles
            WHERE destination = ? AND checkin = ? AND star_category = ?
            ORDER BY created_at DESC LIMIT 1
        """, (destination, checkin, star_category))
        row = c.fetchone()
        conn.close()
        return dict(row) if row else None

    def get_seasonal_baseline(self, destination: str, month: int) -> Optional[dict]:
        """Obtiene línea base estacional (media histórica para un mes)."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        # Busca precios históricos del mismo mes en cualquier año
        c.execute("""
            SELECT AVG(price_per_night) as avg_price,
                   MIN(price_per_night) as min_price,
                   MAX(price_per_night) as max_price,
                   COUNT(*) as sample_count
            FROM hotel_prices
            WHERE destination = ?
              AND CAST(strftime('%m', checkin) AS INTEGER) = ?
              AND stars >= 3
        """, (destination, month))
        row = c.fetchone()
        conn.close()
        if row and row[3] >= 5:  # Mínimo 5 registros
            return {
                "avg_price": row[0],
                "min_price": row[1],
                "max_price": row[2],
                "sample_count": row[3],
            }
        return None

    def save_anomaly(self, anomaly: dict):
        """Guarda una anomalía detectada."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            INSERT INTO hotel_anomalies
            (scan_id, hotel_name, destination, anomaly_type, severity_score,
             explanation, evidence_json, booking_url, checkin, checkout)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            anomaly["scan_id"], anomaly["hotel_name"], anomaly["destination"],
            anomaly["anomaly_type"], anomaly["severity_score"],
            anomaly["explanation"], json.dumps(anomaly.get("evidence", {})),
            anomaly.get("booking_url", ""), anomaly.get("checkin", ""),
            anomaly.get("checkout", ""),
        ))
        conn.commit()
        conn.close()

    def get_pending_anomalies(self) -> List[dict]:
        """Obtiene anomalías no notificadas."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("""
            SELECT * FROM hotel_anomalies
            WHERE notified = 0
            ORDER BY severity_score DESC
        """)
        results = [dict(row) for row in c.fetchall()]
        conn.close()
        return results

    def mark_anomalies_notified(self, anomaly_ids: List[int]):
        """Marca anomalías como notificadas."""
        if not anomaly_ids:
            return
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        placeholders = ",".join("?" * len(anomaly_ids))
        c.execute(f"UPDATE hotel_anomalies SET notified = 1 WHERE id IN ({placeholders})", anomaly_ids)
        conn.commit()
        conn.close()
