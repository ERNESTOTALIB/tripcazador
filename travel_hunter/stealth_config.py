"""
Travel Hunter - Stealth Configuration
Configuración anti-detección avanzada para Playwright.
Rotación de fingerprints, user-agents, comportamiento humano.
"""

import random
from typing import Dict, List, Tuple

# =========================================================================
# POOL DE USER-AGENTS REALES (actualizados, Chrome/Firefox/Edge en Win/Mac)
# =========================================================================

USER_AGENTS: List[Dict] = [
    # Chrome en Windows
    {
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "platform": "Win32",
        "brands": [{"brand": "Google Chrome", "version": "131"}, {"brand": "Chromium", "version": "131"}],
    },
    {
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "platform": "Win32",
        "brands": [{"brand": "Google Chrome", "version": "130"}, {"brand": "Chromium", "version": "130"}],
    },
    {
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "platform": "Win32",
        "brands": [{"brand": "Google Chrome", "version": "129"}, {"brand": "Chromium", "version": "129"}],
    },
    # Chrome en Mac
    {
        "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "platform": "MacIntel",
        "brands": [{"brand": "Google Chrome", "version": "131"}, {"brand": "Chromium", "version": "131"}],
    },
    {
        "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "platform": "MacIntel",
        "brands": [{"brand": "Google Chrome", "version": "130"}, {"brand": "Chromium", "version": "130"}],
    },
    # Edge en Windows
    {
        "ua": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
        "platform": "Win32",
        "brands": [{"brand": "Microsoft Edge", "version": "131"}, {"brand": "Chromium", "version": "131"}],
    },
]

# =========================================================================
# RESOLUCIONES DE PANTALLA COMUNES
# =========================================================================

VIEWPORTS: List[Dict] = [
    {"width": 1920, "height": 1080},
    {"width": 1536, "height": 864},
    {"width": 1440, "height": 900},
    {"width": 1366, "height": 768},
    {"width": 1680, "height": 1050},
    {"width": 2560, "height": 1440},
]

# =========================================================================
# ZONAS HORARIAS EUROPEAS (coherentes con geolocalización)
# =========================================================================

LOCATIONS: List[Dict] = [
    {"timezone": "Europe/Paris", "locale": "fr-FR", "lat": 48.5734, "lon": 7.7521, "name": "Strasbourg"},
    {"timezone": "Europe/Paris", "locale": "fr-FR", "lat": 48.8566, "lon": 2.3522, "name": "Paris"},
    {"timezone": "Europe/Berlin", "locale": "de-DE", "lat": 47.5584, "lon": 7.5733, "name": "Basel"},
    {"timezone": "Europe/Berlin", "locale": "de-DE", "lat": 50.1109, "lon": 8.6821, "name": "Frankfurt"},
    {"timezone": "Europe/Madrid", "locale": "es-ES", "lat": 40.4168, "lon": -3.7038, "name": "Madrid"},
]

# =========================================================================
# IDIOMAS (coherentes con la localización)
# =========================================================================

LANGUAGE_SETS: Dict[str, List[str]] = {
    "fr-FR": ["fr-FR", "fr", "en-US", "en"],
    "de-DE": ["de-DE", "de", "en-US", "en"],
    "es-ES": ["es-ES", "es", "en-US", "en"],
    "en-US": ["en-US", "en", "fr-FR", "fr"],
}


def get_random_fingerprint() -> Dict:
    """
    Genera un fingerprint aleatorio pero coherente.
    Cada campo es consistente con los demás (no mezcla Mac UA con Windows platform).
    """
    ua_info = random.choice(USER_AGENTS)
    viewport = random.choice(VIEWPORTS)
    location = random.choice(LOCATIONS)
    languages = LANGUAGE_SETS.get(location["locale"], ["en-US", "en"])

    return {
        "user_agent": ua_info["ua"],
        "platform": ua_info["platform"],
        "brands": ua_info["brands"],
        "viewport": viewport,
        "timezone_id": location["timezone"],
        "locale": location["locale"],
        "geolocation": {"latitude": location["lat"], "longitude": location["lon"]},
        "languages": languages,
        "location_name": location["name"],
        # Variación extra
        "device_scale_factor": random.choice([1, 1.25, 1.5, 2]),
        "has_touch": False,
        "is_mobile": False,
        "color_depth": random.choice([24, 32]),
        "hardware_concurrency": random.choice([4, 8, 12, 16]),
        "device_memory": random.choice([4, 8, 16]),
    }


# =========================================================================
# SCRIPT DE INYECCIÓN ANTI-DETECCIÓN AVANZADO
# =========================================================================

