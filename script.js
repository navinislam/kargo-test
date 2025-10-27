
(() => {
  'use strict';

  // Guard against double initialization
  if (window.__kargoFunctionalInjector) {
    console.info('[Kargo] Functional injector already loaded');
    return;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Centralized configuration shared with the class-based injector for parity.
   */
  const CONFIG = {
    apiEndpoint: 'https://storage.cloud.kargo.com/ad/campaign/rm/test/interview-creatives.json',
    fetchTimeout: 8000,
    // Retry + fallback behavior for handling API latency/outages.
    fetchRetries: 3,
    fetchRetryDelay: 1200,
    slowFetchThreshold: 4000,
    stickyZIndex: 2147483600,
    stickyDismissalKey: 'kargoStickyDismissed',
    toolId: 'kargo-functional-tool',
    styleId: 'kargo-functional-styles',
    stickyContainerClass: 'kargo-sticky-container',
    stickyCloseButtonClass: 'kargo-close-btn',
    stickyIframeClass: 'kargo-ad-iframe',
    stickyFrameClass: 'kargo-sticky-frame',
    stickyBadgeClass: 'kargo-sticky-badge',
    fallbackAds: [
      {
        id: 'fallback-sticky',
        type: 'sticky',
        size: '320x100',
        markup: `<style>
  .kargo-fallback-sticky {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 96px 1fr 128px;
    background: linear-gradient(120deg, #020617, #0f172a 55%, #1e293b 100%);
    color: #f1f5f9;
    font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
    position: relative;
  }
  .kargo-fallback-sticky__brand {
    background: rgba(15, 23, 42, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    font-weight: 700;
    font-size: 12px;
    padding: 10px 8px;
    border-right: 1px solid rgba(148, 163, 184, 0.25);
  }
  .kargo-fallback-sticky__brand strong {
    font-size: 15px;
    letter-spacing: 2.6px;
  }
  .kargo-fallback-sticky__image {
    position: relative;
    background: radial-gradient(circle at 20% 20%, rgba(14, 165, 233, 0.45), transparent 55%), radial-gradient(circle at 80% 40%, rgba(167, 139, 250, 0.45), transparent 65%), rgba(15, 23, 42, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 14px 16px;
  }
  .kargo-fallback-sticky__image::before {
    content: "Digital Atelier";
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(15, 118, 110, 0.85);
    color: #ecfeff;
    font-size: 11px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    margin-bottom: 6px;
    box-shadow: 0 8px 20px rgba(13, 148, 136, 0.4);
  }
  .kargo-fallback-sticky__image::after {
    content: "Sculpting immersive stories for premium brands.";
    color: rgba(226, 232, 240, 0.8);
    font-size: 12px;
    letter-spacing: 0.6px;
    max-width: 180px;
    line-height: 1.35;
  }
  .kargo-fallback-sticky__cta {
    background: rgba(8, 47, 73, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex-direction: column;
    padding: 12px;
    gap: 4px;
    border-left: 1px solid rgba(148, 163, 184, 0.25);
  }
  .kargo-fallback-sticky__cta span {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: rgba(226, 232, 240, 0.75);
  }
  .kargo-fallback-sticky__cta strong {
    font-size: 16px;
    letter-spacing: 2.4px;
    text-transform: uppercase;
  }
  .kargo-fallback-sticky__cta button {
    margin-top: 6px;
    padding: 7px 14px;
    border-radius: 999px;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: linear-gradient(135deg, #38bdf8, #c084fc);
    color: #0f172a;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    box-shadow: 0 10px 30px rgba(56, 189, 248, 0.45);
  }
  @media (max-width: 420px) {
    .kargo-fallback-sticky {
      grid-template-columns: 100px 1fr;
      grid-template-rows: 60% 40%;
    }
    .kargo-fallback-sticky__cta {
      grid-column: span 2;
      flex-direction: row;
      gap: 10px;
    }
    .kargo-fallback-sticky__cta strong {
      font-size: 14px;
    }
  }
</style>
<div class="kargo-fallback-sticky">
  <div class="kargo-fallback-sticky__brand">
    <span>Kargo</span>
    <strong>Studio</strong>
  </div>
  <div class="kargo-fallback-sticky__image"></div>
  <div class="kargo-fallback-sticky__cta">
    <span>Curate Your</span>
    <strong>Next Launch</strong>
    <button type="button">Explore</button>
  </div>
</div>`
      },
      {
        id: 'fallback-middle',
        type: 'middle',
        size: '300x250',
        markup: `<style>
  .kargo-fallback-middle {
    width: 100%;
    height: 100%;
    border-radius: 18px;
    background: radial-gradient(circle at 15% 20%, rgba(56, 189, 248, 0.35), transparent 55%), radial-gradient(circle at 85% 30%, rgba(251, 191, 36, 0.25), transparent 60%), #0f172a;
    color: #f8fafc;
    font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 16px;
    text-align: left;
    border: 1px solid rgba(148, 163, 184, 0.35);
    padding: 32px 28px;
    position: relative;
    overflow: hidden;
  }
  .kargo-fallback-middle::before {
    content: "";
    position: absolute;
    inset: -60% -40% auto auto;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(148, 163, 184, 0.25), transparent 60%);
    transform: rotate(25deg);
    opacity: 0.6;
  }
  .kargo-fallback-middle__badge {
    text-transform: uppercase;
    font-size: 12px;
    letter-spacing: 2.4px;
    padding: 6px 16px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(148, 163, 184, 0.4);
  }
  .kargo-fallback-middle__headline {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 1.1px;
    line-height: 1.25;
    max-width: 220px;
  }
  .kargo-fallback-middle__copy {
    font-size: 14px;
    color: rgba(226, 232, 240, 0.85);
    letter-spacing: 0.2px;
    line-height: 1.5;
    max-width: 240px;
  }
  .kargo-fallback-middle__cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: 999px;
    background: linear-gradient(135deg, #38bdf8, #c084fc);
    color: #0b1120;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.7px;
    box-shadow: 0 15px 30px rgba(192, 132, 252, 0.35);
  }
</style>
<div class="kargo-fallback-middle">
  <div class="kargo-fallback-middle__badge">Kargo Reserve</div>
  <div class="kargo-fallback-middle__headline">Tailored storytelling for modern brands</div>
  <p class="kargo-fallback-middle__copy">Activate premium placements engineered by Kargo Studio's design collective.</p>
  <div class="kargo-fallback-middle__cta">Plan A Campaign</div>
</div>`
      }
    ]
  };

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Singleton store backing the functional injector. Mutates in place, so
   * consumers should only interact through the exported helpers.
   */
  const state = {
    currentSticky: null,
    stickyDismissed: sessionStorage.getItem(CONFIG.stickyDismissalKey) === 'true',
    injectedMiddleAds: [],
    isInjecting: false
  };


  /** Convert numeric values to CSS pixel strings. */
  const px = (value) => `${value}px`;

  /**
   * Promise-based delay helper so retry logic stays readable.
   * @param {number} ms
   * @returns {Promise<void>}
   */
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Parse a WxH size string (e.g. "320x50") into an object the iframe can use.
   * Falls back to standard banner dimensions when parsing fails.
   * @param {string} sizeString
   * @returns {{width: number, height: number}}
   */
  const parseSize = (sizeString) => {
    if (typeof sizeString !== 'string') return { width: 320, height: 50 };
    const [w, h] = sizeString.toLowerCase().split('x').map(v => parseInt(v, 10));
    return (isFinite(w) && isFinite(h)) ? { width: w, height: h } : { width: 320, height: 50 };
  };

  /**
   * Safely decode creative markup: handles HTML strings, base64 blobs, and junk.
   * @param {string} markup
   * @returns {string}
   */
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

  /**
   * visibility check for article content harvesting.
   * @param {Element} el
   * @returns {boolean}
   */
  const isVisible = (el) => {
    if (!el || el.hidden) return false;
    if (el.offsetParent === null && el !== document.body) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  // ============================================================================
  // Sticky Ad Functions
  // ============================================================================

  /**
   * Render the sticky creative at the viewport edge and wire up its lifecycle.
   * @param {object} ad
   * @returns {boolean}
   */
  const injectSticky = (ad) => {
    // Respect user dismissal across repeated inject attempts.
    if (state.stickyDismissed) {
      console.log('[Kargo] Sticky ad skipped (user dismissed)');
      return false;
    }

    // Clear any existing sticky before adding the new one to avoid doubles.
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

    // Badge marking the creative provenance (mirrors Kargo example).
    const badge = document.createElement('div');
    badge.className = CONFIG.stickyBadgeClass;
    badge.innerHTML = `<svg class="by-kargo-svg-white" id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60.01 9.98"> <g id="Layer_1-2" data-name="Layer 1"> <g> <g fill="#fff"> <path d="m15.5,6.55c0,1.11-.76,1.93-2.31,1.93h-2.94V1.5h2.56c1.51,0,2.32.59,2.32,1.7,0,.63-.29,1.27-1.07,1.56h0c.92.24,1.44.86,1.44,1.79Zm-3.87-2.19h1.01c.56,0,1.07-.26,1.07-.83,0-.49-.34-.81-1.16-.81h-.92v1.64Zm2.4,2.02c0-.55-.41-.9-1.25-.9h-1.15v1.79h1.14c.75,0,1.26-.29,1.26-.89Z"></path> <path d="m22.01,1.5l-2.37,3.91v3.07h-1.42v-3.07l-2.35-3.91h1.61l1.45,2.55h.02l1.43-2.55h1.63Z"></path> <path d="m27.62,5.68l-.7.82v1.98h-1.4V1.5h1.4v3.08h0l2.46-3.08h1.78l-2.62,3.08,2.7,3.9h-1.73l-1.89-2.8h0Z"></path> <path d="m36.28,7.09h-2.73l-.48,1.4h-1.47l2.63-6.98h1.35l2.65,6.98h-1.47l-.48-1.4Zm-.41-1.18l-.95-2.74h-.02l-.94,2.74h1.91Z"></path> <path d="m42.98,8.48l-1.59-2.39h-.82v2.39h-1.39V1.5h2.69c1.71,0,2.47.98,2.47,2.32,0,1.12-.55,1.81-1.46,2.1l1.76,2.56h-1.66Zm-2.41-3.61h.98c.87,0,1.34-.43,1.34-1.08s-.46-1.06-1.28-1.06h-1.04v2.14Z"></path> <path d="m45.23,5c0-2.04,1.35-3.59,3.57-3.59,1,0,2.09.38,2.82,1.2l-1,.83c-.44-.41-1.04-.72-1.82-.72-1.17,0-2.1.85-2.1,2.28,0,1.28.82,2.28,2.16,2.28.51,0,.98-.12,1.44-.39v-1.03h-1.6v-1.18h2.95v3.01c-.64.51-1.7.86-2.79.86-2.05,0-3.63-1.31-3.63-3.55Z"></path> <path d="m52.77,4.99c0-2.07,1.47-3.58,3.62-3.58s3.61,1.45,3.61,3.58-1.52,3.57-3.61,3.57-3.62-1.5-3.62-3.57Zm5.77,0c0-1.32-.92-2.28-2.14-2.28-1.28,0-2.17,1.01-2.17,2.28s.89,2.28,2.17,2.28,2.14-.97,2.14-2.28Z"></path> </g> <g fill="#ff7500"> <path d="m2.89,5.82s0,0,0,0c-.01.03-.03.07-.04.1-.08.23-.17.45-.25.68-.06.17-.13.33-.19.5-.07.19-.14.38-.21.58-.06.16-.12.32-.18.48-.06.16-.12.33-.18.49-.06.16-.12.32-.18.48-.07.19-.14.38-.21.57-.03.09-.07.19-.1.28,0,0,0,0,0,0,1.95-1.94,3.9-3.87,5.87-5.82h-.08c-.92,0-1.84,0-2.76,0-.02,0-.04,0-.06,0,0,0,0,0,0,0,0,0,0-.02,0-.02.07-.19.15-.38.22-.58.05-.13.1-.27.15-.4.05-.13.1-.26.15-.38.05-.14.11-.28.16-.42.06-.15.12-.31.18-.46.07-.18.14-.36.21-.54.07-.19.15-.38.22-.57.07-.19.15-.37.22-.56.03-.07.05-.15.08-.22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0-.01.01-.03.02-.04.04-.71.7-1.42,1.39-2.13,2.09C2.52,3.35,1.28,4.56.05,5.78c-.01.01-.03.03-.05.05h.07c.92,0,1.84,0,2.76,0,.02,0,.04,0,.06,0Z"></path> <path d="m5.93,0c-.02.07-.05.15-.08.22-.07.19-.14.37-.22.56-.07.19-.15.38-.22.57-.07.18-.14.36-.21.54-.06.15-.12.31-.18.46-.05.14-.11.28-.16.42-.05.13-.1.26-.15.38-.05.13-.1.27-.15.4-.07.19-.15.38-.22.58,0,0,0,.02,0,.02,0,0,0,0,0,0,.02,0,.04,0,.06,0,.92,0,1.84,0,2.76,0h.08c-1.96,1.95-3.91,3.88-5.87,5.82,0,0,0,0,0,0,.04-.09.07-.19.1-.28.07-.19.14-.38.21-.57.06-.16.12-.32.18-.48.06-.16.12-.33.18-.49.06-.16.12-.32.18-.48.07-.19.14-.38.21-.58.06-.17.13-.33.19-.5.08-.23.17-.45.25-.68.01-.03.03-.07.04-.1,0,0,0,0,0,0-.02,0-.04,0-.06,0-.92,0-1.84,0-2.76,0h-.07s.03-.03.05-.05c1.24-1.22,2.48-2.43,3.71-3.65.71-.7,1.42-1.39,2.13-2.09.01-.01.03-.02.04-.04h0Z"></path> <polygon points="5.93 0 5.93 0 5.93 0 5.93 0 5.93 0"></polygon> <path d="m4.34,4.16s0,0,0,0c0,0,0,0,0,0Z"></path> <path d="m2.89,5.82s0,0,0,0c0,0,0,0,0,0Z"></path> </g> </g> </g> </svg>`;
    badge.setAttribute('role', 'text');
    badge.setAttribute('aria-label', 'Advertising provided by Kargo');

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

    // Create iframe payload
    const iframe = document.createElement('iframe');
    iframe.srcdoc = markup;
    iframe.className = CONFIG.stickyIframeClass;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';
    iframe.title = 'Advertisement';

    const frame = document.createElement('div');
    frame.className = CONFIG.stickyFrameClass;
    frame.style.setProperty('--sticky-frame-width', px(width));
    frame.style.setProperty('--sticky-frame-height', px(height));
    frame.appendChild(iframe);

    // Assemble
    container.appendChild(badge);
    container.appendChild(closeBtn);
    container.appendChild(frame);
    document.body.appendChild(container);

    state.currentSticky = container;
    console.log('[Kargo] Sticky ad injected');
    return true;
  };

  /**
   * Tear down the sticky container and clear our state pointer.
   */
  const removeSticky = () => {
    if (state.currentSticky && state.currentSticky.parentNode) {
      state.currentSticky.parentNode.removeChild(state.currentSticky);
      state.currentSticky = null;
    }
  };

  /**
   * Reset dismissal flag so the sticky can show again on subsequent injects.
   */
  const resetStickyDismissal = () => {
    state.stickyDismissed = false;
    sessionStorage.removeItem(CONFIG.stickyDismissalKey);
    updateUI('Sticky dismissal reset', 'success');
  };
  /**
   * Inject an in-article creative roughly mid-way through the main content.
   * @param {object} ad
   * @returns {boolean}
   */
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

  /**
   * Pick the best container for middle ads by walking through priority selectors.
   * @returns {Element}
   */
  const findArticleRoot = () => {
    const selectors = ['article', 'main', '[role="main"]', '.content', '#content'];
    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return document.body;
  };

  /**
   * Insert the wrapper after the midpoint paragraph inside the provided root.
   * Falls back to appending if there are no visible paragraphs at all.
   * @param {Element} root
   * @param {Element} wrapper
   * @returns {{success: boolean, strategy: string, totalParagraphs?: number}}
   */
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

    // Insert after midpoint paragraph to avoid crowding the top of the page.
    const midIndex = Math.floor(visibleParagraphs.length / 2);
    const anchor = visibleParagraphs[midIndex];
    // Insert after the anchor node so the creative sits between real content.
    anchor.parentNode.insertBefore(wrapper, anchor.nextSibling);

    return {
      success: true,
      strategy: 'paragraph-midpoint',
      totalParagraphs: visibleParagraphs.length
    };
  };

  /**
   * Route ad payloads to the appropriate injector based on type.
   * @param {object} ad
   * @returns {boolean}
   */
  const injectAd = (ad) => {
    if (!ad || typeof ad !== 'object') {
      console.warn('[Kargo] Invalid ad payload', ad);
      return false;
    }

    // Default to "middle" so payloads missing type still render.
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

  /**
   * Fetch ad payloads from the endpoint with a manual timeout fallback.
   * @returns {Promise<object[]>}
   */
  const fetchAds = async () => {
    const controller = new AbortController();
    // Manual timeout so hung fetches do not block
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

  /**
   * Attempt to fetch ads with retries, falling back to local creatives when the
   * API is unavailable. Useful during latency spikes or outages.
   * @returns {Promise<{ads: object[], source: 'remote'|'fallback', error?: Error}>}
   */
  const retrieveAds = async () => {
    let lastError = null;

    for (let attempt = 1; attempt <= CONFIG.fetchRetries; attempt++) {
      try {
        const remoteAds = await fetchAds();
        if (remoteAds.length) {
          return { ads: remoteAds, source: 'remote' };
        }

        // Treat empty payloads as an error so we can fall back gracefully.
        lastError = new Error('API returned no creatives');
      } catch (error) {
        lastError = error;
      }

      if (attempt < CONFIG.fetchRetries) {
        await delay(CONFIG.fetchRetryDelay);
      }
    }

    if (CONFIG.fallbackAds.length) {
      return { ads: CONFIG.fallbackAds, source: 'fallback', error: lastError };
    }

    // No fallback creatives configured; bubble up the original failure.
    if (lastError) {
      throw lastError;
    }

    return { ads: [], source: 'remote' };
  };

  /**
   * Remove all injected ads so a new run starts from a clean slate.
   */
  const cleanupAds = () => {
    removeSticky();
    state.injectedMiddleAds.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    state.injectedMiddleAds = [];
  };

  /**
   * UI handler: fetch ads, inject them, surface status, and guard from re-entry.
   */
  const handleInject = async () => {
    if (state.isInjecting) return;

    state.isInjecting = true;
    updateUI('Fetching ads...', 'info');
    const slowFetchTimer = setTimeout(() => {
      updateUI('Still waiting on creatives (network latency)...', 'info');
    }, CONFIG.slowFetchThreshold);

    try {
      cleanupAds();
      const { ads, source, error } = await retrieveAds();

      if (source === 'fallback' && error) {
        console.warn('[Kargo] Falling back to local creatives after API failure:', error);
      }

      if (!ads.length) {
        const message = source === 'fallback'
          ? 'Fallback creatives unavailable. Try again when online.'
          : 'No ads returned';
        updateUI(message, 'error');
        return;
      }

      // Track how many creatives actually make it to the page.
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
        const suffix = source === 'fallback' ? ' (fallback creatives)' : '';
        const variant = source === 'fallback' ? 'info' : 'success';
        updateUI(`Injected ${injectedCount} ad${injectedCount === 1 ? '' : 's'}${suffix}`, variant);
      }
    } catch (error) {
      updateUI(error.message || 'Failed to fetch ads', 'error');
    } finally {
      clearTimeout(slowFetchTimer);
      state.isInjecting = false;
    }
  };



  /**
   * Lazily inject the shared stylesheet.
   */
  const injectStyles = () => {
    if (document.getElementById(CONFIG.styleId)) return;

    const style = document.createElement('style');
    style.id = CONFIG.styleId;
    style.textContent = `
      .${CONFIG.stickyContainerClass} {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: ${CONFIG.stickyZIndex};
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        width: 100%;
        box-sizing: border-box;
        animation: kargo-sticky-slide-up 0.32s ease-out;
        overflow: visible;
      }

      .${CONFIG.stickyFrameClass} {
        display: flex;
        width: 100%;
        height: var(--sticky-frame-height);
        overflow: hidden;
        background: #0f172a;
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
        position: relative;
      }

      .${CONFIG.stickyFrameClass} iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }

      .${CONFIG.stickyBadgeClass} {
        position: absolute;
        top: -20px;
        left: 0;
        background: rgba(51, 51, 51, 0.95);
        color: #f8fafc;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 11px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        padding: 8px 12px;
        border-top-right-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        pointer-events: none;
        z-index: ${CONFIG.stickyZIndex + 1};
      }

      .${CONFIG.stickyBadgeClass} svg {
        width: 60px;
        height: auto;
      }

      .${CONFIG.stickyCloseButtonClass} {
        position: absolute;
        top: -20px;
        right: 0;
        background: rgba(71, 71, 71, 0.9);
        color: #fff;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        z-index: ${CONFIG.stickyZIndex + 2};
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        margin: 8px;
      }

      .${CONFIG.stickyCloseButtonClass}:hover,
      .${CONFIG.stickyCloseButtonClass}:focus {
        background: rgba(51, 51, 51, 0.95);
        border-color: rgba(255, 255, 255, 0.5);
        outline: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      }

      @keyframes kargo-sticky-slide-up {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @media (max-width: 640px) {
        .${CONFIG.stickyBadgeClass} {
          padding: 6px 10px;
        }

        .${CONFIG.stickyBadgeClass} svg {
          width: 50px;
        }

        .${CONFIG.stickyCloseButtonClass} {
          width: 32px;
          height: 32px;
          font-size: 18px;
          margin: 6px;
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

  /**
   * Build the floating control panel
   * @returns {HTMLDivElement}
   */
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

    // Store reference for updateUI so we can swap status text efficiently.
    panel._statusEl = statusEl;

    document.body.appendChild(panel);

    // Make panel draggable so interviewers can reposition the tool.
    makeDraggable(panel, dragHandle);

    return panel;
  };

  /**
   * Attach pointer-based dragging with viewport clamping to the tool panel.
   * @param {HTMLElement} panel
   * @param {HTMLElement} handle
   */
  const makeDraggable = (panel, handle) => {
    const margin = 12;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    // Keep the tool inside the viewport with a little breathing room.
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
      // Capture the starting point so subsequent moves can be translated.
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

      // Translate pointer travel into absolute panel coordinates.
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

    // Re-run clamp logic if the viewport changes under us.
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

  /**
   * Update the status line inside the control panel.
   * @param {string} message
   * @param {'info'|'success'|'error'} variant
   */
  const updateUI = (message, variant = 'info') => {
    const panel = document.getElementById(CONFIG.toolId);
    if (!panel || !panel._statusEl) return;

    panel._statusEl.textContent = message;
    panel._statusEl.className = `status ${variant}`;
  };

  /**
   * Allow the ESC key to dismiss the sticky, mirroring the close button.
   * @param {KeyboardEvent} e
   */
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape' && state.currentSticky) {
      state.stickyDismissed = true;
      sessionStorage.setItem(CONFIG.stickyDismissalKey, 'true');
      removeSticky();
      updateUI('Sticky ad dismissed', 'info');
    }
  };

  /**
   * Bootstrap the functional injector once the DOM is ready.
   */
  const init = () => {
    injectStyles();
    createUI();
    document.addEventListener('keydown', handleEscapeKey);
    console.log('[Kargo] Functional injector loaded ✓');
  };

  // Auto-init when DOM ready so interviewers can paste the script mid-session.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API for console-driven demos and manual testing.
  window.__kargoFunctionalInjector = {
    injectAd,
    injectSticky,
    injectMiddle,
    removeSticky,
    resetStickyDismissal,
    fetchAds,
    retrieveAds,
    state: () => ({ ...state }) // Read-only copy
  };

})();
