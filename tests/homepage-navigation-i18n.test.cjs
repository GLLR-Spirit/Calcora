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
    assert.match(html, /calcora-theme/, `${file}: shared theme preference missing`);\n    assert.match(html, /href=\"\\.\\.\\/favicon\\.svg\"/, `${file}: favicon reference missing`);\n    assert.match(html, /themeToDark|themeToLight/, `${file}: translated theme labels missing`);
  }
});

\ntest('homepage locale dictionaries have matching keys and localized control labels', () => {
  const locales = ['en', 'fr', 'ar'].map(language =>
    loadLocale(read(`locales/${language}.js`))[language]
  );
  const keys = Object.keys(locales[0]).sort();
  for (const locale of locales) {
    assert.deepEqual(Object.keys(locale).sort(), keys);
    for (const key of ['languageLabel', 'themeToDark', 'themeToLight']) {
      assert.equal(typeof locale[key], 'string');
      assert.ok(locale[key].trim().length > 0);
    }
  }
});

test('information-page translations cover every visible data key', () => {
  for (const file of ['pages/about.html', 'pages/contact.html', 'pages/privacy.html']) {
    const html = read(file);
    const script = html.match(/const copy=(\\{[\\s\\S]*?\\});\\nconst themeButton/);
    assert.ok(script, `${file}: translation dictionary not found`);
    const copy = vm.runInNewContext('(' + script[1] + ')');
    const keys = [...html.matchAll(/data-t="([^"]+)"/g)].map(match => match[1]);
    for (const language of ['en', 'fr', 'ar']) {
      for (const key of keys) {
        assert.equal(typeof copy[language][key], 'string', `${file}: missing ${language} translation ${key}`);
        assert.ok(copy[language][key].trim().length > 0, `${file}: empty ${language} translation ${key}`);
      }
    }
  }
});

test('FAQ exposes a favicon and localized theme labels', () => {
  const html = read('pages/faq.html');
  const script = read('assets/js/faq.js');
  assert.match(html, /href="\\.\\.\\/favicon\\.svg"/);
  assert.match(html, /id="language-select"/);
  assert.match(html, /id="theme-toggle"/);
  for (const label of ['themeToDark', 'themeToLight']) assert.ok(script.includes(label));
});

test('homepage and discovery controls include mobile and reduced-motion styles', () => {
  const css = read('assets/css/base.css');
  assert.match(css, /@media\\(max-width:560px\\)/);
  assert.match(css, /@media\\(max-width:760px\\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  const discovery = read('assets/js/discovery.js');
  for (const label of ['categoriesAria', 'Catégories de calculatrices', 'فئات الحاسبات']) {
    assert.ok(discovery.includes(label), `Missing localized discovery label: ${label}`);
  }
});
