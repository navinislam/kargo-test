# Kargo Interview Ad Injection Tool

This repository packages a self-serve, front-end-only ad injector that mirrors the workflow of Kargo’s production tag while staying effortless to run during the interview. Drop a single script on any supported article and the floating control panel will fetch, render, and manage ads from the provided creative API.

## Project Layout

| File | Description |
|------|-------------|
| `index.html` | Demo shell that mounts the injector so reviewers can interact with it locally. |
| `script.js` | All injector logic: control panel UI, fetch/placement pipeline, telemetry, and scoped styles. |
| `IMPLEMENTATION_PLAN.md` | Up-front design notes outlining planned components and rationale. |

No build tooling or dependencies are required—everything is plain HTML/JavaScript.

## Highlights

- **Production-style control panel** – A floating launcher with advanced tooling (target-site selector, snippet/bookmarklet generator, telemetry toggle) keeps the workflow polished and familiar.
- **Robust placement engine** – Middle ads use DOM heuristics plus a MutationObserver safety net; sticky ads respect safe areas, ESC dismissal, and duplicate prevention.
- **Telemetry-first** – A live debug console exposes fetch state, placement decisions, and user actions so interviewers can inspect behaviour without digging into the code.
- **Session-aware UX** – Sticky dismissals persist within a session and can be reset from the UI, demonstrating user empathy without violating requirements.
- **Commented source** – `script.js` documents each major helper and decision path to make walkthroughs fast.
- **Optional auto-inject** – Add `data-auto-inject` or `?autoInject=1` to the `<script>` tag when you want creatives to render immediately on load.

## Copy/Paste in One Step

- **Console snippet** – Copy the contents of `dist/console-snippet.js` into the DevTools console of any target page. It inlines the entire injector so there is no mixed-content warning or local server requirement.
- **Bookmarklet** – Copy `dist/bookmarklet.txt` into a new bookmark’s URL field. Click the bookmark on Distractify or Cookie & Kate to launch the control panel instantly.
- **Regeneration** – If you tweak `script.js`, run `npm run build:snippets` to refresh both artifacts.

## Running the Demo

```bash
npm install --global serve   # or bring your favourite static server
serve .
```

1. Open `http://localhost:3000/index.html`.
2. The floating panel appears automatically and, because the demo uses `data-auto-inject`, it immediately fetches and renders creatives. Reset from the panel to re-run manually.
3. Use **More tools → Copy console snippet** or **Copy bookmarklet** to load the injector on the live Distractify / Cookie & Kate URLs.

## Control Panel Cheatsheet

- **Inject Ads** – Fetches creatives, cleans previous placements, and renders new ones with full telemetry (`script.js:1037`).
- **Target site select + Open selected site** – Jumps to either required article for quick testing.
- **Copy console snippet / bookmarklet** – Ships the script to any page without manual typing (`script.js:662` and `script.js:675`).
- **Reset sticky dismissal** – Clears the session preference so sticky ads render again after being closed.
- **Show debug log** – Toggles the instrumentation overlay (`script.js:703`).

Statuses surface in the panel footer and use semantic colours to differentiate success/errors.

## Placement Details

- **Fetch & decode** – `fetchCreatives` guards against timeouts and malformed JSON; `decodeMarkup` handles non-ASCII creatives (`script.js:993`, `script.js:740`).
- **Middle ads** – The injector finds article-like containers, picks the midpoint block/paragraph, and repositions via a MutationObserver if the DOM streams in late content (`script.js:908` – `script.js:969`).
- **Sticky ads** – Hosted in a dedicated viewport container with safe-area padding, close button, ESC support, and dismissal persistence (`script.js:794`, `script.js:806`, `script.js:832`).
- **Cleanup** – Every run disconnects observers, clears wrappers, and rebuilds state before injecting (`script.js:778`).

## Debug Console

Toggle the console from **More tools** to see:

- Run metrics (counts, repositioned middles, sticky dismissals).
- A chronological event log with JSON payloads.
- One-click close button to hide the overlay.

All telemetry can be trended in the browser console as well (`console.debug` calls).

## Manual Test Checklist

1. Load `index.html` and click **Inject Ads** – expect the status to report success and ads to render.
2. Close the sticky ad (× or `Esc`) – status notes the dismissal; injection now mentions that stickies are skipped until reset.
3. Hit **Reset sticky dismissal** and **Inject Ads** again – sticky returns as expected.
4. Toggle debug log – confirm fetch/ad placement events stream into the overlay.
5. Disconnect your network and run **Inject Ads** – expect a timeout error message and graceful recovery.

## Extending

- Add additional target presets by updating `CONFIG.targetSites` (`script.js:18`).
- Tailor anchoring rules for other publishers in `CONFIG.anchorSelectors`.
- Swap the API endpoint by editing `CONFIG.endpoint` (`script.js:7`).

The code is intentionally modular and documented so each change is straightforward to explain in an interview setting. Happy injecting! 🎯
