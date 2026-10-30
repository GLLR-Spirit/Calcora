const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function loadLocale(code) {
  const context = { window: {} };
  vm.runInNewContext(code, context);
  return context.window.CALCORA_LOCALES;
}

test('homepage translation keys exist in English, French and Arabic', () => {
  const html = read('index.html');
  const keys = new Set([
    ...[...html.matchAll(/data-i18n="([^"]+)"/g)].map(match => match[1]),
    ...[...html.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map(match => match[1])
  ]);
  for (const language of ['en', 'fr', 'ar']) {
    const locale = loadLocale(read(`locales/${language}.js`))[language];
    for (const key of keys) {
      assert.equal(typeof locale[key], 'string', `Missing ${language} translation: ${key}`);
      assert.ok(locale[key].trim().length > 0, `Empty ${language} translation: ${key}`);
    }
  }
});

test('homepage internal links resolve to existing files or anchors', () => {
  const html = read('index.html');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const hrefs = [...html.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]);
  for (const href of hrefs) {
    if (/^(https?:|mailto:|tel:|javascript:)/i.test(href)) continue;
    if (href.startsWith('#')) {
      assert.ok(ids.has(href.slice(1)), `Missing homepage anchor: ${href}`);
      continue;
    }
    const target = href.split('#')[0].split('?')[0];
    if (!target) continue;
    const absolute = path.resolve(root, target);
    assert.ok(absolute.startsWith(root + path.sep), `Link escapes repository: ${href}`);
    assert.ok(fs.existsSync(absolute), `Missing homepage target: ${href}`);
  }
});

test('homepage exposes accessible primary navigation and search', () => {
  const html = read('index.html');
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main id="main-content"/);
  assert.match(html, /<nav class="site-nav" aria-label="Main navigation"/);
  assert.match(html, /<label class="visually-hidden" for="tool-search"/);
  assert.match(html, /<select id="language-select"/);
  assert.match(html, /<button id="theme-toggle"/);
  assert.equal((html.match(/\bid="tool-search"/g) || []).length, 1);
});

test('information pages expose language and theme controls with RTL support', () => {
  for (const file of ['pages/about.html', 'pages/contact.html', 'pages/privacy.html']) {
    const html = read(file);
    assert.match(html, /id="language-select"/, `${file}: language selector missing`);
    assert.match(html, /id="theme-toggle"/, `${file}: theme toggle missing`);
    assert.match(html, /lang==="ar"\?"rtl":"ltr"/, `${file}: Arabic RTL handling missing`);
    assert.match(html, /calcora-theme/, `${file}: shared theme preference missing`);
  }
});
