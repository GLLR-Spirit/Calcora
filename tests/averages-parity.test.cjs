const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { average } = require("../assets/js/lmd-math.js");

const cases = JSON.parse(fs.readFileSync(
  path.join(__dirname, "fixtures", "average-cases.json"), "utf8"
));

test("JavaScript averages match the shared Python/JavaScript reference cases", () => {
  for (const item of cases) {
    const entries = item.kind === "simple"
      ? item.values.map(value => ({ value, weight: 1 }))
      : item.values.map((value, index) => ({ value, weight: item.weights[index] }));
    const actual = average(entries);
    if (item.expected === null) {
      assert.equal(actual, null, item.name);
    } else {
      assert.ok(Math.abs(actual - Number(item.expected)) < 1e-10, item.name);
    }
  }
});
