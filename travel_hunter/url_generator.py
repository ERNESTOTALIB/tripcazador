"""
Travel Hunter - URL Generator
Genera URLs de búsqueda optimizadas para cada plataforma.
Estas URLs siempre funcionan como fallback cuando el scraping falla.
"""

from datetime import datetime, timedelta
from urllib.parse import urlencode, quote
from typing import List, Optional
import json


class URLGenerator:
    """Genera URLs de búsqueda para todas las plataformas de viajes."""

    # Mapeo de códigos IATA a códigos de ciudad de Skyscanner
    SKYSCANNER_CITY_MAP = {
        "CDG": "PARI",
        "ORY": "PARI",
        "SXB": "SXB",
        "BSL": "BSL",
        "FRA": "FRA",
        "STR": "STR",
        "BER": "BERL",
        "BCN": "BCN",
        "MAD": "MAD",
        "FCO": "ROME",
        "ATH": "ATH",
        "SPU": "SPU",
        "DBV": "DBV",
        "HER": "HER",
        "PMI": "PMI",
        "CUN": "CUN",
        "PUJ": "PUJ",
        "BKK": "BKK",
        "HKT": "HKT",
    }

    @staticmethod
    def google_flights(
        origin: str,
        destination: str,
        date_depart: str,
        date_return: str,
        adults: int = 1,
        children: int = 0,
        infants_lap: int = 0,
        cabin_class: str = "economy",
        currency: str = "EUR",
    ) -> str:
        """
        Genera URL de Google Flights.

        Args:
            origin: Código IATA del aeropuerto de origen (ej: "SXB")
            destination: Código IATA del destino (ej: "ATH")
            date_depart: Fecha ida "YYYY-MM-DD"
            date_return: Fecha vuelta "YYYY-MM-DD"
            adults: Número de adultos
            children: Número de niños (2-11 años)
            infants_lap: Número de bebés en regazo (<2 años)
            cabin_class: economy, premium_economy, business, first
            currency: Moneda (EUR, USD, etc.)
        """
        # Google Flights usa un formato de URL específico
        # El formato más fiable es el de búsqueda directa
        cabin_map = {
            "economy": "1",
            "premium_economy": "2",
            "business": "3",
            "first": "4",
        }
        cabin = cabin_map.get(cabin_class, "1")

        # Formato: /travel/flights/origin-destination/date_depart/date_return
        dep = date_depart.replace("-", "")  # 20260801
        ret = date_return.replace("-", "")

        # Construir URL con parámetros
        base = "https://www.google.com/travel/flights"
        params = {
            "q": f"Flights from {origin} to {destination}",
            "curr": currency,
            "hl": "en",
        }

        # Google Flights URL directa con ruta
        # Formato: /travel/flights/SXB/ATH/2026-08-01/2026-08-11
        direct_url = (
            f"https://www.google.com/travel/flights/search"
            f"?sxsrf=placeholder"
            f"&hl=en"
            f"&curr={currency}"
        )

        # Alternativa más simple y fiable
        search_url = (
            f"https://www.google.com/travel/flights?"
            f"q=Vuelos+de+{origin}+a+{destination}"
            f"+el+{date_depart}+regreso+{date_return}"
            f"&curr={currency}&hl=es"
        )

        return search_url

    @staticmethod
    def skyscanner(
        origin: str,
        destination: str,
        date_depart: str,
        date_return: str,
        adults: int = 1,
        children: int = 0,
        infants_lap: int = 0,
        cabin_class: str = "economy",
        currency: str = "EUR",
        market: str = "ES",
    ) -> str:
        """
        Genera URL de Skyscanner.
        Formato: /transport/flights/ORIG/DEST/YYMMDD/YYMMDD/
        """
        cabin_map = {
            "economy": "economy",
            "premium_economy": "premiumeconomy",
            "business": "business",
            "first": "first",
        }
        cabin = cabin_map.get(cabin_class, "economy")

        # Formato de fecha: YYMMDD
        dep_dt = datetime.strptime(date_depart, "%Y-%m-%d")
        ret_dt = datetime.strptime(date_return, "%Y-%m-%d")
        dep = dep_dt.strftime("%y%m%d")
        ret = ret_dt.strftime("%y%m%d")

        # Usar mapeo de ciudad si existe
        orig_code = URLGenerator.SKYSCANNER_CITY_MAP.get(origin, origin)
        dest_code = URLGenerator.SKYSCANNER_CITY_MAP.get(destination, destination)

        url = (
            f"https://www.skyscanner.net/transport/flights"
            f"/{orig_code}/{dest_code}/{dep}/{ret}/"
            f"?adultsv2={adults}"
            f"&childrenv2={'|'.join(['8'] * children)}"  # edad estimada 8
            f"&infants={infants_lap}"
            f"&cabinclass={cabin}"
            f"&currency={currency}"
            f"&market={market}"
            f"&locale=es-ES"
        )

        return url

    @staticmethod
    def booking(
        destination: str,
        checkin: str,
        checkout: str,
        adults: int = 1,
        children: int = 0,
        children_ages: List[int] = None,
        rooms: int = 1,
        currency: str = "EUR",
        board_type: str = None,
        stars: List[int] = None,
        min_review_score: float = None,
    ) -> str:
        """
        Genera URL de Booking.com.

        Args:
            destination: Nombre del destino (ej: "Cancún, México")
            checkin: "YYYY-MM-DD"
            checkout: "YYYY-MM-DD"
            board_type: None, "all_inclusive", "half_board", "breakfast"
            stars: Lista de estrellas a filtrar [4, 5]
            min_review_score: Puntuación mínima (ej: 8.0)
        """
        params = {
            "ss": destination,
            "checkin": checkin,
            "checkout": checkout,
            "group_adults": adults,
            "group_children": children,
            "no_rooms": rooms,
            "selected_currency": currency,
            "lang": "es",
        }

        # Añadir edades de niños
        if children_ages:
            for i, age in enumerate(children_ages):
                params[f"age"] = age

        # Filtros de tipo de pensión
        # Booking usa nflt para filtros
        filters = []
        if board_type:
            board_map = {
                "all_inclusive": "mealplan=4",
                "half_board": "mealplan=3",
                "breakfast": "mealplan=1",
                "full_board": "mealplan=5",
            }
            if board_type in board_map:
                filters.append(board_map[board_type])

        if stars:
            for s in stars:
                filters.append(f"class={s}")

        if min_review_score:
            # Booking usa: 60=Agradable, 70=Bien, 80=Muy bien, 90=Fantástico
            score_map = {7.0: 70, 8.0: 80, 9.0: 90}
            closest = min(score_map.keys(), key=lambda x: abs(x - min_review_score))
            filters.append(f"review_score={score_map[closest]}")

        if filters:
            params["nflt"] = ";".join(filters)

        # Ordenar por precio
        params["order"] = "price"

        base = "https://www.booking.com/searchresults.es.html"
        return f"{base}?{urlencode(params)}"

    @staticmethod
    def airbnb(
        destination: str,
        checkin: str,
        checkout: str,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
        currency: str = "EUR",
        price_max: int = None,
        min_bedrooms: int = None,
    ) -> str:
        """
        Genera URL de Airbnb.
        """
        params = {
            "query": destination,
            "checkin": checkin,
            "checkout": checkout,
            "adults": adults,
            "children": children,
            "infants": infants,
            "currency": currency,
            "source": "structured_search_input_header",
            "search_type": "filter_change",
        }

        if price_max:
            params["price_max"] = price_max
        if min_bedrooms:
            params["min_bedrooms"] = min_bedrooms

        base = "https://www.airbnb.com/s/" + quote(destination) + "/homes"
        # Remover query del params ya que va en la URL
        del params["query"]
        return f"{base}?{urlencode(params)}"

    @staticmethod
    def airline_direct(
        airline: str,
        origin: str,
        destination: str,
        date_depart: str,
        date_return: str,
        adults: int = 1,
        children: int = 0,
        infants: int = 0,
    ) -> Optional[str]:
        """
        Genera URL directa de la aerolínea para comparar precios.
        Devuelve None si la aerolínea no está soportada.
        """
        dep = date_depart.replace("-", "")
        ret = date_return.replace("-", "")

        airlines = {
            "ryanair": (
                f"https://www.ryanair.com/es/es/trip/flights/select"
                f"?adults={adults}&teens=0&children={children}&infants={infants}"
                f"&dateOut={date_depart}&dateIn={date_return}"
                f"&originIata={origin}&destinationIata={destination}"
                f"&isReturn=true&discount=0&isConnectedFlight=false"
            ),
            "easyjet": (
                f"https://www.easyjet.com/es/booking/select-flight"
                f"?origin={origin}&destination={destination}"
                f"&outboundDate={date_depart}&inboundDate={date_return}"
                f"&adults={adults}&children={children}&infants={infants}"
            ),
            "vueling": (
                f"https://tickets.vueling.com/ScheduleSelect.aspx"
                f"?culture=es-ES&Origin={origin}&Destination={destination}"
                f"&OutboundDate={dep}&InboundDate={ret}"
                f"&ADT={adults}&CHD={children}&INF={infants}"
            ),
            "transavia": (
                f"https://www.transavia.com/es-ES/reservar-un-vuelo/vuelos/buscar/"
                f"?routeSelection=Trip&flyingFrom[]={origin}&flyingTo[]={destination}"
                f"&outboundDate={date_depart}&inboundDate={date_return}"
                f"&adultCount={adults}&childCount={children}&infantCount={infants}"
            ),
            "wizzair": (
                f"https://wizzair.com/es-es#/booking/select-flight"
                f"/{origin}/{destination}/{date_depart}/{date_return}"
                f"/{adults}/{children}/{infants}"
            ),
            "lufthansa": (
                f"https://www.lufthansa.com/es/es/flight-search"
                f"?fareCategory=ECONOMY&origins={origin}&destinations={destination}"
                f"&outDate={date_depart}&retDate={date_return}"
                f"&pax={adults},{children},{infants},0"
            ),
            "iberia": (
                f"https://www.iberia.com/es/?market=ES&language=es"
                f"&appliesOMB=false&TRIP_TYPE=2"
                f"&BEGIN_CITY_01={origin}&END_CITY_01={destination}"
                f"&BEGIN_DAY_01={dep[6:]}&BEGIN_MONTH_01={dep[:6]}"
                f"&BEGIN_DAY_02={ret[6:]}&BEGIN_MONTH_02={ret[:6]}"
                f"&ADULT={adults}&CHILD={children}&INFANT={infants}"
            ),
            "aegean": (
                f"https://en.aegeanair.com/flight/search"
                f"?departureAirport={origin}&arrivalAirport={destination}"
                f"&departureDate={date_depart}&returnDate={date_return}"
                f"&adults={adults}&children={children}&infants={infants}"
            ),
            "turkish": (
                f"https://www.turkishairlines.com/en-int/flights/"
                f"?origin={origin}&destination={destination}"
                f"&departureDateTimeOutbound={date_depart}"
                f"&departureDateTimeInbound={date_return}"
                f"&adultPassengerCount={adults}&childPassengerCount={children}"
                f"&infantPassengerCount={infants}"
            ),
            "airfrance": (
                f"https://wwws.airfrance.fr/search/offers"
                f"?pax={adults}ADT,{children}CNN,{infants}INF"
                f"&cabinClass=ECONOMY&activeConnection=0"
                f"&connections={origin}-A>{destination}-A|{date_depart}"
                f"_{destination}-A>{origin}-A|{date_return}"
            ),
        }

        key = airline.lower().replace(" ", "").replace("-", "")
        return airlines.get(key)

    @staticmethod
    def generate_all_flight_urls(params: dict) -> dict:
        """
        Genera todas las URLs de vuelos para una búsqueda.

        Args:
            params: dict con origin, destination, date_depart, date_return,
                   adults, children, infants_lap, cabin_class, currency
        Returns:
            dict con {plataforma: url}
        """
        urls = {}

        urls["google_flights"] = URLGenerator.google_flights(**{
            k: v for k, v in params.items()
            if k in ["origin", "destination", "date_depart", "date_return",
                     "adults", "children", "infants_lap", "cabin_class", "currency"]
        })

        urls["skyscanner"] = URLGenerator.skyscanner(**{
            k: v for k, v in params.items()
            if k in ["origin", "destination", "date_depart", "date_return",
                     "adults", "children", "infants_lap", "cabin_class", "currency"]
        })

        return urls

    @staticmethod
    def generate_all_hotel_urls(params: dict) -> dict:
        """
        Genera todas las URLs de hoteles para una búsqueda.

        Args:
            params: dict con destination, checkin, checkout, adults, children,
                   children_ages, rooms, currency, board_type, stars, min_review_score
        Returns:
            dict con {plataforma: url}
        """
        urls = {}

        booking_params = {
            k: v for k, v in params.items()
            if k in ["destination", "checkin", "checkout", "adults", "children",
                     "children_ages", "rooms", "currency", "board_type", "stars",
                     "min_review_score"]
        }
        urls["booking"] = URLGenerator.booking(**booking_params)

        airbnb_params = {
            k: v for k, v in params.items()
            if k in ["destination", "checkin", "checkout", "adults", "children",
                     "infants", "currency", "price_max", "min_bedrooms"]
        }
        if "infants" not in airbnb_params:
            airbnb_params["infants"] = 0
        urls["airbnb"] = URLGenerator.airbnb(**airbnb_params)

        return urls


