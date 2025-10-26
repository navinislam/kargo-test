(() => {
  const globalScope = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : undefined);
  if (!globalScope) {
    return;
  }
  const namespace = globalScope.__kargoModules || (globalScope.__kargoModules = {});

  if (!namespace.StickyAdManager) {
    const DEFAULT_OPTIONS = {
      position: "bottom",
      zIndex: 9999,
      closeButtonPosition: "top-right",
      injectStyles: true,
      containerClassName: "kargo-sticky-container",
      closeButtonClassName: "kargo-close-btn",
      iframeClassName: "kargo-ad-iframe",
      ariaLabel: "Sticky advertisement",
      onInject: null,
      onClose: null,
      onRemove: null
    };
    const DEFAULT_SIZE = { width: 320, height: 50 };
    const STYLE_TAG_ID = "kargo-sticky-ad-styles";

    const parseSize = (size) => {
      if (typeof size !== "string") {
        return { ...DEFAULT_SIZE };
      }
      const [widthPart, heightPart] = size.toLowerCase().split("x");
      const width = Number.parseInt(widthPart, 10);
      const height = Number.parseInt(heightPart, 10);
      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        return { ...DEFAULT_SIZE };
      }
      return { width, height };
    };

    const px = (value) => `${value}px`;

    class StickyAdManager {
      constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.currentSticky = null;
        this.currentAdId = null;

        this.inject = this.inject.bind(this);
        this.remove = this.remove.bind(this);
      }

      inject(ad) {
        if (typeof document === "undefined") {
          return;
        }
        if (!ad || typeof ad !== "object") {
          console.warn("[StickyAdManager] Ignoring invalid ad payload:", ad);
          return;
        }

        this.ensureStyles();
        this.remove();

        const container = this.createContainer(ad);
        const closeButton = this.createCloseButton();
        const adContent = this.createAdContent(ad);

        container.appendChild(closeButton);
        container.appendChild(adContent);

        document.body.appendChild(container);
        this.currentSticky = container;
        this.currentAdId = container.dataset.adId;
        if (typeof this.options.onInject === "function") {
          try {
            this.options.onInject(container, ad);
          } catch (error) {
            console.warn("[StickyAdManager] onInject callback threw", error);
          }
        }

        console.log("[StickyAdManager] Sticky ad injected");
      }

      remove() {
        const activeNode = this.currentSticky;
        const activeId = this.currentAdId;
        if (activeNode && activeNode.parentNode) {
          activeNode.parentNode.removeChild(activeNode);
        }
        if (activeNode) {
          console.log("[StickyAdManager] Sticky ad removed");
          if (typeof this.options.onRemove === "function") {
            try {
              this.options.onRemove(activeNode, activeId);
            } catch (error) {
              console.warn("[StickyAdManager] onRemove callback threw", error);
            }
          }
        }
        this.currentSticky = null;
        this.currentAdId = null;
      }

      hasActiveSticky() {
        return Boolean(this.currentSticky);
      }

      getActiveSticky() {
        return this.currentSticky;
      }

      ensureStyles() {
        if (!this.options.injectStyles || typeof document === "undefined") {
          return;
        }
        if (document.getElementById(STYLE_TAG_ID)) {
          return;
        }
        const style = document.createElement("style");
        style.id = STYLE_TAG_ID;
        style.textContent = `
          .${this.options.containerClassName} {
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            bottom: calc(env(safe-area-inset-bottom, 0px));
            z-index: ${this.options.zIndex};
            background: transparent;
            box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.16);
            border-radius: 0;
            padding: 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            max-width: 100vw;
            box-sizing: border-box;
            animation: kargo-sticky-slide-up 0.32s ease-out;
            overflow: visible;
          }

          .${this.options.containerClassName} iframe {
            border: none;
          }

          .${this.options.closeButtonClassName} {
            position: absolute;
            top: 4px;
            left: auto;
            right: 10px;
            background: rgba(15, 23, 42, 0.7);
            color: #ffffff;
            border: none;
            border-radius: 999px;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            z-index: ${this.options.zIndex + 1};
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease, transform 0.2s ease;
          }

          .${this.options.closeButtonClassName}:hover,
          .${this.options.closeButtonClassName}:focus {
            background: rgba(15, 23, 42, 0.85);
            transform: scale(1.05);
            outline: none;
          }

          @keyframes kargo-sticky-slide-up {
            from {
              transform: translateX(-50%) translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }

          @media (max-width: 767px) {
            .${this.options.containerClassName} {
              left: 0;
              right: 0;
              transform: none;
              width: 100%;
              border-radius: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      createContainer(ad) {
        const container = document.createElement("div");
        container.className = this.options.containerClassName;
        container.dataset.adType = "sticky";
        container.dataset.adId = this.generateAdId();
        container.setAttribute("role", "region");
        container.setAttribute("aria-label", this.options.ariaLabel);
        container.style.position = "fixed";
        container.style.zIndex = String(this.options.zIndex);
        const normalizedPosition = (this.options.position || "bottom").toLowerCase();
        const isTop = normalizedPosition === "top";
        const isBottom = normalizedPosition === "bottom";
        if (isTop || isBottom) {
          container.style.left = "50%";
          container.style.transform = "translateX(-50%)";
        }
        if (isTop) {
          container.style.top = "0";
          container.style.bottom = "auto";
        } else {
          container.style.top = "auto";
          container.style.bottom = "";
        }
        if (ad?.id) {
          container.dataset.creativeKey = ad.id;
        }
        return container;
      }

      createCloseButton() {
        const button = document.createElement("button");
        button.type = "button";
        button.className = this.options.closeButtonClassName;
        button.setAttribute("aria-label", "Close advertisement");
        button.textContent = "×";
        const position = (this.options.closeButtonPosition || "top-right").toLowerCase();
        const posTop = position.includes("top");
        const posBottom = position.includes("bottom");
        const posLeft = position.includes("left");
        const posRight = position.includes("right");
        button.style.top = posTop ? "-2px" : "auto";
        button.style.bottom = posBottom ? "4px" : "auto";
        button.style.left = posLeft ? "4px" : "auto";
        button.style.right = posRight ? "-2px" : "auto";
        button.addEventListener("click", () => {
          const activeId = this.currentAdId;
          this.remove();
          if (typeof this.options.onClose === "function") {
            try {
              this.options.onClose(activeId);
            } catch (error) {
              console.warn("[StickyAdManager] onClose callback threw", error);
            }
          }
        });
        return button;
      }

      createAdContent(ad) {
        const iframe = document.createElement("iframe");
        iframe.className = this.options.iframeClassName;
        const { width, height } = parseSize(ad.size);
        iframe.width = width;
        iframe.height = height;
        iframe.style.width = px(width);
        iframe.style.height = px(height);
        iframe.style.border = "none";
        iframe.title = "Advertisement";
        iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";
        iframe.srcdoc = decodeMarkup(ad.markup);
        return iframe;
      }

      generateAdId() {
        return `sticky-ad-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      }
    }

    namespace.StickyAdManager = StickyAdManager;
  }

  if (!namespace.AdInjector) {
    const StickyAdManager = namespace.StickyAdManager;

    class AdInjector {
      constructor(options = {}) {
        const {
          sticky: stickyOptions = {},
          middleInjector = null,
          hooks = {}
        } = options;
        this.stickyManager = new StickyAdManager(stickyOptions);
        this.middleInjector = typeof middleInjector === "function" ? middleInjector : null;
        this.hooks = {
          willInject: typeof hooks.onStickyWillInject === "function" ? hooks.onStickyWillInject : null,
          injected: typeof hooks.onStickyInjected === "function" ? hooks.onStickyInjected : null,
          removed: typeof hooks.onStickyRemoved === "function" ? hooks.onStickyRemoved : null
        };
      }

      injectAds(ads = []) {
        if (!Array.isArray(ads)) {
          console.warn("[AdInjector] Expected an array of ads.");
          return 0;
        }

        let injected = 0;

        ads.forEach((ad) => {
          if (!ad || typeof ad !== "object") {
            console.warn("[AdInjector] Skipping invalid ad payload:", ad);
            return;
          }

          const type = (ad.type || "").toLowerCase();
          if (type === "sticky") {
            const shouldInject = this.hooks.willInject ? this.hooks.willInject(ad, this.stickyManager) !== false : true;
            if (shouldInject) {
              this.stickyManager.inject(ad);
              if (this.hooks.injected) {
                try {
                  this.hooks.injected(ad, this.stickyManager);
                } catch (error) {
                  console.warn("[AdInjector] onStickyInjected hook threw", error);
                }
              }
              injected += 1;
            }
            return;
          }

          if (this.middleInjector) {
            this.middleInjector(ad);
            injected += 1;
          } else {
            console.info("[AdInjector] No middle injector configured, skipping non-sticky ad.", ad);
          }
        });

        return injected;
      }

      removeSticky() {
        const activeNode = this.stickyManager.getActiveSticky();
        const activeId = activeNode?.dataset?.adId || null;
        if (activeNode) {
          this.stickyManager.remove();
          if (this.hooks.removed) {
            try {
              this.hooks.removed(activeId, this.stickyManager);
            } catch (error) {
              console.warn("[AdInjector] onStickyRemoved hook threw", error);
            }
          }
          return true;
        }
        this.stickyManager.remove();
        return false;
      }
    }

    namespace.AdInjector = AdInjector;
  }

  // Keep everything namespaced under a predictable global for idempotent reloads.
  const GLOBAL_NS = "__kargoInterviewAds";
  const MODULES = namespace;

  // Centralized configuration so interviewers can see integration details at a glance.
  const CONFIG = {
    endpoint: "https://storage.cloud.kargo.com/ad/campaign/rm/test/interview-creatives.json",
    toolId: "kargo-ad-tool",
    styleId: "kargo-ad-tool-style",
    stickyHostClass: "kargo-interview-sticky-host",
    wrapperPrefix: "kargo-interview-ad",
    scriptFileName: "script.js",
    fetchTimeoutMs: 8000,
    maxObserverMs: 5000,
    anchorSelectors: [
      "main article",
      "article",
      "main",
      "[role='main']",
      ".post-content",
      ".post__content",
      ".entry-content",
      ".content",
      "#content"
    ],
    storageKeys: {
      stickyDismissed: "kargoInterviewStickyDismissed"
    }
  };

  const existingNamespace = window[GLOBAL_NS] || {};
  if (existingNamespace.initialized) {
    // Script already bootstrapped; surface a friendly hint and bail out.
    if (existingNamespace.ui?.status) {
      existingNamespace.ui.status.textContent = "Kargo ad injector already mounted.";
    }
    return;
  }

  const globalState = window[GLOBAL_NS] = existingNamespace;
  Object.assign(globalState, {
    initialized: true,
    wrappers: [],
    observers: [],
    flags: {
      stickyDismissed: sessionStorage.getItem(CONFIG.storageKeys.stickyDismissed) === "true"
    },
    locks: {
      injecting: false
    },
    listeners: {},
    managers: existingNamespace.managers || {
      adInjector: null,
      activeStickyId: null
    },
    ui: {},
    scriptEl: null,
    autoInject: false
  });

  // Utility: convert a number to a pixel string for inline sizing.
  const px = (value) => `${value}px`;

  // Utility: narrow visibility checks so we only anchor on visible nodes.
  const isVisiblyRendered = (node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (node.hidden) return false;
    if (node.offsetParent === null && node !== document.body) return false;
    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  // Utility: ensure MutationObservers are tracked and cleaned up.
  function trackObserver(observer) {
    globalState.observers.push(observer);
    return () => {
      observer.disconnect();
      const index = globalState.observers.indexOf(observer);
      if (index >= 0) {
        globalState.observers.splice(index, 1);
      }
    };
  }

  // Locate the <script> node that loaded this file so we can read data attributes.
  function findOwnScriptTag() {
    if (globalState.scriptEl && document.contains(globalState.scriptEl)) {
      return globalState.scriptEl;
    }
    const current = document.currentScript;
    if (current && current.src && current.src.split("?")[0].endsWith(CONFIG.scriptFileName)) {
      globalState.scriptEl = current;
      return current;
    }
    const match = Array.from(document.querySelectorAll("script")).find((tag) => {
      return typeof tag.src === "string" && tag.src.split("?")[0].endsWith(CONFIG.scriptFileName);
    });
    if (match) {
      globalState.scriptEl = match;
      return match;
    }
    return null;
  }

  // Detect whether the integrator requested automatic injection via attribute or query param.
  function computeAutoInjectPreference(scriptTag) {
    if (!scriptTag) {
      return false;
    }
    if (scriptTag.hasAttribute("data-auto-inject")) {
      const value = scriptTag.getAttribute("data-auto-inject");
      return value === "" || value === "true" || value === "1";
    }
    if (scriptTag.src) {
      try {
        const url = new URL(scriptTag.src, window.location.href);
        if (url.searchParams.has("autoInject")) {
          const param = url.searchParams.get("autoInject");
          if (param === null || param === "") return true;
          return !["0", "false", "no"].includes(param.toLowerCase());
        }
      } catch (error) {
        console.debug("Unable to parse script src for autoInject flag", error);
      }
    }
    return false;
  }

  // Inject the shared CSS exactly once to keep the DOM clean.
  function injectBaseStyles() {
    if (document.getElementById(CONFIG.styleId)) {
      return;
    }
    const style = document.createElement("style");
    style.id = CONFIG.styleId;
    style.textContent = `
      #${CONFIG.toolId} {
        position: fixed;
        left: 50%;
        bottom: calc(18px + env(safe-area-inset-bottom, 0px));
        transform: translateX(-50%);
        top: auto;
        right: auto;
        z-index: 2147483600;
        display: grid;
        gap: 12px;
        padding: 16px;
        border-radius: 18px;
        background: rgba(15, 23, 42, 0.88);
        backdrop-filter: blur(10px);
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 15px;
        box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
        width: min(92vw, 360px);
        touch-action: manipulation;
        cursor: grab;
      }

      #${CONFIG.toolId}[data-dragging="true"] {
        cursor: grabbing;
      }

      #${CONFIG.toolId} button {
        font: inherit;
      }

      #${CONFIG.toolId} button {
        appearance: none;
        border: none;
        border-radius: 999px;
        padding: 12px 18px;
        font-weight: 600;
        background: linear-gradient(135deg, #ff8a00, #ff3d00);
        color: #fff;
        cursor: pointer;
        transition: transform 0.2s ease, opacity 0.2s ease;
      }

      #${CONFIG.toolId} button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      #${CONFIG.toolId} button:active {
        transform: scale(0.96);
      }

      #${CONFIG.toolId} .kargo-tool__secondary {
        background: rgba(59, 130, 246, 0.18);
        color: #bfdbfe;
      }

      #${CONFIG.toolId} .kargo-tool__secondary:hover:not(:disabled) {
        background: rgba(59, 130, 246, 0.25);
      }

      #${CONFIG.toolId} .kargo-tool__status {
        min-height: 1.4em;
        text-align: center;
        font-size: 13px;
        color: #bae6fd;
      }

      #${CONFIG.toolId} .kargo-tool__status[data-variant="error"] {
        color: #fecaca;
      }

      #${CONFIG.toolId} .kargo-tool__status[data-variant="success"] {
        color: #bbf7d0;
      }

      #${CONFIG.toolId} .kargo-tool__drag {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.35);
        cursor: inherit;
        touch-action: none;
      }

      #${CONFIG.toolId} .kargo-tool__drag::after {
        content: "";
        display: block;
        height: 10px;
      }

      .${CONFIG.wrapperPrefix} {
        width: min(100%, 420px);
        margin: 22px auto;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: transform 0.24s ease, opacity 0.24s ease;
      }

      .${CONFIG.wrapperPrefix}[data-placement="middle"] {
        animation: kargoFadeUp 320ms ease both;
      }

      .${CONFIG.wrapperPrefix}[data-placement="sticky"] {
        width: min(100vw, 420px);
        margin: 0;
      }

      .${CONFIG.wrapperPrefix} .kargo-interview-ad__frame {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 14px;
        overflow: hidden;
        background: #f8fafc;
        padding: 10px;
        box-shadow: 0 24px 45px rgba(15, 23, 42, 0.25);
      }

      .${CONFIG.wrapperPrefix} .kargo-interview-ad__frame > * {
        width: 100%;
        height: 100%;
      }

      .${CONFIG.wrapperPrefix} .kargo-interview-ad__wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
      }

      .${CONFIG.wrapperPrefix} iframe,
      .${CONFIG.wrapperPrefix} img,
      .${CONFIG.wrapperPrefix} video {
        max-width: 100%;
        max-height: 100%;
      }

      .${CONFIG.stickyHostClass} {
        position: fixed;
        left: 50%;
        bottom: calc(0px + env(safe-area-inset-bottom, 0px));
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 12px;
        z-index: 2147483605;
        pointer-events: none;
        width: min(100vw, 440px);
        animation: kargoSlideUp 280ms ease both;
      }

      .${CONFIG.stickyHostClass} .${CONFIG.wrapperPrefix} {
        pointer-events: auto;
      }

      @keyframes kargoSlideUp {
        from {
          transform: translate(-50%, 20px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }

      @keyframes kargoFadeUp {
        from {
          transform: translateY(16px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @media (max-width: 540px) {
        #${CONFIG.toolId} {
          width: min(94vw, 340px);
          gap: 10px;
        }
        .${CONFIG.wrapperPrefix} .kargo-interview-ad__frame {
          padding: 6px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Build the floating control panel that drives the workflow.
  function ensureControlPanel() {
    let panel = document.getElementById(CONFIG.toolId);
    if (!panel) {
      panel = document.createElement("section");
      panel.id = CONFIG.toolId;
      panel.className = "kargo-tool";
      panel.innerHTML = `
        <div class="kargo-tool__drag" data-role="drag-handle" aria-hidden="true"></div>
        <button type="button" class="kargo-tool__inject" data-role="inject">Inject Ads</button>
        <div class="kargo-tool__status" data-role="status" role="status" aria-live="polite">Bootstrapping…</div>
        <button type="button" class="kargo-tool__secondary" data-role="reset-sticky">Reset sticky dismissal</button>
      `;
      document.body.appendChild(panel);
    }

    const ui = {
      panel,
      dragHandle: panel.querySelector('[data-role="drag-handle"]'),
      status: panel.querySelector('[data-role="status"]'),
      inject: panel.querySelector('[data-role="inject"]'),
      resetSticky: panel.querySelector('[data-role="reset-sticky"]')
    };

    globalState.ui = ui;
    bindControlEvents();
    makePanelDraggable(panel, ui.dragHandle || panel);
    syncResetStickyState();
    return panel;
  }

  // Attach event listeners once so repeated injections stay deterministic.
  function bindControlEvents() {
    const { inject, resetSticky } = globalState.ui;
    if (inject && !inject.dataset.listenerAttached) {
      inject.dataset.listenerAttached = "true";
      inject.addEventListener("pointerdown", (event) => {
        try {
          inject.setPointerCapture(event.pointerId);
        } catch (error) {
          // Ignore pointer capture failures (e.g., unsupported browsers).
        }
      });
      const releasePointer = (event) => {
        if (typeof inject.hasPointerCapture === "function" && inject.hasPointerCapture(event.pointerId)) {
          inject.releasePointerCapture(event.pointerId);
        }
      };
      inject.addEventListener("pointerup", releasePointer);
      inject.addEventListener("pointercancel", releasePointer);
      inject.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleInject();
      });
    }
    if (resetSticky && !resetSticky.dataset.listenerAttached) {
      resetSticky.dataset.listenerAttached = "true";
      resetSticky.addEventListener("click", () => {
        rememberStickyDismissal(false);
        setStatus("Sticky dismissal reset for this session.", "success");
      });
    }
  }

  // Allow the floating control panel to be repositioned via pointer/touch dragging.
  function makePanelDraggable(panel, handle) {
    if (!panel || !handle) {
      return;
    }
    if (handle.dataset.dragListenerAttached === "true") {
      return;
    }

    const margin = 12;
    let activePointerId = null;
    let startPoint = { x: 0, y: 0 };
    let startRect = null;

    const clampPosition = (left, top, rect) => {
      const bounds = rect || panel.getBoundingClientRect();
      const maxLeft = Math.max(margin, window.innerWidth - bounds.width - margin);
      const maxTop = Math.max(margin, window.innerHeight - bounds.height - margin);
      return {
        left: Math.min(Math.max(left, margin), maxLeft),
        top: Math.min(Math.max(top, margin), maxTop)
      };
    };

    const applyPosition = (left, top) => {
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.transform = "translate(0, 0)";
      panel.dataset.customPosition = "true";
    };

    const clampToViewport = () => {
      if (panel.dataset.customPosition === "true") {
        const rect = panel.getBoundingClientRect();
        const { left, top } = clampPosition(rect.left, rect.top, rect);
        applyPosition(left, top);
      }
    };

    const stopDragging = () => {
      if (activePointerId === null) {
        return;
      }
      try {
        handle.releasePointerCapture(activePointerId);
      } catch (error) {
        // ignore if pointer capture already released
      }
      activePointerId = null;
      panel.removeAttribute("data-dragging");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerRelease);
      window.removeEventListener("pointercancel", handlePointerRelease);
      clampToViewport();
    };

    const handlePointerMove = (event) => {
      if (event.pointerId !== activePointerId) {
        return;
      }
      const deltaX = event.clientX - startPoint.x;
      const deltaY = event.clientY - startPoint.y;
      const targetLeft = startRect.left + deltaX;
      const targetTop = startRect.top + deltaY;
      const { left, top } = clampPosition(targetLeft, targetTop, startRect);
      applyPosition(left, top);
    };

    const handlePointerRelease = (event) => {
      if (event.pointerId === activePointerId) {
        stopDragging();
      }
    };

    const handlePointerDown = (event) => {
      if (activePointerId !== null) {
        return;
      }
      activePointerId = event.pointerId;
      startPoint = { x: event.clientX, y: event.clientY };
      startRect = panel.getBoundingClientRect();
      panel.dataset.dragging = "true";
      try {
        handle.setPointerCapture(activePointerId);
      } catch (error) {
        // ignore pointer capture errors for unsupported browsers
      }
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerRelease);
      window.addEventListener("pointercancel", handlePointerRelease);
      event.preventDefault();
    };

    handle.addEventListener("pointerdown", handlePointerDown);

    if (!panel.dataset.resizeListenerAttached) {
      panel.dataset.resizeListenerAttached = "true";
      window.addEventListener("resize", clampToViewport);
    }

    handle.dataset.dragListenerAttached = "true";
  }

  // Helper: update the primary status line with semantic color coding.
  function setStatus(message, variant = "info") {
    const status = globalState.ui.status;
    if (!status) return;
    status.textContent = message;
    status.setAttribute("data-variant", variant);
  }

  // Helper: disable/enable interactive controls during network work.
  function setBusy(isBusy) {
    const { inject } = globalState.ui;
    if (!inject) return;
    inject.disabled = isBusy;
    inject.setAttribute("aria-busy", String(isBusy));
  }

  // Helper: keep the reset sticky control in sync with the current dismissal state.
  function syncResetStickyState() {
    const { resetSticky } = globalState.ui;
    if (!resetSticky) return;
    const isDismissed = globalState.flags.stickyDismissed;
    resetSticky.disabled = !isDismissed;
  }

  // Decode HTML markup even when creatives include UTF-8 characters.
  function decodeMarkup(markup) {
    if (typeof markup !== "string") {
      throw new Error("Invalid markup payload.");
    }
    const trimmed = markup.trim();
    if (trimmed === "") {
      return "";
    }
    if (/<[a-z][^>]*>/i.test(trimmed)) {
      return markup;
    }
    const sanitized = trimmed.replace(/\s+/g, "");
    const maybeBase64 = sanitized.length % 4 === 0 || sanitized.length % 4 === 2 || sanitized.length % 4 === 3;
    const base64Pattern = /^[A-Za-z0-9+/=_-]+$/;
    if (!maybeBase64 || !base64Pattern.test(sanitized)) {
      return markup;
    }
    const normalized = sanitized
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    if (!maybeBase64) {
      return markup;
    }
    try {
      const base64Decoder = typeof (globalScope?.atob) === "function"
        ? globalScope.atob.bind(globalScope)
        : (typeof atob === "function" ? atob : null);
      if (!base64Decoder && typeof Buffer === "undefined") {
        return markup;
      }
      if (!base64Decoder && typeof Buffer !== "undefined") {
        return Buffer.from(padded, "base64").toString("utf-8");
      }
      const binary = base64Decoder ? base64Decoder(padded) : "";
      const TextDecoderCtor = typeof (globalScope?.TextDecoder) === "function"
        ? globalScope.TextDecoder
        : (typeof TextDecoder === "function" ? TextDecoder : null);
      if (TextDecoderCtor && binary) {
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoderCtor("utf-8").decode(bytes);
      }
      return binary || markup;
    } catch (error) {
      console.warn("[KargoInjector] Failed to base64 decode markup, using raw payload.", error);
      return markup;
    }
  }

  // Parse a WxH string into numeric dimensions with sensible fallbacks.
  function parseSize(rawSize) {
    if (typeof rawSize !== "string") {
      return { width: 320, height: 50 };
    }
    const [widthPart, heightPart] = rawSize.toLowerCase().split("x");
    const width = Number.parseInt(widthPart, 10);
    const height = Number.parseInt(heightPart, 10);
    if (Number.isFinite(width) && Number.isFinite(height)) {
      return { width, height };
    }
    return { width: 320, height: 50 };
  }

  function configureAdInjector() {
    if (globalState.managers.adInjector) {
      return globalState.managers.adInjector;
    }
    const stickyOptions = {
      zIndex: 2147483600,
      injectStyles: true,
      onInject: (container, ad) => {
        container.dataset.kargoPlacement = "sticky";
        if (ad?.id) {
          container.dataset.creativeKey = ad.id;
        }
      },
      onClose: (adId) => {
        rememberStickyDismissal(true);
        setStatus("Sticky ad closed.", "info");
      },
      onRemove: () => {
        globalState.managers.activeStickyId = null;
      }
    };
    const hooks = {
      onStickyWillInject: (ad) => {
        if (globalState.flags.stickyDismissed) {
          return false;
        }
        return true;
      },
      onStickyInjected: (ad) => {
        globalState.managers.activeStickyId = ad.id;
      },
      onStickyRemoved: () => {
        globalState.managers.activeStickyId = null;
      }
    };
    const adInjector = new MODULES.AdInjector({
      sticky: stickyOptions,
      hooks
    });
    globalState.managers.adInjector = adInjector;
    ensureEscapeListener();
    return adInjector;
  }

  // Reset prior ad placements, host containers, and observers before a fresh run.
  function cleanupExistingAds() {
    globalState.wrappers.forEach((node) => {
      if (node?.parentNode) {
        node.parentNode.removeChild(node);
      }
    });
    globalState.wrappers = [];
    globalState.observers.forEach((observer) => observer.disconnect());
    globalState.observers = [];
    if (globalState.managers.adInjector) {
      globalState.managers.adInjector.removeSticky();
      globalState.managers.activeStickyId = null;
    }
  }

  // Listen for Escape so reviewers can quickly dismiss sticky ads without a mouse.
  function ensureEscapeListener() {
    if (globalState.listeners.keydown) {
      return;
    }
    const handler = (event) => {
      if (event.key === "Escape") {
        const injector = globalState.managers.adInjector;
        const hasSticky = injector?.stickyManager?.hasActiveSticky?.() || false;
        if (hasSticky) {
          rememberStickyDismissal(true);
          injector.removeSticky();
          setStatus("Sticky ad dismissed.", "info");
        }
      }
    };
    document.addEventListener("keydown", handler);
    globalState.listeners.keydown = handler;
  }

  // Track dismissal preference in sessionStorage so refreshes respect the choice.
  function rememberStickyDismissal(isDismissed) {
    globalState.flags.stickyDismissed = isDismissed;
    if (isDismissed) {
      sessionStorage.setItem(CONFIG.storageKeys.stickyDismissed, "true");
    } else {
      sessionStorage.removeItem(CONFIG.storageKeys.stickyDismissed);
    }
    syncResetStickyState();
  }

  // Create a DOM wrapper for a creative with sizing and optional close controls.
  function buildAdWrapper(creative) {
    const { decodedMarkup, size, type, id } = creative;
    const wrapper = document.createElement("div");
    wrapper.className = CONFIG.wrapperPrefix;
    wrapper.dataset.placement = type;
    wrapper.dataset.creativeId = id;
    wrapper.style.setProperty("--kargo-ad-width", px(size.width));
    wrapper.style.setProperty("--kargo-ad-height", px(size.height));

    const frame = document.createElement("div");
    frame.className = "kargo-interview-ad__frame";
    frame.style.width = px(size.width);
    frame.style.height = px(size.height);

    const iframe = document.createElement("iframe");
    iframe.className = "kargo-interview-ad__iframe";
    iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";
    iframe.srcdoc = decodedMarkup;
    iframe.style.width = px(size.width);
    iframe.style.height = px(size.height);
    iframe.style.border = "none";
    iframe.title = "Advertisement";
    frame.appendChild(iframe);
    wrapper.appendChild(frame);

    if (type !== "sticky") {
      globalState.wrappers.push(wrapper);
    }
    return wrapper;
  }

  // Pick the most article-like container on the page using heuristics.
  function findContentRoot() {
    for (const selector of CONFIG.anchorSelectors) {
      const node = document.querySelector(selector);
      if (node) {
        return node;
      }
    }
    return document.body;
  }

  // Try to position the wrapper after a midpoint paragraph and return placement metadata.
  // Simplified approach: Use semantic <p> tags exclusively, serve on all page lengths.
  function tryInsertMiddle(root, wrapper) {
    // Find all visible paragraphs at any depth (not just direct children)
    const allParagraphs = Array.from(root.querySelectorAll('p'));
    const visibleParagraphs = allParagraphs.filter(p => {
      if (!isVisiblyRendered(p)) return false;
      // Additional check: paragraph should have some text content
      return p.textContent.trim().length > 0;
    });

    if (visibleParagraphs.length === 0) {
      // Fallback: No paragraphs found, insert at end of container
      // This ensures we ALWAYS serve, even on non-article pages
      root.appendChild(wrapper);
      return {
        success: true,
        strategy: "end-of-container",
        reason: "no-paragraphs-found",
        totalParagraphs: 0
      };
    }

    // Insert after midpoint paragraph (works for 1, 2, 3+ paragraphs)
    const midIndex = Math.floor(visibleParagraphs.length / 2);
    const anchor = visibleParagraphs[midIndex];
    anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);

    return {
      success: true,
      strategy: "paragraph-midpoint",
      anchorTag: anchor.tagName,
      totalParagraphs: visibleParagraphs.length,
      insertedAfterIndex: midIndex
    };
  }

  // If the initial placement fails, observe for DOM mutations and retry once content stabilizes.
  function scheduleMiddleObserver(root, wrapper) {
    const observer = new MutationObserver(() => {
      const result = tryInsertMiddle(root, wrapper);
      if (result.success) {
        stop();
      }
    });
    const unregister = trackObserver(observer);
    const stop = () => {
      window.clearTimeout(timeoutId);
      unregister();
    };
    observer.observe(root, { childList: true, subtree: true });
    const timeoutId = window.setTimeout(() => {
      stop();
    }, CONFIG.maxObserverMs);
  }

  // Place the wrapper in the article flow, falling back gracefully and optionally observing for updates.
  function injectMiddleAd(wrapper, creative) {
    const root = findContentRoot();
    const result = tryInsertMiddle(root, wrapper);
    if (result.success) {
      return;
    }
    root.appendChild(wrapper);
    scheduleMiddleObserver(root, wrapper);
  }

  // Fetch creatives with a timeout shield so the UI never hangs indefinitely.
  async function fetchCreatives() {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CONFIG.fetchTimeoutMs);
    try {
      const response = await fetch(CONFIG.endpoint, {
        cache: "no-store",
        mode: "cors",
        signal: controller.signal
      });
      if (!response.ok) {
        console.warn("[KargoInjector] Failed to fetch creatives.", response);
        throw new Error(`Request failed (${response.status})`);
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.ads)) {

        console.warn("[KargoInjector] Failed to parse creatives payload.", payload);
        throw new Error("Malformed response from API.");
      }
      return payload.ads;
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("[KargoInjector] Fetch aborted due to timeout.");
        throw new Error("Request timed out. Try again.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  // Normalize API payloads into a structure the injector understands.
  function normalizeCreative(rawCreative, index) {
    const type = (rawCreative.type || "middle").toLowerCase() === "sticky" ? "sticky" : "middle";
    const size = parseSize(rawCreative.size);
    const markup = rawCreative.markup;
    const decodedMarkup = decodeMarkup(markup);
    const sizeLabel = typeof rawCreative.size === "string" && rawCreative.size ? rawCreative.size : `${size.width}x${size.height}`;
    return {
      markup,
      decodedMarkup,
      size,
      sizeLabel,
      type,
      index,
      sourceId: rawCreative.id || null,
      id: `${CONFIG.wrapperPrefix}-${Date.now()}-${index}`
    };
  }

  // High-level flow invoked when the user clicks the inject button.
  async function handleInject() {
    if (globalState.locks.injecting) {
      return;
    }
    globalState.locks.injecting = true;
    setBusy(true);
    setStatus("Fetching ads…", "info");

    try {
      cleanupExistingAds();
      const adInjector = configureAdInjector();
      const creatives = await fetchCreatives();
      if (!creatives.length) {
        setStatus("No ads returned from endpoint.", "error");
        return;
      }

      let injectedCount = 0;
      creatives.forEach((creativeData, index) => {
        try {
          const creative = normalizeCreative(creativeData, index);
          if (creative.type === "sticky") {
            const result = adInjector.injectAds([
              {
                id: creative.id,
                type: creative.type,
                markup: creative.markup,
                size: creative.sizeLabel
              }
            ]);
            injectedCount += result;
          } else {
            const wrapper = buildAdWrapper(creative);
            injectMiddleAd(wrapper, creative);
            injectedCount += 1;
          }
        } catch (error) {
          console.error("Failed to inject ad", error);
        }
      });

      if (injectedCount === 0) {
        const message = globalState.flags.stickyDismissed
          ? "Sticky ad skipped because it was dismissed earlier. Use Reset sticky dismissal to re-enable it."
          : "No ads were injected.";
        setStatus(message, "info");
      } else {
        setStatus(`Injected ${injectedCount} ad${injectedCount === 1 ? "" : "s"}.`, "success");
      }
    } catch (error) {
      setStatus(error.message || "Failed to fetch ads.", "error");
    } finally {
      globalState.locks.injecting = false;
      setBusy(false);
      syncResetStickyState();
    }
  }

  // Initial entry point once the DOM is ready.
  function init() {
    console.log("Kargo Ad Injector loaded.");
    injectBaseStyles();
    ensureControlPanel();
    const scriptTag = findOwnScriptTag();
    globalState.scriptEl = scriptTag;
    globalState.autoInject = computeAutoInjectPreference(scriptTag);
    setStatus(
      globalState.flags.stickyDismissed
        ? "Ready • sticky dismissed this session. Use Reset sticky dismissal to allow it again."
        : "Ready to inject Kargo ads.",
      "info"
    );
    if (globalState.autoInject) {
      setTimeout(() => {
        handleInject();
      }, 350);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
