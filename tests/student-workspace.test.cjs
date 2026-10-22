const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("assets/js/student-workspace.js", "utf8");
const numDeclaration = source.match(/const t=.*?num=v=>[^;]+;/s)?.[0];
const avgStart = source.indexOf("function avg(a){");
const avgEnd = source.indexOf("\nfunction fmt(", avgStart);
assert.ok(numDeclaration, "The production numeric parser must remain discoverable");
assert.ok(avgStart >= 0 && avgEnd > avgStart, "The production average function must remain discoverable");
const averageSource = source.slice(avgStart, avgEnd);
const sandbox = {};
vm.runInNewContext(numDeclaration + "\n" + averageSource + "\nglobalThis.calculateAverage = avg;", sandbox);
const average = (subjects) => sandbox.calculateAverage(subjects);

test("calculates a coefficient-weighted average", () => {
  assert.equal(average([
    { mark: "10", coefficient: "1" },
    { mark: "16", coefficient: "3" }
  ]), 14.5);
});

test("ignores subjects whose marks are blank", () => {
  assert.equal(average([
    { mark: "12", coefficient: "2" },
    { mark: "", coefficient: "8" }
  ]), 12);
});

test("accepts zero as a valid mark", () => {
  assert.equal(average([{ mark: "0", coefficient: "2" }]), 0);
});

test("ignores out-of-range marks and non-positive coefficients", () => {
  assert.equal(average([
    { mark: "21", coefficient: "2" },
    { mark: "-1", coefficient: "2" },
    { mark: "18", coefficient: "0" },
    { mark: "14", coefficient: "2" }
  ]), 14);
});

test("returns null when there are no valid graded subjects", () => {
  assert.equal(average([
    { mark: "", coefficient: "1" },
    { mark: "not-a-number", coefficient: "2" },
    { mark: "10", coefficient: "-1" }
  ]), null);
});

test("keeps search and semester filters separate from the stored subject collection", () => {
  assert.match(source, /const visible=items\.filter\(/);
  assert.match(source, /const query=\(\$\("#subject-search"\)\?\.value\|\|""\)/);
  assert.match(source, /const semester=\$\("#semester-filter"\)\?\.value\|\|"all"/);
  assert.match(source, /items\.filter\(x=>\(!query\|\|x\.name\.toLocaleLowerCase\(\)\.includes\(query\)\)/);
});

test("validates imported backup size and caps retained history", () => {
  assert.match(source, /a\.length>500/);
  assert.match(source, /d\.history\.length>500/);
  assert.match(source, /history=history\.slice\(-40\)/);
});