def demo():
    """Demo de generación de URLs."""
    print("=" * 70)
    print("TRAVEL HUNTER - Generador de URLs")
    print("=" * 70)

    # Ejemplo: viaje de Estrasburgo a Grecia, agosto 2026
    flight_params = {
        "origin": "SXB",
        "destination": "ATH",
        "date_depart": "2026-08-01",
        "date_return": "2026-08-15",
        "adults": 4,
        "children": 0,
        "infants_lap": 1,
        "cabin_class": "economy",
        "currency": "EUR",
    }

    hotel_params = {
        "destination": "Atenas, Grecia",
        "checkin": "2026-08-01",
        "checkout": "2026-08-11",
        "adults": 4,
        "children": 1,
        "children_ages": [1],
        "rooms": 2,
        "currency": "EUR",
        "board_type": "all_inclusive",
        "stars": [4, 5],
        "min_review_score": 8.0,
    }

    print("\n✈️  URLs DE VUELOS:")
    print("-" * 50)
    flight_urls = URLGenerator.generate_all_flight_urls(flight_params)
    for platform, url in flight_urls.items():
        print(f"\n{platform}:")
        print(f"  {url}")

    print("\n\n🏨 URLs DE HOTELES:")
    print("-" * 50)
    hotel_urls = URLGenerator.generate_all_hotel_urls(hotel_params)
    for platform, url in hotel_urls.items():
        print(f"\n{platform}:")
        print(f"  {url}")

    print("\n\n🔍 URLs DIRECTAS DE AEROLÍNEAS:")
    print("-" * 50)
    airlines = ["ryanair", "easyjet", "vueling", "transavia",
                "lufthansa", "airfrance", "aegean", "turkish"]
    for airline in airlines:
        url = URLGenerator.airline_direct(
            airline, "SXB", "ATH", "2026-08-01", "2026-08-15", 4, 0, 1
        )
        if url:
            print(f"\n{airline}:")
            print(f"  {url}")


if __name__ == "__main__":
    demo()
