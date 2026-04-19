"""
Travel Hunter - Scraper Module v2
==================================
Extrae precios reales de Google Flights, Skyscanner, Booking y Airbnb.

Mejoras v2:
- playwright-stealth plugin integrado
- Rotación de fingerprints (UA, viewport, timezone, geolocation)
- Comportamiento humano (delays, scroll, mouse movement)
- Estrategia de scraping selectivo (rotación entre sitios)
- Reintentos con backoff exponencial
"""

import asyncio
import json
import random
import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict

try:
    from playwright.async_api import async_playwright, Page, Browser
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    Page = None
    Browser = None

try:
    from playwright_stealth import Stealth
    STEALTH_AVAILABLE = True
except ImportError:
    STEALTH_AVAILABLE = False

from url_generator import URLGenerator
from stealth_config import (
    get_random_fingerprint,
    get_stealth_script,
    random_delay,
    human_scroll,
    human_click,
)


# =========================================================================
# DATACLASSES
# =========================================================================

@dataclass
class FlightResult:
    """Resultado de búsqueda de vuelo."""
    platform: str
    airline: str
    price: float
    currency: str
    origin: str
    destination: str
    date_depart: str
    date_return: str
    stops: int
    duration: str
    url: str
    scraped_at: str = ""
    is_direct_airline: bool = False

    def __post_init__(self):
        if not self.scraped_at:
            self.scraped_at = datetime.now().isoformat()


@dataclass
class HotelResult:
    """Resultado de búsqueda de hotel."""
    platform: str
    name: str
    price_per_night: float
    price_total: float
    currency: str
    destination: str
    checkin: str
    checkout: str
    rating: float
    review_count: int
    board_type: str
    stars: int
    url: str
    scraped_at: str = ""
    is_direct_hotel: bool = False

    def __post_init__(self):
        if not self.scraped_at:
            self.scraped_at = datetime.now().isoformat()


@dataclass
class SearchResult:
    """Resultado completo de una búsqueda."""
    search_id: str
    search_params: dict
    flights: List[FlightResult] = field(default_factory=list)
    hotels: List[HotelResult] = field(default_factory=list)
    urls_fallback: Dict[str, str] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    timestamp: str = ""

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()


# =========================================================================
# SCRAPING STRATEGY (punto 4 - scraping selectivo inteligente)
# =========================================================================

