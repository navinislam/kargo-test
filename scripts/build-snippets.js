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
  // encodeURIComponent ensures special characters survive inside the URI.
  return `javascript:${encodeURIComponent(snippet).replace(/%20/g, "+")}`;
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
