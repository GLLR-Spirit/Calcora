const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");

test("finance page exposes three calculators with accessible live result regions", () => {
  const html = fs.readFileSync("calculators/finance/index.html", "utf8");
  for (const id of ["simple-form", "compound-form", "loan-form"]) assert.match(html, new RegExp('id="' + id + '"'));
  for (const id of ["simple-result", "compound-result", "loan-result"]) {
    assert.match(html, new RegExp('id="' + id + '"[^>]*role="status"[^>]*aria-live="polite"'));
  }
  assert.match(html, /id="language-select"/);
  assert.match(html, /id="theme-toggle"/);
  assert.match(html, /rel="canonical"/);
  assert.match(html, /application\/ld\+json/);
});

test("finance page loads its pure math module before the UI controller", () => {
  const html = fs.readFileSync("calculators/finance/index.html", "utf8");
  assert.ok(html.indexOf("finance-math.js") < html.indexOf("finance-tools.js"));
});

test("finance translations include English, French and Arabic for every UI key", () => {
  const js = fs.readFileSync("assets/js/finance-tools.js", "utf8");
  for (const key of ["simpleTitle", "compoundTitle", "loanTitle", "principal", "annualRate", "invalid", "overflow", "payment", "total"]) {
    assert.match(js, new RegExp(key + ":"));
  }
  for (const language of ["en:", "fr:", "ar:"]) assert.ok(js.includes(language));
});
