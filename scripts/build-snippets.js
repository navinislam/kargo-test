#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// Resolve paths relative to the project root.
const ROOT = path.resolve(__dirname, "..");
const SOURCE_PATH = path.join(ROOT, "script.js");
const DIST_DIR = path.join(ROOT, "dist");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readSource() {
  return fs.readFileSync(SOURCE_PATH, "utf8");
}

function buildConsoleSnippet(source) {
  const inlineGuard = "data-kargo-injector-inline";
  return `(() => {\n  const existing = document.querySelector('script[${inlineGuard}]');\n  if (existing) {\n    console.info('Kargo injector already inline.');\n    return;\n  }\n  const script = document.createElement('script');\n  script.type = 'text/javascript';\n  script.setAttribute('${inlineGuard}', 'true');\n  script.text = ${JSON.stringify(source)};\n  document.documentElement.appendChild(script);\n  script.remove();\n})();\n`;
}

function buildBookmarklet(snippet) {
  // The inline bookmarklet (70KB+) exceeds browser limits and gets blocked by security policies.`
  // Instead, create a tiny remote loader that fetches script.js from GitHub raw or CDN.

  // Option 1: GitHub raw URL (replace with actual repo URL)
  const remoteLoader = `javascript:(function(){var s=document.createElement('script');s.src='https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/script.js';s.onerror=function(){alert('Failed to load Kargo injector. Check the URL in build-snippets.js')};document.body.appendChild(s);})()`;

  // Option 2: If you don't have GitHub Pages, document the console snippet as primary method
  const fallbackMessage = `
BOOKMARKLET SIZE ISSUE:
The generated bookmarklet is ${snippet.length} characters (${Math.round(snippet.length/1024)}KB).
Browsers limit bookmarklets to ~2KB and block javascript: URLs when pasted in the address bar.

SOLUTION OPTIONS:
1. Use the console snippet (dist/console-snippet.js) - works reliably
2. Host script.js on GitHub Pages/CDN and update the remote loader below
3. Use index.html for local testing

REMOTE LOADER BOOKMARKLET (update YOUR_USERNAME/YOUR_REPO):
${remoteLoader}
`.trim();

  return fallbackMessage;
}

function writeArtifacts(snippet, bookmarklet) {
  ensureDir(DIST_DIR);
  fs.writeFileSync(path.join(DIST_DIR, "console-snippet.js"), snippet, "utf8");
  fs.writeFileSync(path.join(DIST_DIR, "bookmarklet.txt"), bookmarklet, "utf8");
}

function main() {
  const source = readSource();
  const snippet = buildConsoleSnippet(source);
  const bookmarklet = buildBookmarklet(snippet);
  writeArtifacts(snippet, bookmarklet);
  console.log("Generated dist/console-snippet.js and dist/bookmarklet.txt");
}

main();
