/**
 * Content script — runs on Skyscanner / Google Flights / Kayak / Booking.
 *
 * Detecta la búsqueda actual (origin + destination IATA) y muestra overlay
 * con deals de TripCazador para esa misma ruta si los hay.
 */

(function () {
  if (window.__tcExtensionLoaded) return;
  window.__tcExtensionLoaded = true;

  // Detect site
  const host = location.hostname;
  let site;
  if (host.includes('skyscanner')) site = 'skyscanner';
  else if (host.includes('google.com')) site = 'google';
  else if (host.includes('kayak')) site = 'kayak';
  else if (host.includes('booking.com')) site = 'booking';
  else return;

  /**
   * Best-effort extraer origin + destination IATA del URL pathname.
   * Skyscanner: /transport/flights/{ORIGIN}/{DEST}/...
   * Google Flights: ?f=ORIGIN&t=DEST (en hash)
   * Kayak: /flights/{ORIGIN}-{DEST}/...
   */
  function extractRoute() {
    const path = location.pathname.toLowerCase();
    const search = location.search.toLowerCase();
    const hash = location.hash.toLowerCase();
    const IATA_RE = /\b([a-z]{3})\b/g;

    if (site === 'skyscanner') {
      const m = path.match(/\/transport\/flights\/([a-z]{3})\/([a-z]{3})/);
      if (m) return { origin: m[1].toUpperCase(), destination: m[2].toUpperCase() };
    }
    if (site === 'kayak') {
      const m = path.match(/\/flights\/([a-z]{3})-([a-z]{3})/);
      if (m) return { origin: m[1].toUpperCase(), destination: m[2].toUpperCase() };
    }
    if (site === 'google') {
      // Hash params
      const fromHash = hash.match(/[?&]f=([a-z]{3})[^a-z]/);
      const toHash = hash.match(/[?&]t=([a-z]{3})[^a-z]/);
      if (fromHash && toHash) {
        return {
          origin: fromHash[1].toUpperCase(),
          destination: toHash[1].toUpperCase(),
        };
      }
    }

    // Fallback: any IATA pair in path
    const matches = [...path.matchAll(IATA_RE), ...search.matchAll(IATA_RE)];
    if (matches.length >= 2) {
      return {
        origin: matches[0][1].toUpperCase(),
        destination: matches[1][1].toUpperCase(),
      };
    }
    return null;
  }

  function renderOverlay(deals) {
    if (deals.length === 0) return;

    const overlay = document.createElement('div');
    overlay.id = 'tc-overlay';
    overlay.innerHTML = `
      <div class="tc-overlay-header">
        <div class="tc-overlay-logo">🎯 TripCazador</div>
        <button id="tc-close" aria-label="Cerrar">×</button>
      </div>
      <div class="tc-overlay-body">
        <p class="tc-overlay-text">Encontramos <strong>${deals.length}</strong> chollo${deals.length > 1 ? 's' : ''} en esta ruta:</p>
        <ul class="tc-overlay-list">
          ${deals
            .map(
              (d) => `
            <li>
              <div class="tc-deal-route">${d.origin} → ${d.destination}</div>
              <div class="tc-deal-price">€${d.price_eur}${d.savings_pct ? ` <span class="tc-deal-savings">(-${d.savings_pct}%)</span>` : ''}</div>
              ${d.airline_name ? `<div class="tc-deal-meta">${d.airline_name}${d.nights ? ` · ${d.nights}n` : ''}</div>` : ''}
              <a class="tc-deal-cta" href="https://tripcazador.com/deals/${d.id}?utm_source=ext-chrome" target="_blank" rel="noopener">Ver chollo →</a>
            </li>`,
            )
            .join('')}
        </ul>
        <div class="tc-overlay-footer">
          <a href="https://tripcazador.com/premium?utm_source=ext-chrome" target="_blank" rel="noopener">⚡ Premium · alertas en &lt;60s</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('tc-close')?.addEventListener('click', () => {
      overlay.remove();
    });
  }

  function showOverlay() {
    const route = extractRoute();
    if (!route) return;
    chrome.runtime.sendMessage(
      { type: 'get_deals_for_route', ...route },
      (res) => {
        if (chrome.runtime.lastError) return;
        if (res?.matches?.length) renderOverlay(res.matches);
      },
    );
  }

  // Initial + on URL change (SPAs)
  setTimeout(showOverlay, 2000);
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      document.getElementById('tc-overlay')?.remove();
      setTimeout(showOverlay, 1500);
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
