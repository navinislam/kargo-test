// Placeholder service worker to satisfy MV3 requirements.
// Future enhancements (telemetry, context menus) can hook in here.
chrome.runtime.onInstalled.addListener(() => {
  // No-op for now; ensures the worker stays registered.
});