def get_stealth_script(fingerprint: Dict) -> str:
    """
    Script JS que se inyecta en cada página para evadir detección.
    Más avanzado que el stealth básico anterior.
    """
    platform = fingerprint["platform"]
    languages = fingerprint["languages"]
    hw_concurrency = fingerprint["hardware_concurrency"]
    device_memory = fingerprint["device_memory"]
    color_depth = fingerprint["color_depth"]

    return f"""
    // ===== WEBDRIVER =====
    Object.defineProperty(navigator, 'webdriver', {{
        get: () => undefined,
        configurable: true
    }});
    delete navigator.__proto__.webdriver;

    // ===== PLUGINS (simular plugins reales) =====
    Object.defineProperty(navigator, 'plugins', {{
        get: () => {{
            const plugins = [
                {{name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format'}},
                {{name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: ''}},
                {{name: 'Native Client', filename: 'internal-nacl-plugin', description: ''}}
            ];
            plugins.length = 3;
            return plugins;
        }}
    }});

    // ===== LANGUAGES =====
    Object.defineProperty(navigator, 'languages', {{
        get: () => {languages}
    }});

    // ===== PLATFORM =====
    Object.defineProperty(navigator, 'platform', {{
        get: () => '{platform}'
    }});

    // ===== HARDWARE =====
    Object.defineProperty(navigator, 'hardwareConcurrency', {{
        get: () => {hw_concurrency}
    }});
    Object.defineProperty(navigator, 'deviceMemory', {{
        get: () => {device_memory}
    }});

    // ===== SCREEN =====
    Object.defineProperty(screen, 'colorDepth', {{
        get: () => {color_depth}
    }});

    // ===== CHROME RUNTIME =====
    window.chrome = {{
        runtime: {{
            connect: function() {{}},
            sendMessage: function() {{}},
            onMessage: {{ addListener: function() {{}} }},
            id: undefined
        }},
        loadTimes: function() {{ return {{}} }},
        csi: function() {{ return {{}} }},
        app: {{ isInstalled: false, getIsInstalled: function() {{ return false; }} }}
    }};

    // ===== PERMISSIONS API =====
    const originalQuery = window.navigator.permissions?.query;
    if (originalQuery) {{
        window.navigator.permissions.query = (params) => (
            params.name === 'notifications' ?
                Promise.resolve({{ state: Notification.permission }}) :
                originalQuery(params)
        );
    }}

    // ===== WEBGL VENDOR =====
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {{
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter.apply(this, arguments);
    }};

    // ===== CANVAS FINGERPRINT NOISE =====
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type) {{
        if (type === 'image/png' && this.width > 16 && this.height > 16) {{
            const ctx = this.getContext('2d');
            if (ctx) {{
                const imageData = ctx.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 4) {{
                    imageData.data[i] = imageData.data[i] ^ (Math.random() > 0.5 ? 1 : 0);
                }}
                ctx.putImageData(imageData, 0, 0);
            }}
        }}
        return origToDataURL.apply(this, arguments);
    }};

    // ===== CONNECTION TYPE =====
    Object.defineProperty(navigator, 'connection', {{
        get: () => ({{
            effectiveType: '4g',
            rtt: {random.choice([50, 100, 150])},
            downlink: {random.choice([5, 10, 15, 20])},
            saveData: false
        }})
    }});
    """


# =========================================================================
# COMPORTAMIENTO HUMANO
# =========================================================================

def random_delay(min_ms: int = 500, max_ms: int = 3000) -> float:
    """Genera un delay aleatorio en segundos con distribución humana."""
    # Los humanos no tienen delays uniformes, usan una distribución más
    # parecida a una log-normal (muchos delays cortos, pocos largos)
    import math
    mean = (min_ms + max_ms) / 2 / 1000
    std = (max_ms - min_ms) / 4 / 1000
    delay = random.gauss(mean, std)
    return max(min_ms / 1000, min(delay, max_ms / 1000))


def random_mouse_path(start: Tuple[int, int], end: Tuple[int, int], steps: int = 5) -> List[Tuple[int, int]]:
    """
    Genera un camino de ratón con curva humana (no línea recta).
    """
    path = [start]
    for i in range(1, steps + 1):
        t = i / steps
        # Interpolación con ruido
        x = start[0] + (end[0] - start[0]) * t + random.randint(-20, 20)
        y = start[1] + (end[1] - start[1]) * t + random.randint(-10, 10)
        path.append((int(x), int(y)))
    path.append(end)
    return path


async def human_scroll(page, direction: str = "down", amount: int = None):
    """Simula scroll humano (velocidad variable, pequeñas pausas)."""
    if amount is None:
        amount = random.randint(200, 600)

    delta = amount if direction == "down" else -amount
    steps = random.randint(3, 7)
    step_delta = delta / steps

    for _ in range(steps):
        await page.mouse.wheel(0, step_delta + random.randint(-20, 20))
        await asyncio.sleep(random.uniform(0.05, 0.15))

    await asyncio.sleep(random.uniform(0.3, 0.8))


async def human_type(page, selector: str, text: str):
    """Simula escritura humana (velocidad variable por carácter)."""
    element = page.locator(selector)
    await element.click()
    await asyncio.sleep(random.uniform(0.2, 0.5))

    for char in text:
        await page.keyboard.type(char)
        # Los humanos escriben más rápido las letras del medio de una palabra
        delay = random.uniform(0.05, 0.2)
        if char == ' ':
            delay = random.uniform(0.1, 0.3)
        await asyncio.sleep(delay)


async def human_click(page, locator):
    """Simula click humano: mueve el ratón, pequeña pausa, click."""
    box = await locator.bounding_box()
    if not box:
        await locator.click()
        return

    # Click en posición ligeramente aleatoria dentro del elemento
    x = box["x"] + box["width"] * random.uniform(0.2, 0.8)
    y = box["y"] + box["height"] * random.uniform(0.2, 0.8)

    await page.mouse.move(x, y, steps=random.randint(3, 8))
    await asyncio.sleep(random.uniform(0.1, 0.3))
    await page.mouse.click(x, y)
    await asyncio.sleep(random.uniform(0.2, 0.5))


# Necesario para human_scroll
import asyncio
