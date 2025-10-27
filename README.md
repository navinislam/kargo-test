# Kargo Ad Injector

A mobile-first ad injection tool demonstrating production-quality ad tech patterns. Built with vanilla JavaScript (zero dependencies), this tool injects ads from Kargo's API into live websites through multiple deployment methods.

## Table of Contents

- [Quick Start](#quick-start)
  - [Method 1: Browser Extension](#method-1-browser-extension-recommended)
  - [Method 2: Console Snippet](#method-2-console-snippet)
  - [Method 3: Local Testing](#method-3-local-testing)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Component Flow](#component-flow)
  - [Data Flow](#data-flow)
  - [Future Considerstions]
- [Project Structure](#project-structure)
- [Development](#development)
- [API Reference](#api-reference)
- Future Considerations.
---

## Quick Start

### Method 1: Browser Extension (Recommended)

**Installation:**

1. Build the extension (copies `script.js` into extension directory):
   ```bash
   npm run build:extension
   ```

2. Load in Chrome/Edge:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension/` directory

3. Usage:
   - Navigate to any website
   - Click the Kargo extension icon in toolbar
   - Control panel appears automatically
   - Click "Inject Ads" button

**How it works:**
- Extension injects `content-loader.js` on all pages
- Content loader checks for existing UI to prevent duplicates
- Loads `script.js` as a web-accessible resource into page context
- Control panel appears with drag-and-drop functionality

---

### Method 2: Console Snippet

**Installation:**

1. Generate the console snippet:
   ```bash
   npm run build:snippets
   ```

2. Copy contents of `dist/console-snippet.js`

3. Usage:
   - Open DevTools on target website (F12)
   - Paste snippet into Console tab
   - Press Enter
   - Control panel appears

**How it works:**
- Snippet creates a `<script>` tag with inline code
- Guards against duplicate injection via data attribute
- Executes `script.js` in page context
- Self-removes after execution

---

### Method 3: Local Testing

**Installation:**

```bash
# Install a static server (if you don't have one)
npm install --global serve

# Serve from project root
serve .

# Open http://localhost:3000/index.html
```

**How it works:**
- `index.html` includes `<script src="script.js"></script>`
- Auto-injection happens on page load
- Best for development and debugging

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Methods                        │
├──────────────┬──────────────────────┬───────────────────────┤
│  Extension   │   Console Snippet    │   Local Development   │
│              │                      │                       │
│ content-     │  Inline guard +      │   Direct <script>     │
│ loader.js    │  createElement       │   include             │
└──────┬───────┴──────────┬───────────┴──────────┬────────────┘
       │                  │                      │
       └──────────────────┴──────────────────────┘
                          │
                          ▼
           ┌──────────────────────────────┐
           │       script.js (Core)       │
           │  Self-contained monolith     │
           └──────────────┬───────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌────────┐      ┌──────────┐      ┌──────────┐
   │ Config │      │  State   │      │ Helpers  │
   │        │      │ Manager  │      │          │
   │ API    │      │          │      │ parseSize│
   │ Retries│      │ sticky   │      │ decode   │
   │ Timeout│      │ Dismissed│      │ isVisible│
   └────────┘      │ middle[] │      └──────────┘
                   │ injecting│
                   └──────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐      ┌──────────┐     ┌──────────┐
   │ Sticky  │      │  Middle  │     │ Control  │
   │ Ad      │      │  Ad      │     │ Panel    │
   │ System  │      │  System  │     │ UI       │
   │         │      │          │     │          │
   │ inject  │      │ inject   │     │ createUI │
   │ remove  │      │ findRoot │     │ updateUI │
   │ reset   │      │ insert   │     │ draggable│
   └─────────┘      └──────────┘     └──────────┘
```

### Component Flow

#### 1. Initialization Flow

```
Page Load
    │
    ├─ Double-init guard check (window.__kargoFunctionalInjector)
    │
    ├─ Load sessionStorage dismissal state
    │
    ├─ DOM Ready Check
    │   ├─ If loading: addEventListener('DOMContentLoaded')
    │   └─ If ready: Execute immediately
    │
    ├─ injectStyles()
    │   └─ Creates <style id="kargo-functional-styles">
    │       └─ Shared CSS for sticky, middle ads, control panel
    │
    ├─ createUI()
    │   ├─ Build control panel HTML
    │   ├─ Wire event listeners (inject, reset)
    │   ├─ Attach drag handlers
    │   └─ Append to document.body
    │
    ├─ Setup keyboard listener (ESC to dismiss sticky)
    │
    └─ Export API to window.__kargoFunctionalInjector
```

#### 2. Ad Injection Flow

```
User clicks "Inject Ads"
    │
    ├─ handleInject()
    │   ├─ Guard: Already injecting? Exit early
    │   ├─ Set isInjecting = true
    │   └─ updateUI("Fetching ads...")
    │
    ├─ cleanupAds()
    │   ├─ removeSticky() → Remove existing sticky from DOM
    │   └─ Remove all middle ads from DOM
    │
    ├─ retrieveAds() [with retry logic]
    │   │
    │   ├─ Attempt 1: fetchAds()
    │   │   ├─ AbortController timeout (8s)
    │   │   ├─ Fetch from CONFIG.apiEndpoint
    │   │   ├─ Parse JSON → data.ads[]
    │   │   └─ Return ads if length > 0
    │   │
    │   ├─ On failure: delay(1200ms) → Attempt 2
    │   ├─ On failure: delay(1200ms) → Attempt 3
    │   │
    │   └─ All attempts failed?
    │       └─ Return CONFIG.fallbackAds (local creatives)
    │
    ├─ For each ad in ads[]
    │   │
    │   ├─ injectAd(ad)
    │   │   │
    │   │   ├─ Route by ad.type
    │   │   │   ├─ type: "sticky" → injectSticky(ad)
    │   │   │   └─ type: "middle" → injectMiddle(ad)
    │   │   │
    │   │   └─ Return success/failure boolean
    │   │
    │   └─ Track injectedCount
    │
    ├─ updateUI() with result
    │   ├─ "Injected N ads" (success)
    │   ├─ "Sticky skipped (dismissed)" (info)
    │   └─ "Failed to fetch ads" (error)
    │
    └─ Set isInjecting = false
```

#### 3. Sticky Ad Rendering

```
injectSticky(ad)
    │
    ├─ Check: state.stickyDismissed?
    │   └─ If true: Exit early (user dismissed)
    │
    ├─ removeSticky() → Clear any existing sticky
    │
    ├─ Parse ad.size → { width, height }
    ├─ Decode ad.markup (base64 → HTML)
    │
    ├─ Build DOM structure:
    │   ├─ Container (fixed position, bottom viewport)
    │   │   ├─ Badge ("BY KARGO" label)
    │   │   ├─ Close button (× with ARIA label)
    │   │   └─ Frame
    │   │       └─ <iframe srcdoc="markup">
    │   │           └─ Sandboxed creative content
    │
    ├─ Wire close button listener:
    │   ├─ state.stickyDismissed = true
    │   ├─ sessionStorage.setItem()
    │   ├─ removeSticky()
    │   └─ updateUI("Sticky ad closed")
    │
    ├─ Append container to document.body
    ├─ state.currentSticky = container
    │
    └─ Return true
```

#### 4. Middle Ad Rendering

```
injectMiddle(ad)
    │
    ├─ Parse ad.size → { width, height }
    ├─ Decode ad.markup (base64 → HTML)
    │
    ├─ Build DOM structure:
    │   ├─ Wrapper (.kargo-middle-ad)
    │   │   └─ Frame (padding, shadow, rounded)
    │   │       └─ <iframe srcdoc="markup">
    │   │           └─ Sandboxed creative content
    │
    ├─ findArticleRoot()
    │   ├─ Try selectors in priority order:
    │   │   1. article
    │   │   2. main
    │   │   3. [role="main"]
    │   │   4. .content
    │   │   5. #content
    │   └─ Fallback: document.body
    │
    ├─ insertIntoContent(root, wrapper)
    │   │
    │   ├─ Find all <p> tags in root
    │   ├─ Filter to visible paragraphs (isVisible check)
    │   │
    │   ├─ If no visible paragraphs:
    │   │   └─ Fallback: root.appendChild(wrapper)
    │   │
    │   └─ Otherwise:
    │       ├─ Calculate midIndex = floor(length / 2)
    │       ├─ Get anchor = visibleParagraphs[midIndex]
    │       └─ Insert wrapper after anchor
    │           └─ anchor.parentNode.insertBefore(wrapper, anchor.nextSibling)
    │
    ├─ Track in state.injectedMiddleAds[]
    │
    └─ Return true/false based on success
```

### Data Flow

#### Request Flow

```
User Action
    │
    ▼
┌─────────────────┐
│  Control Panel  │ ─── Click "Inject Ads"
│  (UI Layer)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  handleInject() │ ─── Orchestration
└────────┬────────┘
         │
         ├─ cleanupAds() ───────► Remove existing ads from DOM
         │
         ├─ retrieveAds() ──────► API + Retry Logic
         │    │
         │    ├─ fetchAds() ────► Kargo API endpoint
         │    │    │
         │    │    └─ AbortController timeout
         │    │    └─ Fetch + JSON parse
         │    │
         │    └─ On failure ────► CONFIG.fallbackAds
         │
         └─ For each ad ────────► injectAd() router
              │
              ├─ type: "sticky" ──► injectSticky()
              │                      │
              │                      ├─ Build DOM
              │                      ├─ Wire close handler
              │                      └─ Append to body
              │
              └─ type: "middle" ──► injectMiddle()
                                     │
                                     ├─ Build DOM
                                     ├─ Find article root
                                     ├─ Insert at midpoint
                                     └─ Track in state
```

#### State Management

```
┌──────────────────────────────────────────────┐
│  state (Singleton Store)                     │
├──────────────────────────────────────────────┤
│                                              │
│  currentSticky: HTMLElement | null           │
│    └─ Reference to active sticky container   │
│                                              │
│  stickyDismissed: boolean                    │
│    └─ Initialized from sessionStorage       │
│    └─ Persists across page refreshes        │
│                                              │
│  injectedMiddleAds: HTMLElement[]            │
│    └─ Array of middle ad wrappers            │
│    └─ Used for cleanup on re-inject         │
│                                              │
│  isInjecting: boolean                        │
│    └─ Guards against concurrent injection    │
│    └─ Prevents UI race conditions            │
│                                              │
└──────────────────────────────────────────────┘
         │
         ├─ Read by: injectSticky(), handleInject()
         ├─ Write by: injectSticky(), cleanupAds()
         └─ Persist to sessionStorage: stickyDismissed
```

#### Error Handling Flow

```
API Request Failures
    │
    ├─ Network timeout (8s via AbortController)
    │   └─ Caught as 'AbortError'
    │       └─ Converted to: "Request timed out"
    │
    ├─ HTTP errors (non-2xx status)
    │   └─ Thrown as: `HTTP ${status}`
    │
    ├─ Empty response (ads.length === 0)
    │   └─ Treated as error
    │       └─ Triggers retry logic
    │
    └─ After 3 retries (3.6s delay total)
        │
        ├─ CONFIG.fallbackAds available?
        │   └─ Yes: Return local creatives
        │       └─ updateUI("fallback creatives", variant: info)
        │
        └─ No: Throw error
            └─ updateUI(error.message, variant: error)
```
### Future Considerations
1. **Multiple sticky ads:** I would probably add something that looks at the DOM and finds sticky ads if they exist.
   1. Increase Z-Index to whatever the highest sticky ad is +1.
   2. Or append to the top of that sticky ad once found and increase padding to separate it.
2. **Fallback creatives:** I would probably have some fallback creatives that are used if the API fails, 
I know Kargo has customers who get "White Glove Service" as compared to those from Programmatic, so I would use their creatives as fallbacks to not lose impressions.
3. **Modularize:** - I would probably modularize the code into smaller functions and classes. Such as a StickyAdManager and MiddleAdInjector. Each one handles payloads differently.
4. **Telemetry:** Send logs to another service with ids attached to each served ad. If there are failures or errors, we would know where it originated from and how.



---

## Project Structure

```
Kargo/
├── index.html                 # Local demo shell (auto-inject)
├── script.js                  # ⭐ Core monolith (1000+ lines)
│                              #    All logic in one file
│
├── scripts/                   # Build automation
│   ├── build-extension.js     # Copy script.js → extension/
│   └── build-snippets.js      # Generate dist/ artifacts
│
├── extension/                 # Browser extension bundle
│   ├── manifest.json          # Extension config (MV3)
│   ├── content-loader.js      # Injector (runs in content script)
│   ├── script.js              # Copy of ../script.js
│   ├── service-worker.js      # Background script (optional)
│   ├── popup.html             # Extension UI
│   ├── popup.css              # Extension styles
│   └── popup.js               # Extension logic
│
├── dist/                      # Generated deployment artifacts
│   ├── console-snippet.js     # Paste into DevTools
│   └── bookmarklet.txt        # Bookmarklet instructions
│                              #   (inline version too large)
│
└── docs/                      # Planning and reference
    ├── IMPLEMENTATION_PLAN.md
    ├── REFERENCE_PATTERNS.md
    └── README_COMPANION.md
```

### Why Monolithic?

The entire implementation lives in `script.js` as a single, self-contained file:

✅ **Zero build process** - Vanilla JS, no transpilation
✅ **Maximum portability** - Paste into any DevTools console
✅ **Zero friction** - Just open index.html
✅ **Works everywhere** - No module loader required

**Production evolution path** would refactor into:
- `StickyAdManager.js`
- `MiddleAdInjector.js`
- `TelemetryService.js`
- `ConfigManager.js`

See README "Design Decisions" section for details.

---

## Development

### Available Scripts

```bash
# Build extension (copy script.js → extension/)
npm run build:extension

# Generate console snippet + bookmarklet
npm run build:snippets

# Local development server
npm install --global serve
serve .
# → http://localhost:3000/index.html
```

### Making Changes

1. **Edit `script.js`** - All logic lives here
2. **Test locally** - Open `index.html` in browser
3. **Rebuild artifacts** - Run build scripts if deploying

```bash
# After editing script.js:
npm run build:extension   # Update extension/script.js
npm run build:snippets    # Update dist/
```

### Key Configuration

Located in `script.js` at lines 18-185:

```javascript
const CONFIG = {
  apiEndpoint: 'https://storage.cloud.kargo.com/...',
  fetchTimeout: 8000,           // API timeout (ms)
  fetchRetries: 3,              // Retry attempts
  fetchRetryDelay: 1200,        // Delay between retries (ms)
  slowFetchThreshold: 4000,     // Show "waiting" message
  stickyZIndex: 2147483600,     // High z-index for sticky
  stickyDismissalKey: 'kargoStickyDismissed',
  // CSS class names, fallback ads, etc.
}
```

### Debugging

**Console Logging:**
```javascript
// script.js includes debug output:
console.log('[Kargo] Functional injector loaded ✓');
console.log('[Kargo] Sticky ad injected');
console.log(`[Kargo] Middle ad injected (${strategy})`);
console.warn('[Kargo] Falling back to local creatives...');
```

**Public API (window.__kargoFunctionalInjector):**
```javascript
// Available in browser console:
__kargoFunctionalInjector.state()        // View current state
__kargoFunctionalInjector.injectAd(ad)   // Manual injection
__kargoFunctionalInjector.fetchAds()     // Test API call
__kargoFunctionalInjector.removeSticky() // Clear sticky
__kargoFunctionalInjector.resetStickyDismissal()
```

**Extension Debugging:**
```
chrome://extensions
→ Enable Developer Mode
→ Click "Inspect views: service worker" (for background)
→ Right-click extension popup → Inspect (for popup UI)
→ Use DevTools on any page (for content script logs)
```

---

## API Reference

### Public API Methods

Exposed via `window.__kargoFunctionalInjector`:

#### `injectAd(ad: AdPayload): boolean`
Routes ad to appropriate injector based on `type` field.

```javascript
__kargoFunctionalInjector.injectAd({
  type: 'sticky',
  size: '320x100',
  markup: '<div>Ad HTML</div>'
})
```

#### `injectSticky(ad: AdPayload): boolean`
Injects sticky ad at viewport bottom. Respects dismissal state.

#### `injectMiddle(ad: AdPayload): boolean`
Injects middle ad at article midpoint. Uses heuristic placement.

#### `removeSticky(): void`
Removes active sticky ad from DOM. Clears state reference.

#### `resetStickyDismissal(): void`
Clears dismissal flag from sessionStorage. Allows sticky to show again.

#### `fetchAds(): Promise<AdPayload[]>`
Fetches ads from API with timeout. Throws on failure.

#### `retrieveAds(): Promise<{ ads, source, error? }>`
Fetches with retries, falls back to local creatives.

```javascript
const { ads, source } = await __kargoFunctionalInjector.retrieveAds();
// source: 'remote' | 'fallback'
```

#### `state(): Object`
Returns read-only copy of internal state.

```javascript
const { currentSticky, stickyDismissed, injectedMiddleAds } =
  __kargoFunctionalInjector.state();
```

### Data Structures

#### AdPayload
```typescript
interface AdPayload {
  id?: string;           // Creative identifier
  type: 'sticky' | 'middle';
  size: string;          // Format: "WIDTHxHEIGHT" (e.g., "320x100")
  markup: string;        // HTML string or base64-encoded HTML
}
```

#### API Response
```typescript
interface APIResponse {
  ads: AdPayload[];
}
```

#### State Object
```typescript
interface State {
  currentSticky: HTMLElement | null;
  stickyDismissed: boolean;
  injectedMiddleAds: HTMLElement[];
  isInjecting: boolean;
}
```

---

## How Things Work

### Sticky Ad Lifecycle

1. **Creation**: `injectSticky()` builds container with badge, close button, iframe
2. **Positioning**: Fixed at `bottom: calc(env(safe-area-inset-bottom) + 12px)`
3. **Animation**: Slides up from viewport bottom (0.32s ease-out)
4. **User Dismissal**: Click × or press ESC
5. **Persistence**: Dismissal stored in `sessionStorage.kargoStickyDismissed`
6. **Reset**: `resetStickyDismissal()` clears flag, allows re-injection
7. **Cleanup**: `removeSticky()` removes from DOM, clears state

### Middle Ad Placement Strategy

1. **Find Container**: Priority selectors (`article` → `main` → `[role="main"]` → `.content` → `#content` → `body`)
2. **Collect Paragraphs**: Query all `<p>` tags
3. **Filter Visible**: Check `offsetParent`, `hidden`, `getBoundingClientRect()`
4. **Calculate Midpoint**: `midIndex = Math.floor(visibleParagraphs.length / 2)`
5. **Insert After**: `anchor.parentNode.insertBefore(wrapper, anchor.nextSibling)`
6. **Fallback**: If no paragraphs, append to container end

### Retry & Fallback Logic

```
Attempt 1 → Fetch API
  ├─ Success? Return remote ads
  └─ Failure? Wait 1200ms → Attempt 2
      ├─ Success? Return remote ads
      └─ Failure? Wait 1200ms → Attempt 3
          ├─ Success? Return remote ads
          └─ Failure?
              ├─ Fallback ads configured? Return CONFIG.fallbackAds
              └─ No fallback? Throw error
```

**Total retry duration**: 3.6 seconds (3 × 1200ms)

### Base64 Markup Decoding

API may return markup in two formats:

1. **Plain HTML**: `<div>Ad content</div>`
2. **Base64**: `PGRpdj5BZCBjb250ZW50PC9kaXY+`

`decodeMarkup()` handles both:
```javascript
// Check if already HTML (contains tags)
if (/<[a-z][^>]*>/i.test(markup)) return markup;

// Otherwise, attempt base64 decode
const decoded = atob(markup);
const bytes = new Uint8Array(...);
return new TextDecoder('utf-8').decode(bytes);
```

### Extension Architecture

**Content Script** (`content-loader.js`):
- Runs on all pages (`matches: ["https://*/*", "http://*/*"]`)
- Checks for existing UI to prevent duplicates
- Loads `script.js` from `chrome.runtime.getURL()`
- Listens for messages from popup/background

**Web Accessible Resource**:
- `script.js` declared in `manifest.json`
- Allows content script to inject into page context
- Necessary for DOM manipulation and API access

**Service Worker** (`service-worker.js`):
- Optional background script
- Can handle extension-wide state
- Communicates with content scripts via messages

---

## Troubleshooting

### Extension Not Working

**Symptom**: Extension installed but nothing happens
**Solution**:
1. Check that extension is enabled in `chrome://extensions`
2. Verify `script.js` exists in `extension/` directory
3. Run `npm run build:extension` to copy latest version
4. Reload extension ("↻" button in chrome://extensions)
5. Refresh target website

**Symptom**: Console shows "Failed to load Kargo ads helper"
**Solution**:
1. Check `manifest.json` → `web_accessible_resources`
2. Verify `script.js` is listed in resources array
3. Check DevTools Console for CORS/CSP errors

### Console Snippet Not Working

**Symptom**: Pasting snippet does nothing
**Solution**:
1. Ensure you copied from `dist/console-snippet.js` (not `script.js`)
2. Check for JavaScript errors in Console
3. Try on a simpler page (some sites block inline scripts)

**Symptom**: "Kargo injector already inline" message
**Solution**: Script already loaded, refresh page and try again

### Ads Not Appearing

**Symptom**: "No ads returned" message
**Solution**:
1. Check network tab for API request
2. Verify API endpoint in CONFIG (script.js:19)
3. Check for CORS errors (API should allow cross-origin)
4. Try fallback: Disconnect network, re-inject (uses local creatives)

**Symptom**: Sticky dismissed and won't come back
**Solution**: Click "Reset Sticky Dismissal" button in control panel

### Build Scripts Failing

**Symptom**: `npm run build:extension` fails
**Solution**:
1. Ensure Node.js is installed (`node --version`)
2. Verify `script.js` exists in project root
3. Check file permissions on `extension/` directory

**Symptom**: `npm run build:snippets` fails
**Solution**:
1. Check that `dist/` directory exists (created automatically)
2. Verify write permissions
3. Run `mkdir -p dist` manually if needed

---

## License

This project is an interview assignment demonstrating ad tech patterns. Not intended for production use without further development.

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review console logs for error messages
3. Inspect network tab for API failures
4. Use `__kargoFunctionalInjector.state()` to debug
