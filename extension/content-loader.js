(() => {
  const SCRIPT_URL = chrome.runtime.getURL("script.js");
  const DATA_FLAG = "kargoAdsHelperLoaded";

  const hasUI = () => Boolean(document.getElementById("kargo-ad-tool"));

  async function injectBundle() {
    if (hasUI()) {
      // Control panel already present; rely on in-page tooling for re-runs.
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = false;
    script.dataset.injectedBy = "kargo-extension";
    script.onload = () => script.remove();
    script.onerror = () => script.remove();
    document.documentElement.appendChild(script);
  }

  if (!document.documentElement.dataset[DATA_FLAG]) {
    document.documentElement.dataset[DATA_FLAG] = "true";
    injectBundle().catch((error) => {
      // Surface failures in the page for quick debugging.
      console.error("Failed to inject Kargo ads helper.", error);
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "kargo:inject") {
      injectBundle()
        .then(() => sendResponse({ ok: true }))
        .catch((error) => {
          console.error("Kargo ads helper re-injection failed.", error);
          sendResponse({ ok: false, error: error?.message });
        });
      return true;
    }
    return undefined;
  });
})();
