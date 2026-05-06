/**
 * TripCazador Compare — content script
 *
 * Detecta origen+destino+fecha del DOM/URL en sites travel y muestra un badge
 * flotante con la comparativa de TripCazador. 1-click → link afiliado.
 *
 * No envía datos personales — sólo origen/destino/fecha al endpoint público.
 */

const API_BASE = "https://tripcazador.com";

function detectFromUrl() {
  const url = location.href;
  // Skyscanner: /transport/flights/MAD/TYO/261201/
  let m = url.match(/skyscanner\.[a-z.]+\/transport\/flights?\/([A-Z]{3})\/([A-Z]{3})(?:\/(\d{6,8}))?/i);
  if (m) {
    return {
      site: "skyscanner",
      origin: m[1].toUpperCase(),
      destination: m[2].toUpperCase(),
      date: m[3] ? parseSkyscannerDate(m[3]) : null,
    };
  }
  // Google Flights: ?tfs=… encoded; fallback to URL params with f= or hl
  m = url.match(/google\.[a-z.]+\/travel\/flights/);
  if (m) {
    // GF doesn't expose easy IATA in URL — try DOM
    const iatas = Array.from(document.querySelectorAll("[aria-label]"))
      .map((e) => e.getAttribute("aria-label"))
      .filter(Boolean)
      .join(" ")
      .match(/\b([A-Z]{3})\b/g);
    if (iatas && iatas.length >= 2) {
      return { site: "google_flights", origin: iatas[0], destination: iatas[1], date: null };
    }
  }
  // Kayak: /flights/MAD-TYO/2026-12-01
  m = url.match(/kayak\.[a-z.]+\/flights\/([A-Z]{3})-([A-Z]{3})\/?(\d{4}-\d{2}-\d{2})?/i);
  if (m) {
    return {
      site: "kayak",
      origin: m[1].toUpperCase(),
      destination: m[2].toUpperCase(),
      date: m[3] || null,
    };
  }
  return null;
}

function parseSkyscannerDate(s) {
  // Skyscanner uses YYMMDD or YYYYMMDD
  if (s.length === 6) {
    return `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  }
  if (s.length === 8) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }
  return null;
}

async function fetchTripCazadorPrice(origin, destination, date) {
  const params = new URLSearchParams({ origin, destination });
  if (date) params.set("date_out", date);
  try {
    const r = await fetch(`${API_BASE}/api/deals?${params.toString()}&limit=1`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (Array.isArray(data?.deals) && data.deals.length > 0) {
      const d = data.deals[0];
      return {
        price: Number(d.price ?? d.price_eur ?? 0),
        href: d.booking_url || `${API_BASE}/deals/${d.id}`,
        airline: d.airline || null,
        cabin: d.cabin || "economy",
      };
    }
  } catch (e) {
    console.debug("[TripCazador] fetch error", e);
  }
  return null;
}

function getCurrentPriceFromDom() {
  // Generic: find smallest currency-like number
  const txt = document.body.innerText;
  const matches = Array.from(txt.matchAll(/(\d{2,5})\s*€/g));
  if (matches.length === 0) return null;
  const prices = matches.map((m) => Number(m[1])).filter((p) => p > 20 && p < 9999);
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function injectBadge(detected, tcResult, currentPrice) {
  const existing = document.getElementById("tc-compare-badge");
  if (existing) existing.remove();

  const cheaper = tcResult && currentPrice && tcResult.price < currentPrice;
  const diff = cheaper ? currentPrice - tcResult.price : 0;

  const badge = document.createElement("div");
  badge.id = "tc-compare-badge";
  badge.innerHTML = `
    <div class="tc-badge-inner ${cheaper ? "tc-cheaper" : "tc-equal"}">
      <div class="tc-logo">🎯</div>
      <div class="tc-content">
        <div class="tc-title">TripCazador</div>
        ${
          tcResult
            ? cheaper
              ? `<div class="tc-price">${tcResult.price}€ · <span class="tc-savings">-${diff}€</span></div>
                 <div class="tc-route">${detected.origin} → ${detected.destination}</div>
                 <a class="tc-cta" href="${tcResult.href}" target="_blank" rel="noopener">Reservar →</a>`
              : `<div class="tc-price">${tcResult.price}€</div>
                 <div class="tc-route">${detected.origin} → ${detected.destination}</div>
                 <a class="tc-cta" href="${tcResult.href}" target="_blank" rel="noopener">Ver ofertas</a>`
            : `<div class="tc-route">No tenemos esa ruta hoy</div>
               <a class="tc-cta" href="${API_BASE}" target="_blank" rel="noopener">Buscar similar →</a>`
        }
      </div>
      <button class="tc-close" aria-label="Cerrar">×</button>
    </div>
  `;
  document.body.appendChild(badge);
  badge.querySelector(".tc-close").addEventListener("click", () => badge.remove());
}

async function main() {
  const detected = detectFromUrl();
  if (!detected || !detected.origin || !detected.destination) return;
  const tcResult = await fetchTripCazadorPrice(detected.origin, detected.destination, detected.date);
  const currentPrice = getCurrentPriceFromDom();
  injectBadge(detected, tcResult, currentPrice);
}

// Run on initial load + after navigation (SPA)
main();
let lastHref = location.href;
setInterval(() => {
  if (location.href !== lastHref) {
    lastHref = location.href;
    setTimeout(main, 1500);
  }
}, 800);
