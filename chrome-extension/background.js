// Background service worker — keep alive only when needed
chrome.runtime.onInstalled.addListener(() => {
  console.log("[TripCazador Compare] installed");
});
