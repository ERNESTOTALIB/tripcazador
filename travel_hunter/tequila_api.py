"""
Travel Hunter - Tequila (Kiwi.com) API Module
===============================================
Fuente PRINCIPAL y más fiable de precios de vuelos.
API gratuita: 3000 búsquedas/mes.

Registro: https://tequila.kiwi.com/portal/login
Después de registrarte, crea una "Solution" y copia el API key.

Este módulo es la fuente de verdad para vuelos.
Playwright/scraping se usa como SECUNDARIO y para verificar precios.
"""

import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import asdict

try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

from scraper import FlightResult


class TequilaAPI:
    """
    Cliente para Tequila API (Kiwi.com).

    Free tier: 3000 búsquedas/mes
    Datos: precios reales con links de reserva directos
    Cobertura: prácticamente todas las aerolíneas del mundo
    """

    BASE_URL = "https://api.tequila.kiwi.com/v2"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "apikey": api_key,
            "Content-Type": "application/json",
        }
        # Rate limiting básico
        self._last_request_time = 0
        self._min_interval = 1.0  # 1 segundo entre requests

    def _rate_limit(self):
        """Espera si es necesario para respetar rate limits."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self._min_interval:
            time.sleep(self._min_interval - elapsed)
        self._last_request_time = time.time()

    def search_flights(
        self,
        origin: str,
        destination: str,
        date_depart: str,
        date_return: str,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        cabin_class: str = "M",
        currency: str = "EUR",
        max_stopovers: int = 2,
        limit: int = 20,
        sort: str = "price",
        date_from_flex: int = 0,
        date_to_flex: int = 0,
    ) -> Tuple[List[FlightResult], dict]:
        """
        Busca vuelos con la API de Tequila.

        Args:
            origin: Código IATA (ej: "SXB") o ciudad (ej: "strasbourg_fr")
            destination: Código IATA o ciudad
            date_depart: "YYYY-MM-DD"
            date_return: "YYYY-MM-DD"
            adults, children, infants: Pasajeros
            cabin_class: "M" (economy), "W" (premium), "C" (business), "F" (first)
            currency: "EUR", "USD", etc.
            max_stopovers: Máximo de escalas (0=directo, 1, 2)
            limit: Máximo de resultados
            sort: "price", "duration", "quality"
            date_from_flex: Días de flexibilidad en fecha ida (0-3)
            date_to_flex: Días de flexibilidad en fecha vuelta (0-3)

        Returns:
            Tuple de (lista de FlightResult, datos raw de la API)
        """
        if not REQUESTS_AVAILABLE:
            print("❌ requests no instalado. pip install requests")
            return [], {}

        if not self.api_key:
            print("❌ API key de Tequila no configurada")
            return [], {}

        # Convertir formato de fecha para Tequila (DD/MM/YYYY)
        dep_dt = datetime.strptime(date_depart, "%Y-%m-%d")
        ret_dt = datetime.strptime(date_return, "%Y-%m-%d")

        # Si hay flexibilidad, calcular rango
        dep_from = (dep_dt - timedelta(days=date_from_flex)).strftime("%d/%m/%Y")
        dep_to = (dep_dt + timedelta(days=date_from_flex)).strftime("%d/%m/%Y")
        ret_from = (ret_dt - timedelta(days=date_to_flex)).strftime("%d/%m/%Y")
        ret_to = (ret_dt + timedelta(days=date_to_flex)).strftime("%d/%m/%Y")

        # Mapeo de cabin class
        cabin_map = {
            "economy": "M", "premium_economy": "W",
            "business": "C", "first": "F",
            "M": "M", "W": "W", "C": "C", "F": "F",
        }
        cabin = cabin_map.get(cabin_class, "M")

        params = {
            "fly_from": origin,
            "fly_to": destination,
            "date_from": dep_from,
            "date_to": dep_to,
            "return_from": ret_from,
            "return_to": ret_to,
            "adults": adults,
            "children": children,
            "infants": infants,
            "selected_cabins": cabin,
            "curr": currency,
            "max_stopovers": max_stopovers,
            "limit": limit,
            "sort": sort,
            "flight_type": "round",
            "one_for_city": 0,
            "ret_from_diff_city": "false",
            "ret_to_diff_city": "false",
        }

        self._rate_limit()

        try:
            print(f"🌐 Tequila API: {origin} → {destination} ({date_depart} - {date_return})")
            resp = requests.get(
                f"{self.BASE_URL}/search",
                headers=self.headers,
                params=params,
                timeout=30,
            )

            if resp.status_code == 200:
                data = resp.json()
                results = self._parse_results(data, currency, origin, destination,
                                              date_depart, date_return)
                print(f"   ✅ {len(results)} vuelos encontrados via Tequila API")
                return results, data

            elif resp.status_code == 429:
                print("   ⚠️  Rate limit alcanzado. Esperando...")
                time.sleep(5)
                return [], {"error": "rate_limited"}

            elif resp.status_code == 401:
                print("   ❌ API key inválida. Revisa tu TEQUILA_API_KEY")
                return [], {"error": "unauthorized"}

            else:
                print(f"   ❌ Error API: {resp.status_code} - {resp.text[:200]}")
                return [], {"error": f"http_{resp.status_code}"}

        except requests.exceptions.Timeout:
            print("   ⚠️  Timeout en API de Tequila")
            return [], {"error": "timeout"}
        except Exception as e:
            print(f"   ❌ Error Tequila API: {e}")
            return [], {"error": str(e)}

    def _parse_results(
        self, data: dict, currency: str, origin: str, destination: str,
        date_depart: str, date_return: str
    ) -> List[FlightResult]:
        """Parsea resultados de Tequila API a FlightResult."""
        results = []

        for item in data.get("data", []):
            try:
                # Precio total (ya incluye todos los pasajeros)
                price = item.get("price", 0)
                if price <= 0:
                    continue

                # Aerolíneas (puede haber varias en vuelo con conexión)
                airlines = item.get("airlines", [])
                airline = ", ".join(airlines) if airlines else "Desconocida"
                # Si hay una aerolínea principal (primera)
                if airlines:
                    airline = airlines[0]

                # Escalas: contar segmentos de la ruta de ida
                route = item.get("route", [])
                # Separar ida de vuelta
                outbound_segments = [r for r in route if r.get("return") == 0]
                stops = max(0, len(outbound_segments) - 1)

                # Duración total (ida)
                duration_seconds = item.get("duration", {}).get("departure", 0)
                hours = duration_seconds // 3600
                minutes = (duration_seconds % 3600) // 60
                duration = f"{hours}h {minutes}m"

                # Link de reserva directo de Kiwi
                booking_link = item.get("deep_link", "")

                # Aeropuertos reales (por si el origen es una ciudad con varios)
                real_origin = item.get("flyFrom", origin)
                real_dest = item.get("flyTo", destination)

                # Fechas reales
                dep_local = item.get("local_departure", date_depart)
                if "T" in dep_local:
                    dep_local = dep_local.split("T")[0]

                # Calidad del vuelo (score de Kiwi, 0-10)
                quality = item.get("quality", 0)

                results.append(FlightResult(
                    platform="tequila_api",
                    airline=airline,
                    price=price,
                    currency=currency,
                    origin=real_origin,
                    destination=real_dest,
                    date_depart=dep_local,
                    date_return=date_return,
                    stops=stops,
                    duration=duration,
                    url=booking_link,
                ))

            except Exception as e:
                continue

        # Ordenar por precio
        results.sort(key=lambda x: x.price)
        return results

    def search_multi_origin(
        self,
        origins: List[str],
        destination: str,
        date_depart: str,
        date_return: str,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        currency: str = "EUR",
        **kwargs,
    ) -> Dict[str, List[FlightResult]]:
        """
        Busca desde múltiples aeropuertos de origen.
        Útil para encontrar el aeropuerto más barato cerca de Estrasburgo.

        Returns:
            Dict con {aeropuerto_origen: [resultados]}
        """
        all_results = {}

        for origin in origins:
            results, _ = self.search_flights(
                origin=origin,
                destination=destination,
                date_depart=date_depart,
                date_return=date_return,
                adults=adults,
                children=children,
                infants=infants,
                currency=currency,
                **kwargs,
            )
            all_results[origin] = results

            # Pausa entre búsquedas
            time.sleep(1.5)

        return all_results

    def search_flexible_dates(
        self,
        origin: str,
        destination: str,
        date_depart: str,
        date_return: str,
        flex_days: int = 3,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        currency: str = "EUR",
        **kwargs,
    ) -> List[FlightResult]:
        """
        Busca con fechas flexibles (+/- flex_days).
        La API de Tequila soporta esto nativamente.
        """
        results, _ = self.search_flights(
            origin=origin,
            destination=destination,
            date_depart=date_depart,
            date_return=date_return,
            adults=adults,
            children=children,
            infants=infants,
            currency=currency,
            date_from_flex=flex_days,
            date_to_flex=flex_days,
            limit=30,
            **kwargs,
        )
        return results

    def find_cheapest_airport(
        self,
        origins: List[str],
        destination: str,
        date_depart: str,
        date_return: str,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        currency: str = "EUR",
    ) -> Optional[dict]:
        """
        Encuentra el aeropuerto de salida más barato.

        Returns:
            Dict con {airport, price, airline, flight} o None
        """
        best = None

        results_by_origin = self.search_multi_origin(
            origins, destination, date_depart, date_return,
            adults, children, infants, currency,
        )

        for origin, flights in results_by_origin.items():
            if flights:
                cheapest = flights[0]  # Ya ordenados por precio
                if best is None or cheapest.price < best["price"]:
                    best = {
                        "airport": origin,
                        "price": cheapest.price,
                        "airline": cheapest.airline,
                        "flight": cheapest,
                        "all_results": flights[:5],
                    }

        if best:
            print(f"\n🏆 Aeropuerto más barato: {best['airport']} - "
                  f"{best['price']}€ ({best['airline']})")

        return best

    def get_api_usage(self) -> Optional[dict]:
        """Consulta el uso actual de la API (llamadas restantes)."""
        if not REQUESTS_AVAILABLE:
            return None

        try:
            # Tequila no tiene un endpoint dedicado de usage,
            # pero los headers de respuesta incluyen rate limit info
            resp = requests.get(
                f"{self.BASE_URL}/search",
                headers=self.headers,
                params={
                    "fly_from": "SXB", "fly_to": "ATH",
                    "date_from": "01/12/2026", "date_to": "01/12/2026",
                    "limit": 1,
                },
                timeout=10,
            )
            return {
                "status": resp.status_code,
                "rate_limit": resp.headers.get("X-RateLimit-Limit"),
                "rate_remaining": resp.headers.get("X-RateLimit-Remaining"),
                "rate_reset": resp.headers.get("X-RateLimit-Reset"),
            }
        except Exception:
            return None


def demo():
    """Demo de uso de Tequila API."""
    import os
    api_key = os.environ.get("TEQUILA_API_KEY", "")

    if not api_key:
        print("⚠️  Para usar Tequila API:")
        print("   1. Regístrate en https://tequila.kiwi.com/portal/login")
        print("   2. Crea una 'Solution'")
        print("   3. Copia el API key")
        print("   4. export TEQUILA_API_KEY=tu_api_key")
        print("   5. Ejecuta este script de nuevo")
        return

    api = TequilaAPI(api_key)

    # Buscar vuelos
    print("\n" + "=" * 60)
    print("Buscando vuelos SXB → ATH, agosto 2026")
    results, raw = api.search_flights(
        origin="SXB", destination="ATH",
        date_depart="2026-08-01", date_return="2026-08-15",
        adults=4, infants=1, currency="EUR",
    )

    for i, f in enumerate(results[:5], 1):
        print(f"  {i}. {f.airline:<15} {f.price:>8.2f}€  {f.stops} escalas  {f.duration}")
        print(f"     {f.url[:80]}...")

    # Encontrar aeropuerto más barato
    print("\n" + "=" * 60)
    print("Buscando aeropuerto más barato cerca de Estrasburgo")
    best = api.find_cheapest_airport(
        origins=["SXB", "BSL", "FRA", "CDG", "STR"],
        destination="ATH",
        date_depart="2026-08-01", date_return="2026-08-15",
        adults=4, infants=1,
    )


if __name__ == "__main__":
    demo()
