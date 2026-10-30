const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadMath(file, exportName) {
  const context = { window: {}, document: { querySelector: () => null, getElementById: () => null } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context, { filename: file });
  assert.ok(context.window[exportName], file + " should expose its pure calculation functions for tests");
  return context.window[exportName];
}

const measurement = loadMath("assets/js/measurement-tools.js", "CALCORA_MEASUREMENT_MATH");
const science = loadMath("assets/js/science-measurements.js", "CALCORA_SCIENCE_MATH");

test("measurement conversions handle normal, incompatible and overflowing values", () => {
  assert.equal(measurement.convert(1, "km", "m", "length"), 1000);
  assert.equal(measurement.convert(1, "h", "min", "time"), 60);
  assert.equal(measurement.convert(1, "kg", "m", "length"), null);
  assert.equal(measurement.convert(Number.MAX_VALUE, "km", "mm", "length"), null);
});

test("duration helpers handle midnight, day rollover and invalid input", () => {
  assert.deepEqual({ ...measurement.durationParts(90061) }, { sign: "", days: 1, hours: 1, minutes: 1, seconds: 1 });
  assert.equal(measurement.elapsedSeconds("22:30", "01:15"), 9900);
  assert.equal(measurement.elapsedSeconds("25:00", "01:00"), null);
  assert.deepEqual({ ...measurement.addDuration("23:00", 5400) }, { time: "00:30:00", dayOffset: 1 });
  assert.equal(measurement.addDuration("12:00", -60), null);
});

test("perimeter, distance and travel-time functions reject invalid or non-finite results", () => {
  assert.equal(measurement.perimeter("square", 4), 16);
  assert.equal(measurement.perimeter("rectangle", 4, 3), 14);
  assert.equal(measurement.perimeter("circle", 1), 2 * Math.PI);
  assert.equal(measurement.perimeter("square", 0), null);
  assert.equal(measurement.perimeter("circle", 1e308), null);
  assert.equal(measurement.distance2D(0, 0, 3, 4), 5);
  assert.equal(measurement.distance2D(0, 0, Infinity, 4), null);
  assert.equal(measurement.distance2D(-1e308, 0, 1e308, 0), null);
  assert.equal(measurement.travelTime(1000, 5), 200);
  assert.equal(measurement.travelTime(1000, 0), null);
  assert.equal(measurement.travelTime(1e308, 1e-308), null);
});

test("science area and volume functions validate dimensions and overflow", () => {
  assert.equal(science.area("square", 4), 16);
  assert.equal(science.area("rectangle", 4, 3), 12);
  assert.equal(science.area("circle", 1), Math.PI);
  assert.equal(science.area("rectangle", 4, 0), null);
  assert.equal(science.area("square", 1e308), null);
  assert.equal(science.volume("cube", 3), 27);
  assert.equal(science.volume("box", 3, 2, 4), 24);
  assert.equal(science.volume("cylinder", 2, 5), 20 * Math.PI);
  assert.equal(science.volume("box", 2, 0, 4), null);
  assert.equal(science.volume("cube", 1e200), null);
});

test("science motion functions handle zero, reverse motion and overflow", () => {
  assert.equal(science.speed(1000, 200), 5);
  assert.equal(science.speed(0, 2), 0);
  assert.equal(science.speed(10, 0), null);
  assert.equal(science.speed(1e308, 1e-308), null);
  assert.equal(science.acceleration(0, 20, 4), 5);
  assert.equal(science.acceleration(20, 0, 4), -5);
  assert.equal(science.acceleration(0, 20, 0), null);
  assert.equal(science.acceleration(-1e308, 1e308, 1), null);
});

test("every calculator HTML page has a unique title, description and canonical URL", () => {
  const root = path.join(__dirname, "..");
  const base = "https://gllr-spirit.github.io/Calcora/";
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : entry.isFile() && entry.name.endsWith(".html") ? [full] : [];
    });
  }
  const pages = walk(path.join(root, "calculators"));
  assert.ok(pages.length >= 9, "calculator pages should be included in the SEO audit");
  for (const file of pages) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    const html = fs.readFileSync(file, "utf8");
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
    const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1]?.trim();
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
    const expected = base + (relative.endsWith("/index.html") ? relative.slice(0, -10) : relative);
    assert.ok(title, relative + " needs a document title");
    assert.ok(description, relative + " needs a meta description");
    assert.equal(canonical, expected, relative + " needs its own canonical URL");
    assert.match(html, /property=["']og:title["']/, relative + " needs Open Graph title metadata");
    assert.match(html, /property=["']og:description["']/, relative + " needs Open Graph description metadata");
  }
});

test("shared calculator locales contain the same keys and every page key is translated", () => {
  const localeFiles = ["en", "fr", "ar"].map(code => fs.readFileSync(path.join(__dirname, "..", "locales", code + ".js"), "utf8"));
  const keySets = localeFiles.map(source => {
    const match = source.match(/CALCORA_LOCALES\.(?:en|fr|ar)=\{([\s\S]*?)\};/);
    assert.ok(match, "locale dictionary should be present");
    return [...match[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)].map(item => item[1]).sort();
  });
  assert.deepEqual(keySets[1], keySets[0], "French locale keys should match English");
  assert.deepEqual(keySets[2], keySets[0], "Arabic locale keys should match English");
  for (const file of ["calculators/grades/average.html", "calculators/math/percentage.html", "calculators/conversions/units.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    for (const [, key] of html.matchAll(/data-i18n=["']([^"']+)["']/g)) {
      assert.ok(keySets.every(keys => keys.includes(key)), file + " has an untranslated key: " + key);
    }
    assert.match(html, /id=["']language-select["'][^>]*aria-label=["']Language["']/, file + " needs an accessible language selector");
    assert.match(html, /id=["']theme-toggle["'][^>]*aria-label=["']Toggle theme["']/, file + " needs an accessible theme control");
  }
});


test("calculator form controls have accessible names and result regions announce updates", () => {
  const root = path.join(__dirname, "..");
  const calculatorRoot = path.join(root, "calculators");
  function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : entry.isFile() && entry.name.endsWith(".html") ? [full] : [];
    });
  }
  for (const file of walk(calculatorRoot)) {
    const relative = path.relative(root, file).split(path.sep).join("/");
    const html = fs.readFileSync(file, "utf8");
    const explicitLabels = new Set([...html.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["'][^>]*>/gi)].map(match => match[1]));
    const wrappedControls = new Set();
    for (const match of html.matchAll(/<label\b[^>]*>([\s\S]*?)<\/label>/gi)) {
      for (const control of match[1].matchAll(/<(?:input|select|textarea)\b([^>]*)>/gi)) {
        const id = control[1].match(/\bid=["']([^"']+)["']/i)?.[1];
        if (id) wrappedControls.add(id);
      }
    }
    for (const control of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
      const attrs = control[2];
      const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
      const hasAriaName = /\baria-label=["'][^"']+["']/i.test(attrs) || /\baria-labelledby=["'][^"']+["']/i.test(attrs);
      const hasLabel = id && (explicitLabels.has(id) || wrappedControls.has(id));
      assert.ok(hasAriaName || hasLabel, relative + " contains an input/select/textarea without an accessible name: " + control[0]);
    }
    for (const result of html.matchAll(/<[^>]+class=["'][^"']*\bresult\b[^"']*["'][^>]*>/gi)) {
      assert.match(result[0], /\brole=["']status["']/i, relative + " result region needs role=status");
      assert.match(result[0], /\baria-live=["']polite["']/i, relative + " result region needs polite announcements");
    }
  }
});
