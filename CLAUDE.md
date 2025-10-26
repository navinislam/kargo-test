# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Workflow: Spec → Code

THESE INSTRUCTIONS ARE CRITICAL!

They dramatically improve the quality of the work you create.
IMPORTANT: DONT ALWAYS AGREE WITH ME. IF YOU FEEL MY OPINION IS WRONG, TELL ME.

### Phase 1: Requirements First

When asked to implement any feature or make changes, ALWAYS start by asking:
"Should I create a Spec for this task first?"

IFF user agrees:

- Create a markdown file in `docs/scopes/FeatureName.md`
- Interview the user to clarify:
  - Purpose & user problem
  - Success criteria
  - Scope & constraints
  - Technical considerations
  - Out of scope items

### Phase 2: Review & Refine

After drafting the Spec:

- Present it to the user
- Ask: "Does this capture your intent? Any changes needed?"
- Iterate until user approves
- End with: "Spec looks good? Type 'GO!' when ready to implement"

### Phase 3: Implementation

ONLY after user types "GO!" or explicitly approves:

- Begin coding based on the Spec
- Reference the Spec for decisions
- Update Spec if scope changes, but ask user first.

### File Organization

```
docs/
├── scopes/
│   ├── FeatureName.md      # Shared/committed Specs
│   └── .local/             # Git-ignored experimental Specs
│       └── Experiment.md
```

**Remember: Think first, ask clarifying questions, _then_ code. The Spec is your north star.**

---

## Project Overview

This is a **mobile-first ad injection tool** created as a Kargo interview assignment demonstrating production-quality ad tech patterns. It's a **standalone, vanilla JavaScript solution** (zero dependencies, no build tools) that injects ads from Kargo's API into live websites.

**Target Sites:**
- https://www.distractify.com/p/trisha-paytas-broadway-show
- https://cookieandkate.com/chickpea-tomato-soup-recipe/

**API Endpoint:** `https://storage.cloud.kargo.com/ad/campaign/rm/test/interview-creatives.json`

---

## Architecture

### Core Structure

```
Kargo/
├── index.html              # Demo shell with auto-inject
├── script.js               # Complete injector (~1650 lines, self-contained)
├── dist/                   # Generated deployment artifacts
│   ├── console-snippet.js  # Copy/paste into DevTools
│   └── bookmarklet.txt     # Bookmarklet version
├── scripts/
│   └── build-snippets.js   # Generates dist/ from script.js
└── docs/                   # Planning and reference docs
    ├── IMPLEMENTATION_PLAN.md
    ├── REFERENCE_PATTERNS.md
    └── README_COMPANION.md
```

### Architecture Decision: Monolithic by Design

**The entire implementation lives in `script.js` as a single, self-contained file.**

**Why monolithic?**
- ✅ Zero build process (vanilla JS, no transpilation)
- ✅ Maximum portability (paste into any DevTools console)
- ✅ Zero friction for reviewers (just open index.html)
- ✅ Works in any environment (no module loader required)

**Production evolution path** is documented in README.md under "Design Decisions", showing how this would be refactored into `StickyAdManager`, `MiddleAdInjector`, `TelemetryService`, etc. for real-world use.

### Key Design Patterns

**1. Global Namespace:**
- Uses `window.__kargoInjector` to avoid collisions when injected into third-party sites
- Prevents duplicate initialization via instance ID tracking

**2. Placement Strategies:**
- **Middle ads**: DOM heuristics + MutationObserver for async content
- **Sticky ads**: Dedicated viewport container with safe-area respect, ESC/close support, session dismissal persistence

**3. Production-Quality Features:**
- Telemetry system with debug console overlay
- Bookmarklet/console snippet generation for self-serve deployment
- Graceful error handling with user-visible status messages
- Session-aware UX (sticky dismissals persist via sessionStorage)

---

## Common Development Commands

### Running the Demo Locally

```bash
# Install any static server (no build process needed)
npm install --global serve

# Serve from project root
serve .

# Open http://localhost:3000/index.html
```

The control panel appears automatically. Because `index.html` uses `data-auto-inject`, ads render immediately on load.

### Regenerating Distribution Artifacts

```bash
npm run build:snippets
```

This reads `script.js` and generates:
- `dist/console-snippet.js` - Copy/paste into DevTools console ✅ **Primary method** (works reliably)
- `dist/bookmarklet.txt` - Instructions for creating a remote loader bookmarklet

**Run this whenever you modify `script.js`** to keep deployment artifacts in sync.

### Why Bookmarklets Don't Work for This Project

The inline bookmarklet exceeds browser limits:
- **Size**: 56KB (browsers limit bookmarklets to ~2KB)
- **Security**: Chrome/Edge strip `javascript:` prefix when pasted in address bar
- **CSP**: Many sites block inline JavaScript execution

**Solution**: Use the console snippet (`dist/console-snippet.js`) as the primary deployment method. For remote bookmarklets, host `script.js` on GitHub Pages/CDN and update the loader URL in `scripts/build-snippets.js`.

