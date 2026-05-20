/* TripCazador popup — show cached deals stats */
chrome.storage.local.get('tc_deals_cache').then((stored) => {
  const cache = stored.tc_deals_cache;
  const countEl = document.getElementById('deals-count');
  const refreshEl = document.getElementById('last-refresh');
  if (!cache) {
    countEl.textContent = '0';
    refreshEl.textContent = '–';
    return;
  }
  countEl.textContent = String(cache.deals?.length || 0);
  const minsAgo = Math.floor((Date.now() - cache.cached_at) / 60_000);
  refreshEl.textContent = minsAgo < 1 ? 'ahora' : `hace ${minsAgo}min`;
});
