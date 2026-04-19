"""
Travel Hunter - Occupancy Variant Scraper
==========================================
Ejecuta múltiples búsquedas en Booking.com variando la ocupación
(1 adulto, 2 adultos, 3 adultos, etc.) para detectar anomalías
de precio entre tipos de habitación del mismo hotel.

Estrategia:
- No navega a páginas de detalle (alto riesgo de detección)
- Usa la página de resultados con diferentes configs de ocupación
- Cruza hoteles por nombre (fuzzy matching) entre queries
- Reutiliza la infraestructura stealth existente
"""

import asyncio
import random
import re
from datetime import datetime
from difflib import SequenceMatcher
from typing import Dict, List, Optional, Tuple

try:
    from playwright.async_api import async_playwright, Page
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Page = None

from url_generator import URLGenerator
from stealth_config import (
    get_random_fingerprint,
    get_stealth_script,
    random_delay,
    human_scroll,
    human_click,
)

try:
    from playwright_stealth import Stealth
    STEALTH_AVAILABLE = True
except ImportError:
    STEALTH_AVAILABLE = False


# =========================================================================
# CONFIGURACIONES DE OCUPACIÓN
# =========================================================================

DEFAULT_OCCUPANCY_CONFIGS = [
    {"adults": 1, "rooms": 1, "label": "1adult_1room"},
    {"adults": 2, "rooms": 1, "label": "2adult_1room"},
    {"adults": 3, "rooms": 1, "label": "3adult_1room"},
    {"adults": 2, "rooms": 2, "label": "2adult_2rooms"},
    {"adults": 4, "rooms": 2, "label": "4adult_2rooms"},
]


# =========================================================================
# FUZZY MATCHING DE NOMBRES DE HOTEL
# =========================================================================

def normalize_hotel_name(name: str) -> str:
    """Normaliza nombre de hotel para matching."""
    name = name.lower().strip()
    # Eliminar prefijos comunes
    for prefix in ["hotel ", "hostal ", "hostel ", "aparthotel ", "resort "]:
        if name.startswith(prefix):
            name = name[len(prefix):]
    # Eliminar caracteres especiales
    name = re.sub(r'[^\w\s]', '', name)
    # Normalizar espacios
    name = re.sub(r'\s+', ' ', name).strip()
    return name


def hotel_name_similarity(name1: str, name2: str) -> float:
    """Calcula similitud entre nombres de hotel (0.0 - 1.0)."""
    n1 = normalize_hotel_name(name1)
    n2 = normalize_hotel_name(name2)

    # Coincidencia exacta normalizada
    if n1 == n2:
        return 1.0

    # SequenceMatcher para fuzzy matching
    return SequenceMatcher(None, n1, n2).ratio()


def match_hotels_across_configs(
    results_by_config: Dict[str, List[dict]],
    threshold: float = 0.85,
) -> Dict[str, Dict[str, dict]]:
    """
    Agrupa hoteles por nombre a través de diferentes configuraciones de ocupación.

    Returns:
        Dict[hotel_name, Dict[config_label, hotel_data]]
    """
    matched = {}

    # Usar la primera config como referencia
    all_configs = list(results_by_config.keys())
    if not all_configs:
        return matched

    ref_config = all_configs[0]
    ref_hotels = results_by_config[ref_config]

    for ref_hotel in ref_hotels:
        ref_name = ref_hotel["name"]
        canonical_name = ref_name  # Usar nombre de referencia como canónico

        matched[canonical_name] = {ref_config: ref_hotel}

        # Buscar en el resto de configs
        for other_config in all_configs[1:]:
            best_match = None
            best_score = 0

            for other_hotel in results_by_config[other_config]:
                score = hotel_name_similarity(ref_name, other_hotel["name"])
                if score > best_score and score >= threshold:
                    best_score = score
                    best_match = other_hotel

            if best_match:
                matched[canonical_name][other_config] = best_match

    # También añadir hoteles que aparecen en otras configs pero no en la referencia
    for config in all_configs[1:]:
        for hotel in results_by_config[config]:
            already_matched = False
            for canonical, configs in matched.items():
                if config in configs:
                    if hotel_name_similarity(hotel["name"], configs[config]["name"]) >= threshold:
                        already_matched = True
                        break
            if not already_matched:
                # Verificar que no es un match parcial con algún canónico
                best_canonical = None
                best_score = 0
                for canonical in matched:
                    score = hotel_name_similarity(hotel["name"], canonical)
                    if score > best_score and score >= threshold:
                        best_score = score
                        best_canonical = canonical

                if best_canonical and config not in matched[best_canonical]:
                    matched[best_canonical][config] = hotel
                elif not best_canonical:
                    matched[hotel["name"]] = {config: hotel}

    return matched


# =========================================================================
# SCRAPER DE OCUPACIÓN
# =========================================================================

