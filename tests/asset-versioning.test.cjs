"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { versionAssetReferences, rewriteDirectory } = require("../scripts/version-static-assets.cjs");

test("versions local CSS and JavaScript references without changing external URLs", () => {
  const html = [
    '<link rel="stylesheet" href="assets/css/base.css">',
    '<script defer src="locales/fr.js"></script>',
    '<script src="../assets/js/app.js?v=old"></script>',
    '<script src="https://cdn.example.test/library.js"></script>',
    '<link rel="stylesheet" href="//cdn.example.test/theme.css">',
    '<a href="pages/about.html">About</a>'
  ].join("\n");

  const result = versionAssetReferences(html, "abcdef123456");
  assert.match(result, /assets\/css\/base\.css\?v=abcdef123456/);
  assert.match(result, /locales\/fr\.js\?v=abcdef123456/);
  assert.match(result, /\.\.\/assets\/js\/app\.js\?v=abcdef123456/);
  assert.match(result, /https:\/\/cdn\.example\.test\/library\.js/);
  assert.match(result, /\/\/cdn\.example\.test\/theme\.css/);
  assert.match(result, /pages\/about\.html/);
  assert.doesNotMatch(result, /old/);
});

test("versions runtime stylesheet paths stored in JavaScript strings", () => {
  const source = 'themeLink.href = "assets/css/theme-dark.css";';
  assert.equal(
    versionAssetReferences(source, "build-42"),
    'themeLink.href = "assets/css/theme-dark.css?v=build-42";'
  );
});

test("deployment rewrite scans HTML and JavaScript but skips tests and tooling", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "calcora-assets-"));
  try {
    fs.mkdirSync(path.join(root, "assets", "js"), { recursive: true });
    fs.mkdirSync(path.join(root, "tests"), { recursive: true });
    fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(root, "index.html"), '<script src="assets/js/app.js"></script>');
    fs.writeFileSync(path.join(root, "assets", "js", "app.js"), 'load("assets/css/theme-dark.css");');
    fs.writeFileSync(path.join(root, "tests", "fixture.js"), 'load("fixture.css");');
    fs.writeFileSync(path.join(root, "scripts", "tool.js"), 'load("tool.css");');

    const result = rewriteDirectory(root, "release-123");
    assert.equal(result.scanned, 2);
    assert.equal(result.changed, 2);
    assert.match(fs.readFileSync(path.join(root, "index.html"), "utf8"), /app\.js\?v=release-123/);
    assert.match(fs.readFileSync(path.join(root, "assets", "js", "app.js"), "utf8"), /theme-dark\.css\?v=release-123/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, "tests", "fixture.js"), "utf8"), /\?v=/);
    assert.doesNotMatch(fs.readFileSync(path.join(root, "scripts", "tool.js"), "utf8"), /\?v=/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rejects unsafe asset version values", () => {
  assert.throws(() => versionAssetReferences('load("app.js")', "bad version"), /Asset version/);
});

test("replaces an older release version instead of stacking query parameters", () => {
  const first = versionAssetReferences('<script src="app.js"></script>', "release-1");
  const second = versionAssetReferences(first, "release-2");
  assert.equal(second, '<script src="app.js?v=release-2"></script>');
});
