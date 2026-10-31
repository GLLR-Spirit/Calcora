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
  const objectMatch = source.match(/CALCORA_LOCALES\\.(?:fr|en|ar)=\\{([\\s\\S]*?)\\};/);
  assert.ok(objectMatch, language + ' locale source must contain a dictionary literal');
  const sourceKeys = [...objectMatch[1].matchAll(/(?:^|,)([A-Za-z_$][\\w$]*)\\s*:/g)].map(match => match[1]);
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