---

## script.js Structure

The 1649-line `script.js` is organized into logical sections:

1. **CONFIG** (~lines 1-50): API endpoint, target sites, selectors, feature flags
2. **Utilities** (~lines 51-200): Base64 decode, size parsing, ID generation, DOM helpers
3. **Telemetry** (~lines 201-400): Debug console, event logging, metrics tracking
4. **UI Components** (~lines 401-700): Control panel, buttons, status messages, drawer
5. **Ad Fetching** (~lines 701-800): Fetch creatives, error handling, timeout management
6. **Placement Engine** (~lines 801-1200):
   - Sticky: container creation, close button, ESC handler, dismissal logic
   - Middle: anchor detection, MutationObserver, repositioning
7. **Cleanup & Lifecycle** (~lines 1201-1400): Remove old ads, disconnect observers
8. **Initialization** (~lines 1401-1649): Auto-inject detection, panel setup, global registration

### Critical Implementation Details

**Base64 Decoding:**
- API returns `markup` as base64-encoded HTML
- `decodeMarkup()` handles both browser (`atob`) and Node (`Buffer`) environments
- Non-ASCII characters require UTF-8 awareness

**MutationObserver Lifecycle:**
- Middle ad placement uses observer to handle lazy-loaded content
- **Must disconnect observers on cleanup to prevent memory leaks**
- Check `script.js:~920` for observer lifecycle management

**Session Storage Keys:**
- Sticky dismissal: `kargoStickyAdDismissed`
- Used to persist user preference within session
- Reset via control panel UI

**DOM Injection Timing:**
- Middle ads use heuristics to find stable article anchors
- Observer retries if initial placement fails (async content)
- Safe-area padding for sticky ads respects notched devices

---

## Extension Points

### Adding New Target Sites

Edit `CONFIG.targetSites` in `script.js`:

```javascript
const CONFIG = {
  targetSites: [
    {
      label: "Distractify",
      url: "https://www.distractify.com/p/trisha-paytas-broadway-show"
    },
    // Add new site:
    {
      label: "New Site",
      url: "https://example.com/article"
    }
  ]
};
```

Update `CONFIG.anchorSelectors` if the new site uses different article markup.

### Customizing Placement Rules

**Middle ad anchors:** Edit `findMiddleAnchor()` in `script.js:~920`

**Sticky positioning:** Edit `createStickyContainer()` options in `script.js:~850`

### Adding Telemetry Events

All telemetry flows through `logEvent()` in `script.js:~250`:

```javascript
logEvent("custom_event", { key: "value" });
```

Events appear in debug console overlay and browser console (`console.debug`).

---

## Testing Strategy

### Manual Test Checklist

Run these tests on `index.html` and on target sites:

1. ✅ Load demo → control panel appears → ads inject automatically
2. ✅ Close sticky ad (× or ESC) → status shows dismissal → re-inject skips sticky
3. ✅ Reset dismissal → inject again → sticky returns
4. ✅ Toggle debug log → events appear in overlay
5. ✅ Disconnect network → inject → timeout error → graceful recovery
6. ✅ Copy console snippet → paste in Distractify DevTools → control panel appears
7. ⚠️ Bookmarklet → Not functional due to size limits (see "Why Bookmarklets Don't Work" above)

### Why No Automated Tests?

This is an **interview assignment optimized for demonstration**, not a production codebase. The monolithic architecture makes unit testing awkward (would require extracting functions just for testing).

**For production**, the refactored modular architecture (documented in README.md) would have:
- Jest + JSDOM for component tests
- Playwright for E2E scenarios
- Visual regression tests for ad rendering
- Contract tests for API integration

---

## Production Considerations

**What This Project Demonstrates:**
- Production-style control panel with self-serve tooling
- Robust placement engine with observer-based retry logic
- Session-aware UX with dismissal persistence
- Telemetry-first debugging workflow
- Mobile-first, responsive design
- AdTech domain knowledge (mirrors Kargo patterns)

**Intentional Trade-offs for Interview Context:**
- Monolithic over modular (portability > testability)
- sessionStorage over server-side (simplicity > persistence)
- Single fetch over lazy loading (clarity > optimization)
- No build tools (zero friction > modern tooling)

**Production Evolution Path:**
See README.md section "Production Evolution Roadmap" for detailed migration plan covering:
- Frequency capping with server-side tracking
- Viewability measurement with IntersectionObserver
- Lazy loading with scroll proximity detection
- A/B testing with feature flags
- Circuit breaker patterns for error recovery
- Real-time analytics streaming

---

## Key References

- `REQUIREMENTS.md` - Original interview specification
- `IMPLEMENTATION_PLAN.md` - Design rationale and component planning
- `REFERENCE_PATTERNS.md` - Kargo production patterns that informed design
- `docs/README_COMPANION.md` - Line-by-line code annotations