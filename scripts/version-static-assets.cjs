#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const SKIP_DIRS = new Set([".git", "node_modules", "tests", "scripts", "artifacts"]);
const SCANNED_EXTENSIONS = new Set([".html", ".js"]);

function versionAssetReferences(source, version) {
  if (!/^[a-zA-Z0-9._-]+$/.test(version)) {
    throw new Error("Asset version must contain only letters, numbers, dots, underscores or hyphens.");
  }

  return source.replace(/(["'])(?!https?:|\/\/|data:|#)([^"'\\s]+?\\.(?:css|js))(?:\\?[^"']*)?\\1/g,
    (match, quote, assetPath) => {
      if (/^(?:data:|https?:|\/\/|mailto:|tel:|javascript:)/i.test(assetPath)) return match;
      return quote + assetPath + "?v=" + version + quote;
    });
}

function rewriteDirectory(root, version) {
  let changed = 0;
  let scanned = 0;

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) visit(path.join(directory, entry.name));
        continue;
      }
      if (!entry.isFile() || !SCANNED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

      const file = path.join(directory, entry.name);
      const original = fs.readFileSync(file, "utf8");
      const updated = versionAssetReferences(original, version);
      scanned += 1;
      if (updated !== original) {
        fs.writeFileSync(file, updated, "utf8");
        changed += 1;
      }
    }
  }

  visit(root);
  return { scanned, changed };
}

if (require.main === module) {
  const root = path.resolve(process.argv[2] || ".");
  const version = process.env.CALCORA_ASSET_VERSION || process.env.GITHUB_SHA;
  if (!version) {
    console.error("Set CALCORA_ASSET_VERSION or GITHUB_SHA before running asset versioning.");
    process.exit(1);
  }

  const result = rewriteDirectory(root, version.slice(0, 12));
  console.log("Static asset cache-busting: " + result.changed + " of " + result.scanned + " HTML/JS files updated (version " + version.slice(0, 12) + ").");
}

module.exports = { versionAssetReferences, rewriteDirectory };