class OccupancyScraper:
    """
    Ejecuta búsquedas en Booking.com con diferentes configuraciones
    de ocupación para detectar anomalías de precio.
    """

    def __init__(
        self,
        headless: bool = True,
        slow_mo: int = 100,
        occupancy_configs: List[dict] = None,
        max_hotels_per_query: int = 30,
    ):
        self.headless = headless
        self.slow_mo = slow_mo
        self.occupancy_configs = occupancy_configs or DEFAULT_OCCUPANCY_CONFIGS
        self.max_hotels = max_hotels_per_query
        self.browser = None
        self.playwright = None

    async def _init_browser(self):
        """Inicializa browser con anti-detección."""
        if not PLAYWRIGHT_AVAILABLE:
            return None
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=self.headless,
            slow_mo=self.slow_mo,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox", "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas", "--disable-gpu",
                "--lang=es-ES,es",
                "--disable-extensions",
                "--disable-component-extensions-with-background-pages",
                "--no-first-run", "--no-default-browser-check",
            ],
        )
        return self.browser

    async def _new_stealth_page(self):
        """Crea página con fingerprint aleatorio + stealth."""
        if not self.browser:
            await self._init_browser()
        if not self.browser:
            return None

        fp = get_random_fingerprint()
        context = await self.browser.new_context(
            viewport=fp["viewport"],
            user_agent=fp["user_agent"],
            locale=fp["locale"],
            timezone_id=fp["timezone_id"],
            geolocation=fp["geolocation"],
            permissions=["geolocation"],
            device_scale_factor=fp["device_scale_factor"],
            has_touch=False, is_mobile=False,
            color_scheme=random.choice(["light", "dark", "no-preference"]),
            ignore_https_errors=True,
        )
        page = await context.new_page()

        if STEALTH_AVAILABLE:
            stealth = Stealth()
            await stealth.apply_stealth_async(page)

        await page.add_init_script(get_stealth_script(fp))
        return page

    async def _close(self):
        """Cierra browser."""
        if self.browser:
            try:
                await self.browser.close()
            except Exception:
                pass
        if self.playwright:
            try:
                await self.playwright.stop()
            except Exception:
                pass
        self.browser = None

    async def _accept_cookies(self, page):
        """Acepta cookies de Booking."""
        for sel in [
            'button:has-text("Aceptar todo")', 'button:has-text("Accept all")',
            'button:has-text("Alle akzeptieren")', 'button:has-text("Tout accepter")',
            '#onetrust-accept-btn-handler', '[data-testid="accept-cookies"]',
        ]:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=1500):
                    await human_click(page, btn)
                    await asyncio.sleep(random_delay(500, 1000))
                    return
            except Exception:
                continue

    async def _dismiss_popups(self, page):
        """Cierra popups molestos de Booking."""
        for sel in [
            '[aria-label="Cerrar"]', '[aria-label="Close"]',
            '[aria-label="Dismiss sign-in"]', '[data-testid="modal-close"]',
            'button:has-text("No, gracias")', 'button:has-text("No thanks")',
        ]:
            try:
                btn = page.locator(sel).first
                if await btn.is_visible(timeout=1000):
                    await human_click(page, btn)
                    await asyncio.sleep(random_delay(300, 600))
            except Exception:
                continue

    async def _scrape_booking_results(
        self, page, url: str, params: dict
    ) -> List[dict]:
        """Extrae hoteles de una página de resultados de Booking.com."""
        results = []
        try:
            await page.goto(url, wait_until="networkidle", timeout=40000)
            await self._accept_cookies(page)
            await self._dismiss_popups(page)

            # Comportamiento humano
            await asyncio.sleep(random_delay(1500, 4000))
            for _ in range(random.randint(2, 4)):
                await human_scroll(page, "down", random.randint(400, 700))
                await asyncio.sleep(random_delay(800, 2000))

            checkin_dt = datetime.strptime(params["checkin"], "%Y-%m-%d")
            checkout_dt = datetime.strptime(params["checkout"], "%Y-%m-%d")
            nights = max((checkout_dt - checkin_dt).days, 1)

            for sel in ['[data-testid="property-card"]', 'div[class*="sr_property_block"]',
                        'div[class*="PropertyCard"]']:
                try:
                    cards = page.locator(sel)
                    count = await cards.count()
                    if count > 0:
                        for i in range(min(count, self.max_hotels)):
                            try:
                                card = cards.nth(i)
                                text = await card.inner_text()

                                # Nombre
                                name = "Hotel Desconocido"
                                ne = card.locator('[data-testid="title"], h3, [class*="sr-hotel__name"]')
                                if await ne.count() > 0:
                                    name = (await ne.first.inner_text()).strip()

                                # Precio
                                pm = re.search(
                                    r'(\d{1,3}[.,]?\d{1,3})\s*€|€\s*(\d{1,3}[.,]?\d{1,3})',
                                    text
                                )
                                if not pm:
                                    continue
                                ps = pm.group(1) or pm.group(2)
                                pt = float(ps.replace(".", "").replace(",", "."))
                                if pt < 20:
                                    continue

                                # Rating
                                rating = 0.0
                                rm = re.search(
                                    r'(\d[.,]\d)\s*/?\s*(?:10)?|Puntuación[:\s]*(\d[.,]\d)',
                                    text
                                )
                                if rm:
                                    rating = float(
                                        (rm.group(1) or rm.group(2)).replace(",", ".")
                                    )

                                # Review count
                                review_count = 0
                                rvm = re.search(
                                    r'(\d[.,]?\d*)\s*(?:comentarios|reseñas|reviews)', text
                                )
                                if rvm:
                                    review_count = int(
                                        rvm.group(1).replace(".", "").replace(",", "")
                                    )

                                # Stars
                                stars = 0
                                sm = re.search(r'(\d)\s*(?:estrellas?|stars?)', text)
                                if sm:
                                    stars = int(sm.group(1))

                                # Board type
                                board = "solo_alojamiento"
                                tl = text.lower()
                                for kw, bt in [
                                    ("todo incluido", "all_inclusive"),
                                    ("all inclusive", "all_inclusive"),
                                    ("media pensión", "half_board"),
                                    ("half board", "half_board"),
                                    ("pensión completa", "full_board"),
                                    ("desayuno", "breakfast"),
                                    ("breakfast", "breakfast"),
                                ]:
                                    if kw in tl:
                                        board = bt
                                        break

                                results.append({
                                    "name": name,
                                    "price_per_night": round(pt / nights, 2),
                                    "price_total": pt,
                                    "rating": rating,
                                    "review_count": review_count,
                                    "stars": stars,
                                    "board_type": board,
                                    "url": url,
                                })
                            except Exception:
                                continue
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"⚠️  Error scraping Booking: {e}")

        return results

    async def scrape_destination_variants(
        self,
        destination: str,
        checkin: str,
        checkout: str,
        currency: str = "EUR",
        board_type: str = None,
        stars: List[int] = None,
        min_review_score: float = None,
    ) -> Dict[str, List[dict]]:
        """
        Ejecuta búsquedas para todas las configuraciones de ocupación
        de un destino. Retorna {config_label: [hotel_results]}.
        """
        results_by_config = {}

        if not PLAYWRIGHT_AVAILABLE:
            print("⚠️  Playwright no disponible")
            return results_by_config

        await self._init_browser()

        for i, config in enumerate(self.occupancy_configs):
            label = config["label"]
            adults = config["adults"]
            rooms = config["rooms"]

            print(f"   🔍 Booking [{label}] ({i + 1}/{len(self.occupancy_configs)})...")

            # Generar URL de Booking con esta config de ocupación
            url = URLGenerator.booking(
                destination=destination,
                checkin=checkin,
                checkout=checkout,
                adults=adults,
                children=0,
                rooms=rooms,
                currency=currency,
                board_type=board_type,
                stars=stars,
                min_review_score=min_review_score,
            )

            # Scrape con página stealth nueva
            page = await self._new_stealth_page()
            if not page:
                print(f"      ❌ No se pudo crear página")
                continue

            try:
                hotels = await self._scrape_booking_results(
                    page,
                    url,
                    {"checkin": checkin, "checkout": checkout},
                )
                await page.close()

                if hotels:
                    results_by_config[label] = hotels
                    print(f"      ✅ {len(hotels)} hoteles")
                else:
                    print(f"      ⚠️  Sin resultados")

            except Exception as e:
                print(f"      ❌ Error: {e}")
                try:
                    await page.close()
                except Exception:
                    pass

            # Delay anti-detección entre queries
            if i < len(self.occupancy_configs) - 1:
                delay = random_delay(45000, 90000)  # 45-90 segundos
                print(f"      ⏳ Esperando {delay:.0f}s...")
                await asyncio.sleep(delay)

        await self._close()
        return results_by_config

    def prepare_variants_for_storage(
        self,
        results_by_config: Dict[str, List[dict]],
        destination: str,
        checkin: str,
        checkout: str,
        currency: str = "EUR",
    ) -> List[dict]:
        """
        Prepara las variantes para guardar en la base de datos.
        Añade metadatos de destino y ocupación.
        """
        variants = []
        now = datetime.now().isoformat()

        for config_label, hotels in results_by_config.items():
            # Extraer adults y rooms del label
            parts = config_label.split("_")
            adults = int(parts[0].replace("adult", ""))
            rooms = int(parts[1].replace("room", "").replace("s", ""))

            for hotel in hotels:
                variants.append({
                    "hotel_name": hotel["name"],
                    "destination": destination,
                    "occupancy_label": config_label,
                    "adults": adults,
                    "rooms": rooms,
                    "price_per_night": hotel["price_per_night"],
                    "price_total": hotel["price_total"],
                    "currency": currency,
                    "rating": hotel.get("rating", 0),
                    "review_count": hotel.get("review_count", 0),
                    "stars": hotel.get("stars", 0),
                    "board_type": hotel.get("board_type", "solo_alojamiento"),
                    "checkin": checkin,
                    "checkout": checkout,
                    "url": hotel.get("url", ""),
                    "scraped_at": now,
                })

        return variants