class ScrapingStrategy:
    """
    Estrategia inteligente de scraping.

    En lugar de bombardear todos los sitios en cada ciclo:
    - Rota entre sitios (un ciclo Google Flights, otro Skyscanner)
    - Si un sitio bloquea, lo pone en cooldown exponencial
    - Rota las aerolíneas directas (3 por ciclo en vez de 8)
    - Persiste estado entre ejecuciones para recordar qué funciona
    """

    def __init__(self, state_file: str = "scraping_state.json"):
        self._state_file = state_file
        self._state = self._load_state()

    def _load_state(self) -> dict:
        import os
        if os.path.exists(self._state_file):
            try:
                with open(self._state_file) as f:
                    return json.load(f)
            except Exception:
                pass
        return {"site_stats": {}, "cycle_count": 0}

    def _save_state(self):
        with open(self._state_file, "w") as f:
            json.dump(self._state, f, indent=2)

    def record_result(self, site: str, success: bool, results_count: int = 0):
        """Registra resultado de scraping. Aplica cooldown exponencial si falla."""
        stats = self._state.setdefault("site_stats", {})
        site_data = stats.setdefault(site, {
            "successes": 0, "failures": 0, "last_success": None,
            "last_failure": None, "cooldown_until": None,
            "consecutive_failures": 0,
        })

        now = datetime.now().isoformat()
        if success:
            site_data["successes"] += 1
            site_data["last_success"] = now
            site_data["consecutive_failures"] = 0
            site_data["cooldown_until"] = None
        else:
            site_data["failures"] += 1
            site_data["last_failure"] = now
            site_data["consecutive_failures"] += 1
            # Cooldown exponencial: 1h, 4h, 12h, 24h max
            failures = site_data["consecutive_failures"]
            cooldown_hours = min(24, 1 * (2 ** (failures - 1)))
            from datetime import timedelta
            cooldown_end = datetime.now() + timedelta(hours=cooldown_hours)
            site_data["cooldown_until"] = cooldown_end.isoformat()

        self._save_state()

    def should_scrape(self, site: str) -> bool:
        """¿Debemos intentar este sitio o está en cooldown?"""
        site_data = self._state.get("site_stats", {}).get(site, {})
        if not site_data:
            return True
        cooldown = site_data.get("cooldown_until")
        if cooldown:
            try:
                if datetime.now() < datetime.fromisoformat(cooldown):
                    return False
            except Exception:
                pass
        return True

    def get_flight_sites_for_cycle(self) -> List[str]:
        """Rota sitios de vuelos: pares Google, impares Skyscanner, cada 5 ambos."""
        self._state["cycle_count"] = self._state.get("cycle_count", 0) + 1
        cycle = self._state["cycle_count"]

        if cycle % 5 == 0:
            sites = ["google_flights", "skyscanner"]
        elif cycle % 2 == 0:
            sites = ["google_flights"]
        else:
            sites = ["skyscanner"]

        sites = [s for s in sites if self.should_scrape(s)]
        self._save_state()
        return sites

    def get_hotel_sites_for_cycle(self) -> List[str]:
        """Rota sitios de hoteles de forma similar."""
        cycle = self._state.get("cycle_count", 0)
        if cycle % 5 == 0:
            sites = ["booking", "airbnb"]
        elif cycle % 2 == 0:
            sites = ["booking"]
        else:
            sites = ["airbnb"]
        return [s for s in sites if self.should_scrape(s)]

    def get_airlines_for_cycle(self, all_airlines: List[str], max_per_cycle: int = 3) -> List[str]:
        """Selecciona subconjunto rotativo de aerolíneas directas."""
        cycle = self._state.get("cycle_count", 0)
        start = (cycle * max_per_cycle) % max(len(all_airlines), 1)
        selected = []
        for i in range(max_per_cycle):
            idx = (start + i) % len(all_airlines)
            airline = all_airlines[idx]
            if self.should_scrape(f"direct_{airline}"):
                selected.append(airline)
        return selected

    def get_stats_summary(self) -> str:
        lines = []
        for site, data in self._state.get("site_stats", {}).items():
            s = data.get("successes", 0)
            f = data.get("failures", 0)
            total = s + f
            rate = (s / total * 100) if total > 0 else 0
            cooldown = data.get("cooldown_until", "")
            in_cooldown = False
            if cooldown:
                try:
                    in_cooldown = datetime.now() < datetime.fromisoformat(cooldown)
                except Exception:
                    pass
            status = "🔴 COOLDOWN" if in_cooldown else "🟢 OK"
            lines.append(f"  {site}: {status} ({rate:.0f}% éxito, {s}/{total})")
        return "\n".join(lines) if lines else "  Sin datos todavía"


# =========================================================================
# SCRAPER PRINCIPAL
# =========================================================================

