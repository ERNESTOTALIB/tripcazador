/**
 * TripCazador extension background service worker.
 *
 * Responsabilidades:
 *  - Cache de deals (refresh cada 30 min) en chrome.storage.local
 *  - Comunicación content_script ↔ TripCazador backend
 *  - Track de extensión installs/usage (UTM ext-chrome)
 */

const API_BASE = 'https://tripcazador.com';
const DEALS_CACHE_KEY = 'tc_deals_cache';
const DEALS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

async function fetchDeals() {
  try {
    const res = await fetch(`${API_BASE}/api/deals?limit=200`, {
      headers: { 'X-Extension-Version': '0.1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? { deals: data } : data;
  } catch (e) {
    console.warn('[TripCazador ext] fetch deals failed', e);
    return null;
  }
}

async function refreshDealsCache() {
  const data = await fetchDeals();
  if (!data?.deals) return;
  await chrome.storage.local.set({
    [DEALS_CACHE_KEY]: {
      deals: data.deals,
      cached_at: Date.now(),
    },
  });
}

// Trigger refresh on install + every 30 min
chrome.runtime.onInstalled.addListener(() => {
  refreshDealsCache();
  chrome.alarms.create('refresh-deals', { periodInMinutes: 30 });
});

chrome.alarms?.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refresh-deals') {
    refreshDealsCache();
  }
});

// Listen messages from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'get_deals_for_route') {
    (async () => {
      const stored = await chrome.storage.local.get(DEALS_CACHE_KEY);
      const cache = stored[DEALS_CACHE_KEY];
      if (!cache || Date.now() - cache.cached_at > DEALS_CACHE_TTL_MS) {
        await refreshDealsCache();
      }
      const fresh = await chrome.storage.local.get(DEALS_CACHE_KEY);
      const deals = fresh[DEALS_CACHE_KEY]?.deals || [];
      // Filter by origin/destination match
      const matches = deals.filter((d) => {
        if (msg.origin && d.origin !== msg.origin) return false;
        if (msg.destination && d.destination !== msg.destination) return false;
        return true;
      });
      sendResponse({ matches: matches.slice(0, 5) });
    })();
    return true; // async response
  }

  if (msg.type === 'open_tripcazador') {
    chrome.tabs.create({
      url: `${API_BASE}${msg.path || '/'}?utm_source=ext-chrome&utm_medium=overlay`,
    });
    return false;
  }

  return false;
});
