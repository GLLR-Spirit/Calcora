const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("assets/js/exam-planner.js", "utf8");
const start = source.indexOf("function validDate(value){");
const end = source.indexOf("\nfunction dateDiff(", start);
assert.ok(start >= 0 && end > start, "Exam planner date validator must remain independently testable");
const sandbox = {};
vm.runInNewContext(source.slice(start, end) + "\nglobalThis.validDate = validDate;", sandbox);

test("exam planner accepts valid ISO dates and leap days", () => {
  assert.equal(sandbox.validDate("2024-02-29"), true);
  assert.equal(sandbox.validDate("2026-10-23"), true);
});

test("exam planner rejects impossible dates and malformed date strings", () => {
  for (const value of ["2026-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "2026-01-00", "23-10-2026", "", null]) {
    assert.equal(sandbox.validDate(value), false, String(value));
  }
});

test("exam backup import has file-size and record-count limits", () => {
  assert.match(source, /file\.size>2\*1024\*1024/);
  assert.match(source, /incoming\.length>500/);
  assert.match(source, /typeof x\.name!=="string"\|\|!x\.name\.trim\(\)/);
});

test("exam backup import validates dates and restores prior in-memory data on storage failure", () => {
  assert.match(source, /!validDate\(x\.date\)/);
  assert.match(source, /if\(!name\|\|!validDate\(date\)\)/);
  assert.match(source, /const previous=items;items=incoming\.map/);
  assert.match(source, /if\(!save\(\)\)\{items=previous;throw Error\("storage"\)\}/);
});

test("exam backup import still accepts the versioned object and legacy array formats", () => {
  assert.match(source, /Array\.isArray\(parsed\)\?parsed:parsed\.exams/);
  assert.match(source, /calcora-exams-backup\.json/);
});
