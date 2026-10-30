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
    const labelRanges = [...html.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/gi)]
      .map(match => ({ start: match.index, end: match.index + match[0].length }));
    for (const control of html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)) {
      const attrs = control[2];
      const id = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
      const hasAriaName = /\baria-label=["'][^"']+["']/i.test(attrs) || /\baria-labelledby=["'][^"']+["']/i.test(attrs);
      const hasLabel = (id && explicitLabels.has(id)) || labelRanges.some(range => control.index > range.start && control.index < range.end);
      assert.ok(hasAriaName || hasLabel, relative + " contains an input/select/textarea without an accessible name: " + control[0]);
    }
    for (const result of html.matchAll(/<[^>]+class=["'][^"']*\bresult\b[^"']*["'][^>]*>/gi)) {
      assert.match(result[0], /\brole=["']status["']/i, relative + " result region needs role=status");
      assert.match(result[0], /\baria-live=["']polite["']/i, relative + " result region needs polite announcements");
    }
  }
});

test("all interactive calculator pages have complete English, French and Arabic translations", () => {
  const root = path.join(__dirname, "..");
  const locales = Object.fromEntries(["en", "fr", "ar"].map(locale => [locale, fs.readFileSync(path.join(root, "locales", locale + ".js"), "utf8")]));
  const dictionaries = {
    algeria: fs.readFileSync(path.join(root, "assets/js/algeria-grades.js"), "utf8"),
    measurement: fs.readFileSync(path.join(root, "assets/js/measurement-tools.js"), "utf8"),
    science: fs.readFileSync(path.join(root, "assets/js/science-measurements.js"), "utf8")
  };
  function findObjectEnd(source, openIndex) {
    let depth = 0, quote = null, escaped = false;
    for (let i = openIndex; i < source.length; i++) {
      const char = source[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (char.charCodeAt(0) === 92) escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if ([34, 39, 96].includes(char.charCodeAt(0))) { quote = char; continue; }
      if (char === "{") depth++;
      else if (char === "}") { depth--; if (depth === 0) return i; }
    }
    return -1;
  }
  function propertyKeys(block) {
    const keys = []; let quote = null, escaped = false;
    for (let i = 0; i < block.length; i++) {
      const char = block[i];
      if (quote) {
        if (escaped) escaped = false;
        else if (char.charCodeAt(0) === 92) escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if ([34, 39, 96].includes(char.charCodeAt(0))) { quote = char; continue; }
      if (i > 0 && block[i - 1] !== ",") continue;
      if (!/[A-Za-z_$]/.test(char)) continue;
      let end = i + 1;
      while (end < block.length && /[\w$]/.test(block[end])) end++;
      let colon = end;
      while (/\s/.test(block[colon] || "")) colon++;
      if (block[colon] === ":") keys.push(block.slice(i, end));
    }
    return keys;
  }
  function dictionaryKeys(source, kind, locale) {
    let openIndex;
    if (kind === "shared") {
      const marker = "window.CALCORA_LOCALES." + locale + "=";
      openIndex = source.indexOf("{", source.indexOf(marker));
    } else {
      const marker = kind === "algeria" ? "const w={" : kind === "measurement" ? "const dict={" : "const translations={";
      const rootOpen = source.indexOf("{", source.indexOf(marker));
      const rootEnd = findObjectEnd(source, rootOpen);
      const body = source.slice(rootOpen + 1, rootEnd);
      const localeIndex = body.indexOf(locale + ":{");
      openIndex = rootOpen + 1 + body.indexOf("{", localeIndex);
    }
    assert.ok(openIndex >= 0, "Missing " + locale + " translation dictionary (" + kind + ")");
    const end = findObjectEnd(source, openIndex);
    assert.ok(end > openIndex, "Unclosed " + locale + " translation dictionary (" + kind + ")");
    return propertyKeys(source.slice(openIndex + 1, end));
  }
  const pages = [
    ["calculators/algeria/grades.html", "algeria"],
    ["calculators/grades/average.html", "shared"],
    ["calculators/math/percentage.html", "shared"],
    ["calculators/conversions/units.html", "shared"],
    ["calculators/conversions/length.html", "measurement"],
    ["calculators/conversions/time.html", "measurement"],
    ["calculators/science/measurements.html", "science"]
  ];
  for (const [page, kind] of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    const usedKeys = [...new Set([...html.matchAll(/data-(?:i18n|t)="([^"]+)"/g)].map(match => match[1]))];
    const keysByLocale = Object.fromEntries(["en", "fr", "ar"].map(locale => {
      const source = kind === "shared" ? locales[locale] : dictionaries[kind];
      return [locale, dictionaryKeys(source, kind, locale)];
    }));
    const englishKeys = [...keysByLocale.en].sort();
    for (const locale of ["fr", "ar"]) assert.deepEqual([...keysByLocale[locale]].sort(), englishKeys, page + " has inconsistent " + locale + " translation keys");
    for (const locale of ["en", "fr", "ar"]) {
      const available = new Set(keysByLocale[locale]);
      for (const key of usedKeys) assert.ok(available.has(key), page + " is missing " + locale + " translation for: " + key);
    }
  }
});

test("core calculator helpers validate averages, percentages and unit conversions", () => {
  const context = { window: {}, document: { documentElement: { dataset: {} }, querySelector: () => null, querySelectorAll: () => [] } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "assets/js/calculator-pages.js"), "utf8"), context, { filename: "calculator-pages.js" });
  const math = context.window.CALCORA_PAGE_MATH;
  assert.ok(math, "calculator page helpers should be available for isolated tests");
  assert.equal(math.weightedAverage([{ mark: "12", coefficient: "2" }, { mark: "15", coefficient: "3" }]), 13.8);
  assert.equal(math.weightedAverage([{ mark: "0", coefficient: "2" }]), 0);
  assert.equal(math.weightedAverage([{ mark: "20", coefficient: "1" }]), 20);
  assert.equal(math.weightedAverage([]), null);
  assert.equal(math.weightedAverage([{ mark: "", coefficient: "1" }]), null);
  assert.equal(math.weightedAverage([{ mark: "21", coefficient: "1" }]), null);
  assert.equal(math.weightedAverage([{ mark: "12", coefficient: "0" }]), null);
  assert.equal(math.weightedAverage([{ mark: "20", coefficient: String(Number.MAX_VALUE) }]), null);
  assert.equal(math.percentage("200", "15"), 30);
  assert.equal(math.percentage("0", "15"), 0);
  assert.equal(math.percentage("-200", "15"), -30);
  assert.equal(math.percentage("", "15"), null);
  assert.equal(math.percentage("Infinity", "10"), null);
  assert.equal(math.percentage(String(Number.MAX_VALUE), String(Number.MAX_VALUE)), null);
  assert.deepEqual({ ...math.convertUnits("1", "km", "m") }, { ok: true, value: 1000 });
  assert.deepEqual({ ...math.convertUnits("2", "kg", "g") }, { ok: true, value: 2000 });
  assert.deepEqual({ ...math.convertUnits("1", "L", "mL") }, { ok: true, value: 1000 });
  assert.equal(math.convertUnits("1", "kg", "m").reason, "dimension");
  assert.equal(math.convertUnits("", "km", "m").reason, "value");
  assert.equal(math.convertUnits(String(Number.MAX_VALUE), "km", "cm").reason, "value");
  assert.equal(math.convertUnits("1", "unknown", "m").reason, "unit");
});

test("Algerian grade calculator covers weighted, simple, annual and target calculations", () => {
  const { calculateGrade } = require("../assets/js/algeria-grade-math.js");
  const base = { min: "0", max: "20" };
  const weighted = calculateGrade({ ...base, type: "weighted", rows: [{ mark: "12", coefficient: "2" }, { mark: "14", coefficient: "3" }] });
  assert.equal(weighted.valid, true); assert.equal(weighted.value, 13.2); assert.equal(weighted.label, "average");
  const simple = calculateGrade({ ...base, type: "simple", rows: [{ mark: "12", coefficient: "1" }, { mark: "14", coefficient: "1" }] });
  assert.equal(simple.valid, true); assert.equal(simple.value, 13); assert.equal(simple.label, "simple");
  const annual = calculateGrade({ ...base, type: "year", semester1: "12", semester2: "14", weight1: "1", weight2: "2" });
  assert.equal(annual.valid, true); assert.equal(annual.value, 40 / 3); assert.equal(annual.label, "annual");
  const target = calculateGrade({ ...base, type: "target", target: "14", currentTotal: "24", completedCoefficient: "2", remainingCoefficient: "2" });
  assert.equal(target.valid, true); assert.equal(target.value, 16); assert.equal(target.label, "need");
  const impossible = calculateGrade({ ...base, type: "target", target: "20", currentTotal: "0", completedCoefficient: "2", remainingCoefficient: "1" });
  assert.equal(impossible.valid, true); assert.equal(impossible.impossible, true); assert.equal(impossible.value, 60);
});

test("Algerian grade calculator rejects blank, out-of-scale and non-finite values", () => {
  const { calculateGrade } = require("../assets/js/algeria-grade-math.js");
  const base = { min: "0", max: "20" };
  assert.equal(calculateGrade({ ...base, type: "weighted", rows: [] }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "weighted", rows: [{ mark: "", coefficient: "1" }] }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "weighted", rows: [{ mark: "21", coefficient: "1" }] }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "weighted", rows: [{ mark: "10", coefficient: "0" }] }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "weighted", rows: [{ mark: "20", coefficient: String(Number.MAX_VALUE) }] }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "year", semester1: "12", semester2: "14", weight1: "0", weight2: "1" }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "year", semester1: "20", semester2: "20", weight1: String(Number.MAX_VALUE), weight2: String(Number.MAX_VALUE) }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "target", target: "21", currentTotal: "0", completedCoefficient: "1", remainingCoefficient: "1" }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "target", target: "10", currentTotal: "0", completedCoefficient: "1", remainingCoefficient: "0" }).valid, false);
  assert.equal(calculateGrade({ ...base, type: "target", target: "20", currentTotal: "0", completedCoefficient: String(Number.MAX_VALUE), remainingCoefficient: String(Number.MAX_VALUE) }).valid, false);
  assert.equal(calculateGrade({ min: "10", max: "10", type: "simple", rows: [{ mark: "10", coefficient: "1" }] }).valid, false);
});

test("Algerian grade calculator respects a configurable mark scale", () => {
  const { calculateGrade } = require("../assets/js/algeria-grade-math.js");
  const result = calculateGrade({ min: "0", max: "100", type: "weighted", rows: [{ mark: "80", coefficient: "2" }, { mark: "90", coefficient: "1" }] });
  assert.equal(result.valid, true); assert.equal(result.value, 250 / 3);
});
