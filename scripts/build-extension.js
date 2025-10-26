#!/usr/bin/env node
/**
 * Copies the canonical `script.js` bundle into the extension directory so it
 * can be exposed as a web accessible resource.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const source = path.join(projectRoot, "script.js");
const destination = path.join(projectRoot, "extension", "script.js");

fs.copyFileSync(source, destination);
console.log(`Copied ${path.relative(projectRoot, source)} -> ${path.relative(projectRoot, destination)}`);
