const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const guides = [
  ["calculators/grades/average.html", ["averageGuideTitle", "averageGuideFormula", "averageGuideExample", "averageGuideSteps", "averageGuideTip"]],
  ["calculators/math/percentage.html", ["percentageGuideTitle", "percentageGuideFormula", "percentageGuideExample", "percentageGuideSteps", "percentageGuideTip"]],
  ["calculators/conversions/units.html", ["unitsGuideTitle", "unitsGuideFormula", "unitsGuideExample", "unitsGuideSteps", "unitsGuideTip"]]
];

test("core calculators provide accessible worked examples and practical guidance in every supported locale", () => {
  const locales = Object.fromEntries(["en", "fr", "ar"].map(locale => [
    locale,
    fs.readFileSync(path.join(root, "locales", locale + ".js"), "utf8")
  ]));

  for (const [page, keys] of guides) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(html, /<details class="calculator-guide">[\s\S]*?<\/details>/, page + " should use a native expandable guide");
    for (const key of keys) {
      assert.match(html, new RegExp('data-i18n="' + key + '"'), page + " is missing guide key " + key);
      for (const locale of Object.keys(locales)) {
        assert.match(locales[locale], new RegExp("\\b" + key + "\\s*:"), locale + " is missing " + key);
      }
    }
    assert.ok(keys.length >= 5, page + " should explain the formula, example, steps and interpretation");
  }
});