class TravelScraper:
    """Motor de scraping con stealth avanzado y estrategia inteligente."""

    def __init__(self, headless: bool = True, slow_mo: int = 100, max_retries: int = 2):
        self.headless = headless
        self.slow_mo = slow_mo
        self.max_retries = max_retries
        self.browser = None
        self.strategy = ScrapingStrategy()

    async def _init_browser(self):
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
        """Crea página con fingerprint aleatorio + stealth plugin + JS anti-detección."""
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

        # 1. playwright-stealth (parches automáticos)
        if STEALTH_AVAILABLE:
            stealth = Stealth()
            await stealth.apply_stealth_async(page)

        # 2. Script anti-detección avanzado (fingerprint coherente)
        await page.add_init_script(get_stealth_script(fp))

        return page

    async def _close(self):
        if self.browser:
            try:
                await self.browser.close()
            except Exception:
                pass
        if hasattr(self, 'playwright') and self.playwright:
            try:
                await self.playwright.stop()
            except Exception:
                pass
        self.browser = None

    async def _warm_up_page(self, page, url: str):
        """Comportamiento humano antes de extraer datos."""
        await asyncio.sleep(random_delay(1500, 4000))
        await human_scroll(page, "down", random.randint(200, 500))
        await asyncio.sleep(random_delay(500, 1500))
        if random.random() > 0.5:
            await human_scroll(page, "up", random.randint(100, 200))
            await asyncio.sleep(random_delay(300, 800))

    async def _accept_cookies(self, page):
        for sel in [
            'button:has-text("Aceptar todo")', 'button:has-text("Accept all")',
            'button:has-text("Alle akzeptieren")', 'button:has-text("Tout accepter")',
            'button:has-text("Acepto")', 'button:has-text("Accept")',
            '#onetrust-accept-btn-handler', '#acceptCookieButton',
            '[data-testid="accept-cookies"]',
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

    # =========================================================================
    # SCRAPERS
    # =========================================================================

    async def scrape_google_flights(self, page, params: dict) -> List[FlightResult]:
        results = []
        url = URLGenerator.google_flights(**{
            k: v for k, v in params.items()
            if k in ["origin", "destination", "date_depart", "date_return",
                     "adults", "children", "infants_lap", "cabin_class", "currency"]
        })
        try:
            await page.goto(url, wait_until="networkidle", timeout=35000)
            await self._accept_cookies(page)
            await self._warm_up_page(page, url)

            for sel in ['li.pIav2d', 'li[class*="Rk10dc"]', '[data-test-id="offer-listing"]',
                        'div[class*="yR1fYc"]', 'ul[class*="Rk10dc"] > li', 'div[jsname] li[data-ved]']:
                try:
                    cards = page.locator(sel)
                    count = await cards.count()
                    if count > 0:
                        for i in range(min(count, 10)):
                            try:
                                text = await cards.nth(i).inner_text()
                                results.extend(self._parse_flight_text(text, "google_flights", url, params))
                            except Exception:
                                continue
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"⚠️  Error Google Flights: {e}")
        return results

    async def scrape_skyscanner(self, page, params: dict) -> List[FlightResult]:
        results = []
        url = URLGenerator.skyscanner(**{
            k: v for k, v in params.items()
            if k in ["origin", "destination", "date_depart", "date_return",
                     "adults", "children", "infants_lap", "cabin_class", "currency"]
        })
        try:
            await page.goto(url, wait_until="networkidle", timeout=50000)
            await self._accept_cookies(page)
            await self._warm_up_page(page, url)
            await asyncio.sleep(random_delay(3000, 6000))
            for _ in range(random.randint(2, 4)):
                await human_scroll(page, "down", random.randint(300, 600))
                await asyncio.sleep(random_delay(1000, 2000))

            for sel in ['[data-testid="result-item"]', 'div[class*="FlightsTicket"]',
                        'a[class*="UpperTicketBody"]', 'div[class*="ResultCard"]']:
                try:
                    cards = page.locator(sel)
                    count = await cards.count()
                    if count > 0:
                        for i in range(min(count, 10)):
                            try:
                                text = await cards.nth(i).inner_text()
                                results.extend(self._parse_flight_text(text, "skyscanner", url, params))
                            except Exception:
                                continue
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"⚠️  Error Skyscanner: {e}")
        return results

    def _parse_flight_text(self, text, platform, url, params):
        results = []
        price_match = re.search(
            r'(\d{1,3}[.,]?\d{1,3})\s*€|€\s*(\d{1,3}[.,]?\d{1,3})|'
            r'EUR\s*(\d+[.,]?\d*)|(\d+[.,]?\d*)\s*EUR', text
        )
        if not price_match:
            return results
        price_str = next(g for g in price_match.groups() if g is not None)
        try:
            price = float(price_str.replace(".", "").replace(",", "."))
        except ValueError:
            return results
        if price < 10 or price > 20000:
            return results

        airline = "Desconocida"
        m = re.search(
            r'(Ryanair|easyJet|Vueling|Transavia|Lufthansa|Air France|KLM|Iberia|'
            r'Turkish Airlines|Turkish|Aegean|Wizz Air|Eurowings|Norwegian|SAS|Swiss|'
            r'TAP|Volotea|Level|PLAY|Pegasus|Condor|TUI|Corendon|Sun Express|'
            r'Croatia Airlines|Olympic Air|Sky Express)', text, re.IGNORECASE
        )
        if m:
            airline = m.group(1)

        stops = -1
        if re.search(r'(?:directo|nonstop|direct|sin\s*escala)', text, re.IGNORECASE):
            stops = 0
        else:
            sm = re.search(r'(\d)\s*(?:escala|stop|parada)', text, re.IGNORECASE)
            if sm:
                stops = int(sm.group(1))

        duration = ""
        dm = re.search(r'(\d{1,2})\s*h\s*(\d{1,2})?\s*(?:min|m)?', text)
        if dm:
            duration = f"{dm.group(1)}h {dm.group(2) or '0'}m"

        results.append(FlightResult(
            platform=platform, airline=airline, price=price,
            currency=params.get("currency", "EUR"),
            origin=params["origin"], destination=params["destination"],
            date_depart=params["date_depart"], date_return=params["date_return"],
            stops=stops, duration=duration, url=url,
        ))
        return results

    async def scrape_booking(self, page, params: dict) -> List[HotelResult]:
        results = []
        url = URLGenerator.booking(**{
            k: v for k, v in params.items()
            if k in ["destination", "checkin", "checkout", "adults", "children",
                     "children_ages", "rooms", "currency", "board_type", "stars",
                     "min_review_score"]
        })
        try:
            await page.goto(url, wait_until="networkidle", timeout=35000)
            await self._accept_cookies(page)
            await self._dismiss_popups(page)
            await self._warm_up_page(page, url)
            for _ in range(random.randint(2, 3)):
                await human_scroll(page, "down", random.randint(400, 700))
                await asyncio.sleep(random_delay(1000, 2000))

            checkin_dt = datetime.strptime(params["checkin"], "%Y-%m-%d")
            checkout_dt = datetime.strptime(params["checkout"], "%Y-%m-%d")
            nights = (checkout_dt - checkin_dt).days

            for sel in ['[data-testid="property-card"]', 'div[class*="sr_property_block"]',
                        'div[class*="PropertyCard"]']:
                try:
                    cards = page.locator(sel)
                    count = await cards.count()
                    if count > 0:
                        for i in range(min(count, 15)):
                            try:
                                card = cards.nth(i)
                                text = await card.inner_text()

                                name = "Hotel Desconocido"
                                ne = card.locator('[data-testid="title"], h3, [class*="sr-hotel__name"]')
                                if await ne.count() > 0:
                                    name = (await ne.first.inner_text()).strip()

                                pm = re.search(r'(\d{1,3}[.,]?\d{1,3})\s*€|€\s*(\d{1,3}[.,]?\d{1,3})', text)
                                if not pm:
                                    continue
                                ps = pm.group(1) or pm.group(2)
                                pt = float(ps.replace(".", "").replace(",", "."))
                                if pt < 20:
                                    continue

                                rating = 0.0
                                rm = re.search(r'(\d[.,]\d)\s*/?\s*(?:10)?|Puntuación[:\s]*(\d[.,]\d)', text)
                                if rm:
                                    rating = float((rm.group(1) or rm.group(2)).replace(",", "."))

                                review_count = 0
                                rvm = re.search(r'(\d[.,]?\d*)\s*(?:comentarios|reseñas|reviews)', text)
                                if rvm:
                                    review_count = int(rvm.group(1).replace(".", "").replace(",", ""))

                                stars = 0
                                sm = re.search(r'(\d)\s*(?:estrellas?|stars?)', text)
                                if sm:
                                    stars = int(sm.group(1))

                                board = "solo_alojamiento"
                                tl = text.lower()
                                for kw, bt in [("todo incluido", "all_inclusive"), ("all inclusive", "all_inclusive"),
                                               ("media pensión", "half_board"), ("half board", "half_board"),
                                               ("pensión completa", "full_board"), ("desayuno", "breakfast"),
                                               ("breakfast", "breakfast")]:
                                    if kw in tl:
                                        board = bt
                                        break

                                results.append(HotelResult(
                                    platform="booking", name=name,
                                    price_per_night=round(pt / max(nights, 1), 2),
                                    price_total=pt, currency=params.get("currency", "EUR"),
                                    destination=params["destination"],
                                    checkin=params["checkin"], checkout=params["checkout"],
                                    rating=rating, review_count=review_count,
                                    board_type=board, stars=stars, url=url,
                                ))
                            except Exception:
                                continue
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"⚠️  Error Booking: {e}")
        return results

    async def scrape_airbnb(self, page, params: dict) -> List[HotelResult]:
        results = []
        url = URLGenerator.airbnb(**{
            k: v for k, v in params.items()
            if k in ["destination", "checkin", "checkout", "adults", "children",
                     "infants", "currency", "price_max", "min_bedrooms"]
        })
        try:
            await page.goto(url, wait_until="networkidle", timeout=35000)
            await self._accept_cookies(page)
            await self._dismiss_popups(page)
            await self._warm_up_page(page, url)

            checkin_dt = datetime.strptime(params["checkin"], "%Y-%m-%d")
            checkout_dt = datetime.strptime(params["checkout"], "%Y-%m-%d")
            nights = (checkout_dt - checkin_dt).days

            for sel in ['[data-testid="card-container"]', '[itemprop="itemListElement"]',
                        'div[class*="StayCard"]']:
                try:
                    cards = page.locator(sel)
                    count = await cards.count()
                    if count > 0:
                        for i in range(min(count, 15)):
                            try:
                                card = cards.nth(i)
                                text = await card.inner_text()
                                name = "Alojamiento Airbnb"
                                ne = card.locator('[data-testid="listing-card-title"], [id*="title"]')
                                if await ne.count() > 0:
                                    name = (await ne.first.inner_text()).strip()

                                pm = re.search(
                                    r'(\d{1,3}[.,]?\d{1,3})\s*€.*?total|total.*?(\d{1,3}[.,]?\d{1,3})\s*€|'
                                    r'(\d{1,3}[.,]?\d{1,3})\s*€', text, re.IGNORECASE
                                )
                                if not pm:
                                    continue
                                ps = next(g for g in pm.groups() if g is not None)
                                pt = float(ps.replace(".", "").replace(",", "."))
                                if pt < 20:
                                    continue

                                rating = 0.0
                                rm = re.search(r'(\d[.,]\d{1,2})\s*(?:\(|★|·)', text)
                                if rm:
                                    rating = float(rm.group(1).replace(",", "."))

                                results.append(HotelResult(
                                    platform="airbnb", name=name,
                                    price_per_night=round(pt / max(nights, 1), 2),
                                    price_total=pt, currency=params.get("currency", "EUR"),
                                    destination=params["destination"],
                                    checkin=params["checkin"], checkout=params["checkout"],
                                    rating=rating, review_count=0,
                                    board_type="solo_alojamiento", stars=0, url=url,
                                ))
                            except Exception:
                                continue
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"⚠️  Error Airbnb: {e}")
        return results

    # =========================================================================
    # BÚSQUEDA CON ESTRATEGIA INTELIGENTE
    # =========================================================================

    async def search_flights(self, params: dict) -> Tuple[List[FlightResult], Dict[str, str]]:
        """Busca vuelos con rotación inteligente + reintentos."""
        all_results = []
        urls_fallback = URLGenerator.generate_all_flight_urls(params)
        if not PLAYWRIGHT_AVAILABLE:
            return all_results, urls_fallback

        sites = self.strategy.get_flight_sites_for_cycle()
        print(f"   📋 Vuelos este ciclo: {', '.join(sites) or 'todos en cooldown'}")

        scrapers = {"google_flights": self.scrape_google_flights, "skyscanner": self.scrape_skyscanner}

        for site in sites:
            fn = scrapers.get(site)
            if not fn:
                continue
            for attempt in range(self.max_retries + 1):
                try:
                    page = await self._new_stealth_page()
                    if not page:
                        break
                    print(f"🔍 {site} (intento {attempt + 1})...")
                    res = await fn(page, params)
                    await page.close()
                    if res:
                        all_results.extend(res)
                        self.strategy.record_result(site, True, len(res))
                        print(f"   ✅ {len(res)} resultados")
                        break
                    elif attempt < self.max_retries:
                        w = (2 ** attempt) + random.random() * 2
                        print(f"   ⚠️  Sin resultados, reintento en {w:.0f}s...")
                        await asyncio.sleep(w)
                    else:
                        self.strategy.record_result(site, False)
                        print(f"   ❌ {site}: sin resultados")
                except Exception as e:
                    try: await page.close()
                    except: pass
                    if attempt < self.max_retries:
                        await asyncio.sleep((2 ** attempt) + random.random() * 2)
                    else:
                        self.strategy.record_result(site, False)
                        print(f"   ❌ {site}: {e}")

            if sites.index(site) < len(sites) - 1:
                await asyncio.sleep(random_delay(2000, 5000))

        all_results.sort(key=lambda x: x.price)
        return all_results, urls_fallback

    async def search_hotels(self, params: dict) -> Tuple[List[HotelResult], Dict[str, str]]:
        """Busca hoteles con rotación inteligente + reintentos."""
        all_results = []
        urls_fallback = URLGenerator.generate_all_hotel_urls(params)
        if not PLAYWRIGHT_AVAILABLE:
            return all_results, urls_fallback

        sites = self.strategy.get_hotel_sites_for_cycle()
        print(f"   📋 Hoteles este ciclo: {', '.join(sites) or 'todos en cooldown'}")

        scrapers = {"booking": self.scrape_booking, "airbnb": self.scrape_airbnb}

        for site in sites:
            fn = scrapers.get(site)
            if not fn:
                continue
            for attempt in range(self.max_retries + 1):
                try:
                    page = await self._new_stealth_page()
                    if not page:
                        break
                    print(f"🔍 {site} (intento {attempt + 1})...")
                    res = await fn(page, params)
                    await page.close()
                    if res:
                        all_results.extend(res)
                        self.strategy.record_result(site, True, len(res))
                        print(f"   ✅ {len(res)} resultados")
                        break
                    elif attempt < self.max_retries:
                        await asyncio.sleep((2 ** attempt) + random.random() * 2)
                    else:
                        self.strategy.record_result(site, False)
                except Exception as e:
                    try: await page.close()
                    except: pass
                    if attempt < self.max_retries:
                        await asyncio.sleep((2 ** attempt) + random.random() * 2)
                    else:
                        self.strategy.record_result(site, False)

            if sites.index(site) < len(sites) - 1:
                await asyncio.sleep(random_delay(2000, 5000))

        all_results.sort(key=lambda x: x.price_total)
        return all_results, urls_fallback

    async def search_all(self, flight_params: dict, hotel_params: dict) -> SearchResult:
        search_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        result = SearchResult(search_id=search_id, search_params={"flights": flight_params, "hotels": hotel_params})
        try:
            await self._init_browser()
            flights, furls = await self.search_flights(flight_params)
            result.flights = flights
            result.urls_fallback.update({f"flight_{k}": v for k, v in furls.items()})
            hotels, hurls = await self.search_hotels(hotel_params)
            result.hotels = hotels
            result.urls_fallback.update({f"hotel_{k}": v for k, v in hurls.items()})
        except Exception as e:
            result.errors.append(str(e))
        finally:
            await self._close()
        return result

    async def check_airline_direct(self, airline: str, params: dict) -> Optional[FlightResult]:
        """Precio directo de aerolínea (con cooldown inteligente)."""
        site_key = f"direct_{airline}"
        if not self.strategy.should_scrape(site_key):
            return None

        url = URLGenerator.airline_direct(
            airline, params["origin"], params["destination"],
            params["date_depart"], params["date_return"],
            params.get("adults", 1), params.get("children", 0), params.get("infants_lap", 0),
        )
        if not url or not PLAYWRIGHT_AVAILABLE:
            return None

        try:
            page = await self._new_stealth_page()
            if not page:
                return None
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await self._accept_cookies(page)
            await self._warm_up_page(page, url)
            text = await page.inner_text("body")

            prices = re.findall(r'(\d{1,3}[.,]?\d{1,3})\s*€|€\s*(\d{1,3}[.,]?\d{1,3})', text)
            if prices:
                min_price = float("inf")
                for p in prices:
                    ps = p[0] or p[1]
                    try:
                        pv = float(ps.replace(".", "").replace(",", "."))
                        if 20 < pv < 15000:
                            min_price = min(min_price, pv)
                    except ValueError:
                        continue
                if min_price < float("inf"):
                    await page.close()
                    self.strategy.record_result(site_key, True)
                    return FlightResult(
                        platform=f"direct_{airline}", airline=airline, price=min_price,
                        currency=params.get("currency", "EUR"),
                        origin=params["origin"], destination=params["destination"],
                        date_depart=params["date_depart"], date_return=params["date_return"],
                        stops=-1, duration="", url=url, is_direct_airline=True,
                    )
            await page.close()
            self.strategy.record_result(site_key, False)
        except Exception as e:
            self.strategy.record_result(site_key, False)
        return None
