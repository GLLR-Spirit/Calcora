const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const localeDir = path.join(__dirname, '..', 'locales');
const languages = ['fr', 'en', 'ar'];
const dictionaries = {};

for (const language of languages) {
  const source = fs.readFileSync(path.join(localeDir, language + '.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: language + '.js' });
  dictionaries[language] = context.window.CALCORA_LOCALES[language];
  const marker = "window.CALCORA_LOCALES." + language + "=";
  const open = source.indexOf("{", source.indexOf(marker));
  assert.ok(open >= 0, language + ' locale source must contain a dictionary literal');
  let quote = null, escaped = false, depth = 0, close = -1;
  for (let index = open; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char.charCodeAt(0) === 92) escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth++;
    else if (char === "}" && --depth === 0) { close = index; break; }
  }
  assert.ok(close > open, language + ' locale dictionary must close');
  const block = source.slice(open + 1, close);
  const sourceKeys = [];
  quote = null; escaped = false;
  for (let index = 0; index < block.length; index++) {
    const char = block[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char.charCodeAt(0) === 92) escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (index > 0 && block[index - 1] !== ",") continue;
    if (!/[A-Za-z_$]/.test(char)) continue;
    let end = index + 1;
    while (end < block.length && /[\\w$]/.test(block[end])) end++;
    let colon = end;
    while (/\\s/.test(block[colon] || "")) colon++;
    if (block[colon] === ":") sourceKeys.push(block.slice(index, end));
  }
  const duplicates = sourceKeys.filter((key, index) => sourceKeys.indexOf(key) !== index);
  assert.deepEqual(duplicates, [], language + ' locale must not declare duplicate keys');
  assert.ok(dictionaries[language] && typeof dictionaries[language] === 'object',
    language + ' locale must export an object');
}

const referenceKeys = Object.keys(dictionaries.fr).sort();
for (const language of languages) {
  const keys = Object.keys(dictionaries[language]).sort();
  assert.deepEqual(keys, referenceKeys, language + ' locale keys must match French');
  for (const [key, value] of Object.entries(dictionaries[language])) {
    assert.equal(typeof value, 'string', language + '.' + key + ' must be a string');
    assert.ok(value.trim().length > 0, language + '.' + key + ' must not be empty');
  }
}
console.log('Locale consistency: fr/en/ar keys and values are valid.');
