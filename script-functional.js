

(() => {
  'use strict';

  // Guard against double initialization
  if (window.__kargoFunctionalInjector) {
    console.info('[Kargo] Functional injector already loaded');
    return;
  }



  const CONFIG = {
    apiEndpoint: 'https://storage.cloud.kargo.com/ad/campaign/rm/test/interview-creatives.json',
    fetchTimeout: 8000,
    stickyZIndex: 2147483600,
    stickyDismissalKey: 'kargoStickyDismissed',
    toolId: 'kargo-functional-tool',
    styleId: 'kargo-functional-styles',
    stickyContainerClass: 'kargo-sticky-container',
    stickyCloseButtonClass: 'kargo-close-btn',
    stickyIframeClass: 'kargo-ad-iframe'
  };


  const state = {
    currentSticky: null,
    stickyDismissed: sessionStorage.getItem(CONFIG.stickyDismissalKey) === 'true',
    injectedMiddleAds: [],
    isInjecting: false
  };


  const px = (value) => `${value}px`;

  const parseSize = (sizeString) => {
    if (typeof sizeString !== 'string') return { width: 320, height: 50 };
    const [w, h] = sizeString.toLowerCase().split('x').map(v => parseInt(v, 10));
    return (isFinite(w) && isFinite(h)) ? { width: w, height: h } : { width: 320, height: 50 };
  };

  const decodeMarkup = (markup) => {
    if (!markup || typeof markup !== 'string') return '';
    const trimmed = markup.trim();

    // Already HTML
    if (/<[a-z][^>]*>/i.test(trimmed)) return trimmed;

    // Try base64 decode
    try {
      const decoded = atob(trimmed);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return trimmed;
    }
  };

  const isVisible = (el) => {
    if (!el || el.hidden) return false;
    if (el.offsetParent === null && el !== document.body) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  // ============================================================================
  // Sticky Ad Functions
  // ============================================================================

  const injectSticky = (ad) => {x
    // Check dismissal
    if (state.stickyDismissed) {
      console.log('[Kargo] Sticky ad skipped (user dismissed)');
      return false;
    }

    // Remove existing sticky
    removeSticky();

    const { width, height } = parseSize(ad.size);
    const markup = decodeMarkup(ad.markup);

    // Create outer container
    const container = document.createElement('div');
    container.className = CONFIG.stickyContainerClass;
    container.dataset.adType = 'sticky';
    container.dataset.adId = `sticky-ad-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Sticky advertisement');
    if (ad?.id) {
      container.dataset.creativeKey = ad.id;
    }

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.className = CONFIG.stickyCloseButtonClass;
    closeBtn.setAttribute('aria-label', 'Close advertisement');
    closeBtn.addEventListener('click', () => {
      state.stickyDismissed = true;
      sessionStorage.setItem(CONFIG.stickyDismissalKey, 'true');
      removeSticky();
      updateUI('Sticky ad closed', 'info');
    });

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.srcdoc = markup;
    iframe.className = CONFIG.stickyIframeClass;
    iframe.style.width = px(width);
    iframe.style.height = px(height);
    iframe.style.border = 'none';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';
    iframe.title = 'Advertisement';

    // Assemble
    container.appendChild(closeBtn);
    container.appendChild(iframe);
    document.body.appendChild(container);

    state.currentSticky = container;
    console.log('[Kargo] Sticky ad injected');
    return true;
  };

  const removeSticky = () => {
    if (state.currentSticky && state.currentSticky.parentNode) {
      state.currentSticky.parentNode.removeChild(state.currentSticky);
      state.currentSticky = null;
    }
  };

  const resetStickyDismissal = () => {
    state.stickyDismissed = false;
    sessionStorage.removeItem(CONFIG.stickyDismissalKey);
    updateUI('Sticky dismissal reset', 'success');
  };


  const injectMiddle = (ad) => {
    const { width, height } = parseSize(ad.size);
    const markup = decodeMarkup(ad.markup);

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'kargo-middle-ad';
    wrapper.style.cssText = `
      width: min(100%, 420px);
      margin: 22px auto;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeUp 0.32s ease both;
    `;

    // Create frame
    const frame = document.createElement('div');
    frame.style.cssText = `
      padding: 10px;
      border-radius: 14px;
      background: #f8fafc;
      box-shadow: 0 24px 45px rgba(15, 23, 42, 0.25);
    `;

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.srcdoc = markup;
    iframe.style.cssText = `
      width: ${px(width)};
      height: ${px(height)};
      border: none;
    `;
    iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';
    iframe.title = 'Advertisement';

    frame.appendChild(iframe);
    wrapper.appendChild(frame);

    // Find insertion point
    const root = findArticleRoot();
    const result = insertIntoContent(root, wrapper);

    if (result.success) {
      state.injectedMiddleAds.push(wrapper);
      console.log(`[Kargo] Middle ad injected (${result.strategy})`);
      return true;
    }

    console.warn('[Kargo] Failed to inject middle ad');
    return false;
  };

  const findArticleRoot = () => {
    const selectors = ['article', 'main', '[role="main"]', '.content', '#content'];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return document.body;
  };

  const insertIntoContent = (root, wrapper) => {
    // Find all visible paragraphs (simplified approach from interview feedback)
    const allParagraphs = Array.from(root.querySelectorAll('p'));
    const visibleParagraphs = allParagraphs.filter(p => {
      return isVisible(p) && p.textContent.trim().length > 0;
    });

    if (visibleParagraphs.length === 0) {
      // Fallback: insert at end (always serve)
      root.appendChild(wrapper);
      return { success: true, strategy: 'end-of-container' };
    }

    // Insert after midpoint paragraph
    const midIndex = Math.floor(visibleParagraphs.length / 2);
    const anchor = visibleParagraphs[midIndex];
    anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);

    return {
      success: true,
      strategy: 'paragraph-midpoint',
      totalParagraphs: visibleParagraphs.length
    };
  };



  const injectAd = (ad) => {
    if (!ad || typeof ad !== 'object') {
      console.warn('[Kargo] Invalid ad payload', ad);
      return false;
    }

    const type = (ad.type || 'middle').toLowerCase();

    // Simple routing - no classes needed
    if (type === 'sticky') {
      return injectSticky(ad);
    } else if (type === 'middle') {
      return injectMiddle(ad);
    } else {
      console.warn(`[Kargo] Unknown ad type: ${type}`);
      return false;
    }
  };



  const fetchAds = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.fetchTimeout);

    try {
      const response = await fetch(CONFIG.apiEndpoint, {
        signal: controller.signal,
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.ads || [];
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  };

  const cleanupAds = () => {
    removeSticky();
    state.injectedMiddleAds.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    state.injectedMiddleAds = [];
  };

  const handleInject = async () => {
    if (state.isInjecting) return;

    state.isInjecting = true;
    updateUI('Fetching ads...', 'info');

    try {
      cleanupAds();
      const ads = await fetchAds();

      if (!ads.length) {
        updateUI('No ads returned', 'error');
        return;
      }

      let injectedCount = 0;
      ads.forEach(ad => {
        if (injectAd(ad)) injectedCount++;
      });

      if (injectedCount === 0) {
        const msg = state.stickyDismissed
          ? 'Sticky skipped (dismissed). Click Reset to re-enable.'
          : 'No ads were injected';
        updateUI(msg, 'info');
      } else {
        updateUI(`Injected ${injectedCount} ad${injectedCount === 1 ? '' : 's'}`, 'success');
      }
    } catch (error) {
      updateUI(error.message || 'Failed to fetch ads', 'error');
    } finally {
      state.isInjecting = false;
    }
  };



  const injectStyles = () => {
    if (document.getElementById(CONFIG.styleId)) return;

    const style = document.createElement('style');
    style.id = CONFIG.styleId;
    style.textContent = `
      .${CONFIG.stickyContainerClass} {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        bottom: calc(env(safe-area-inset-bottom, 0px));
        z-index: ${CONFIG.stickyZIndex};
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

      .${CONFIG.stickyContainerClass} iframe {
        border: none;
      }

      .${CONFIG.stickyCloseButtonClass} {
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
        z-index: ${CONFIG.stickyZIndex + 1};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .${CONFIG.stickyCloseButtonClass}:hover,
      .${CONFIG.stickyCloseButtonClass}:focus {
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
        .${CONFIG.stickyContainerClass} {
          left: 0;
          right: 0;
          transform: none;
          width: 100%;
          border-radius: 0;
        }
      }

      @keyframes fadeUp {
        from { transform: translateY(16px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }

      #${CONFIG.toolId} {
        position: fixed;
        bottom: calc(18px + env(safe-area-inset-bottom, 0px));
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 16px;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        border-radius: 18px;
        color: #f8fafc;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 15px;
        box-shadow: 0 25px 60px rgba(15, 23, 42, 0.4);
        width: min(92vw, 360px);
        cursor: grab;
        touch-action: none;
      }

      #${CONFIG.toolId}:active {
        cursor: grabbing;
      }

      #${CONFIG.toolId} .drag-handle {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: rgba(148, 163, 184, 0.35);
        cursor: grab;
        margin: -4px 0 4px 0;
      }

      #${CONFIG.toolId} .drag-handle:hover {
        background: rgba(148, 163, 184, 0.5);
      }

      #${CONFIG.toolId} button {
        padding: 12px 18px;
        border: none;
        border-radius: 999px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, opacity 0.2s;
      }

      #${CONFIG.toolId} button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      #${CONFIG.toolId} button:active:not(:disabled) {
        transform: scale(0.96);
      }

      #${CONFIG.toolId} .inject-btn {
        background: linear-gradient(135deg, #ff8a00, #ff3d00);
        color: white;
      }

      #${CONFIG.toolId} .reset-btn {
        background: rgba(59, 130, 246, 0.2);
        color: #bfdbfe;
      }

      #${CONFIG.toolId} .status {
        text-align: center;
        font-size: 13px;
        color: #bae6fd;
        min-height: 1.4em;
      }

      #${CONFIG.toolId} .status.error { color: #fecaca; }
      #${CONFIG.toolId} .status.success { color: #bbf7d0; }
    `;

    document.head.appendChild(style);
  };

  const createUI = () => {
    const panel = document.createElement('div');
    panel.id = CONFIG.toolId;
    panel.innerHTML = `
      <div class="drag-handle" aria-hidden="true"></div>
      <button class="inject-btn">Inject Ads (Functional)</button>
      <div class="status">Ready</div>
      <button class="reset-btn">Reset Sticky Dismissal</button>
    `;

    const injectBtn = panel.querySelector('.inject-btn');
    const resetBtn = panel.querySelector('.reset-btn');
    const statusEl = panel.querySelector('.status');
    const dragHandle = panel.querySelector('.drag-handle');

    injectBtn.addEventListener('click', handleInject);
    resetBtn.addEventListener('click', resetStickyDismissal);

    // Store reference for updateUI
    panel._statusEl = statusEl;

    document.body.appendChild(panel);

    // Make panel draggable
    makeDraggable(panel, dragHandle);

    return panel;
  };

  const makeDraggable = (panel, handle) => {
    const margin = 12;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const clampPosition = (left, top) => {
      const rect = panel.getBoundingClientRect();
      const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
      const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
      return {
        left: Math.min(Math.max(left, margin), maxLeft),
        top: Math.min(Math.max(top, margin), maxTop)
      };
    };

    const applyPosition = (left, top) => {
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
    };

    const handlePointerDown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = panel.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      panel.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const handlePointerMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      const targetLeft = startLeft + deltaX;
      const targetTop = startTop + deltaY;

      const { left, top } = clampPosition(targetLeft, targetTop);
      applyPosition(left, top);
    };

    const handlePointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      panel.style.cursor = 'grab';
    };

    const handleResize = () => {
      if (panel.style.left && panel.style.top) {
        const currentLeft = parseInt(panel.style.left) || 0;
        const currentTop = parseInt(panel.style.top) || 0;
        const { left, top } = clampPosition(currentLeft, currentTop);
        applyPosition(left, top);
      }
    };

    handle.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('resize', handleResize);
  };

  const updateUI = (message, variant = 'info') => {
    const panel = document.getElementById(CONFIG.toolId);
    if (!panel || !panel._statusEl) return;

    panel._statusEl.textContent = message;
    panel._statusEl.className = `status ${variant}`;
  };



  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && state.currentSticky) {
      state.stickyDismissed = true;
      sessionStorage.setItem(CONFIG.stickyDismissalKey, 'true');
      removeSticky();
      updateUI('Sticky ad dismissed', 'info');
    }
  };

  const init = () => {
    injectStyles();
    createUI();
    document.addEventListener('keydown', handleEscapeKey);
    console.log('[Kargo] Functional injector loaded ✓');
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.__kargoFunctionalInjector = {
    injectAd,
    injectSticky,
    injectMiddle,
    removeSticky,
    resetStickyDismissal,
    fetchAds,
    state: () => ({ ...state }) // Read-only copy
  };

})();
