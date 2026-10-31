"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { calculateGrade } = require("../assets/js/algeria-grade-math.js");
const { calculateForecast } = require("../assets/js/bac-simulator.js");

const base = { min: 0, max: 20 };
const weighted = (rows) => calculateGrade({ ...base, type: "weighted", rows });
const simple = (rows) => calculateGrade({ ...base, type: "simple", rows });
const annual = (semester1, semester2, weight1 = 1, weight2 = 1) =>
  calculateGrade({ ...base, type: "year", semester1, semester2, weight1, weight2 });
const target = (goal, currentTotal, completedCoefficient, remainingCoefficient) =>
  calculateGrade({ ...base, type: "target", target: goal, currentTotal, completedCoefficient, remainingCoefficient });

test("G01 — weighted average: 12×2 and 14×3 = 13.20", () => {
  const result = weighted([{ mark: 12, coefficient: 2 }, { mark: 14, coefficient: 3 }]);
  assert.equal(result.valid, true);
  assert.equal(result.value, 13.2);
  assert.equal(result.label, "average");
});

test("G02 — simple average: 8, 12 and 16 = 12", () => {
  const result = simple([{ mark: 8, coefficient: 1 }, { mark: 12, coefficient: 1 }, { mark: 16, coefficient: 1 }]);
  assert.equal(result.valid, true);
  assert.equal(result.value, 12);
  assert.equal(result.label, "simple");
});

test("G03 — annual weighted average: 12×1 and 14×2 = 13.333…", () => {
  const result = annual(12, 14, 1, 2);
  assert.equal(result.valid, true);
  assert.ok(Math.abs(result.value - 40 / 3) < 1e-12);
  assert.equal(result.label, "annual");
});

test("G04 — negative required mark means the target is already reached", () => {
  const result = target(10, 108, 9, 1);
  assert.equal(result.valid, true);
  assert.equal(result.value, -8);
  assert.equal(result.status, "alreadyReached");
  assert.equal(result.alreadyReached, true);
  assert.equal(result.impossible, false);
});

test("G05 — reachable target returns the required mark", () => {
  const result = target(12, 90, 8, 2);
  assert.equal(result.valid, true);
  assert.equal(result.value, 15);
  assert.equal(result.status, "need");
  assert.equal(result.impossible, false);
});

test("G06 — required mark above the maximum is impossible", () => {
  const result = target(14, 90, 8, 2);
  assert.equal(result.valid, true);
  assert.equal(result.value, 25);
  assert.equal(result.status, "impossible");
  assert.equal(result.impossible, true);
});

test("regression — target calculator preserves zero and boundary cases", () => {
  const achieved = target(10, 111, 10, 1);
  assert.equal(achieved.status, "alreadyReached");
  const exactMaximum = target(10, 80, 8, 2);
  assert.equal(exactMaximum.status, "need");
  assert.equal(exactMaximum.value, 10);
  const impossibleAtBoundary = target(10, 60, 8, 2);
  assert.equal(impossibleAtBoundary.status, "need");
  assert.equal(impossibleAtBoundary.value, 20);
});

test("regression — weighted, simple and annual modes remain unchanged", () => {
  assert.equal(weighted([{ mark: 12, coefficient: 2 }, { mark: 14, coefficient: 3 }]).value, 13.2);
  assert.equal(simple([{ mark: 8, coefficient: 1 }, { mark: 12, coefficient: 1 }, { mark: 16, coefficient: 1 }]).value, 12);
  assert.ok(Math.abs(annual(12, 14, 1, 2).value - 40 / 3) < 1e-12);
});

test("education profile pages load the shared calculator before their UI script", () => {
  const pages = [
    "primary", "middle-school", "high-school", "bac", "university", "work"
  ];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(__dirname, "..", "education-levels", page, "index.html"), "utf8");
    const shared = html.indexOf('src="../../assets/js/algeria-grade-math.js"');
    const profile = html.indexOf('src="../../assets/js/education-profile.js"');
    assert.ok(shared >= 0 && profile > shared, page + " must load shared math before profile UI");
  }
});

test("education profile delegates target classification to shared math and localizes achieved status", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "assets/js/education-profile.js"), "utf8");
  assert.match(source, /CALCORA_ALGERIA_GRADE_MATH\.calculateGrade/);
  assert.match(source, /targetResult\.status==="alreadyReached"/);
  assert.match(source, /targetResult\.status==="impossible"/);
  for (const translation of ["The target has already been reached", "L’objectif est déjà atteint", "تم بلوغ الهدف بالفعل"]) {
    assert.ok(source.includes(translation), "Missing localized message: " + translation);
  }
});

test("Algerian grade page displays the already-reached state in all three languages", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "assets/js/algeria-grades.js"), "utf8");
  assert.match(source, /result\.status==="alreadyReached"/);
  assert.match(source, /result\.status==="impossible"/);
  for (const translation of ["The target has already been reached", "L’objectif est déjà atteint", "تم بلوغ الهدف بالفعل"]) {
    assert.ok(source.includes(translation), "Missing localized message: " + translation);
  }
});


test("edge cases — reject zero, negative, blank and non-finite weighted coefficients", () => {
  for (const coefficient of [0, -1, "", "   ", null, undefined, NaN, Infinity, "not-a-number"]) {
    const result = weighted([{ mark: 12, coefficient }]);
    assert.equal(result.valid, false, "coefficient should be rejected: " + String(coefficient));
  }
});

test("edge cases — reject blank marks and marks outside the configured scale", () => {
  for (const mark of ["", "   ", null, undefined, -0.01, 20.01, NaN, Infinity]) {
    assert.equal(weighted([{ mark, coefficient: 1 }]).valid, false, "mark should be rejected: " + String(mark));
  }
});

test("edge cases — accept marks at both scale limits", () => {
  assert.equal(weighted([{ mark: 0, coefficient: 1 }]).value, 0);
  assert.equal(weighted([{ mark: 20, coefficient: 1 }]).value, 20);
});

test("edge cases — annual calculation rejects invalid weights, blank periods and overflow", () => {
  for (const [a, b, wa, wb] of [
    ["", 12, 1, 1], [12, " ", 1, 1], [12, 14, 0, 1],
    [12, 14, -1, 1], [12, 14, 1, 0], [12, 14, Infinity, 1],
    [12, 14, 1e308, 1e308]
  ]) {
    assert.equal(annual(a, b, wa, wb).valid, false);
  }
  assert.equal(annual(0, 20, 1, 1).value, 10);
});

test("edge cases — target calculation rejects invalid coefficients and overflow", () => {
  for (const [done, remaining] of [[-1, 1], [1, 0], [1, -1], [NaN, 1], [1, Infinity], [1e308, 1e308]]) {
    assert.equal(target(10, 50, done, remaining).valid, false);
  }
  assert.equal(target(10, -1, 1, 1).valid, false);
  assert.equal(target(21, 10, 1, 1).valid, false);
});

test("rounding — calculations preserve precision and formatting is a presentation concern", () => {
  const result = annual(12, 14, 1, 2);
  assert.ok(Math.abs(result.value - 40 / 3) < 1e-12);
  assert.notEqual(result.value, 13.33);
  assert.equal(result.value.toFixed(2), "13.33");
});

test("BAC forecast — weighted average and required mark scenarios", () => {
  const result = calculateForecast([
    { name: "Math", mark: "12", coefficient: "2" },
    { name: "Physics", mark: "", coefficient: "3" }
  ], "14");
  assert.equal(result.valid, true);
  assert.equal(result.currentAverage, 12);
  assert.equal(result.requiredMark, 15.333333333333334);
  assert.equal(result.impossible, false);
});

test("BAC forecast — reject blank target, invalid coefficients, invalid marks and overflow", () => {
  const rows = [{ name: "Math", mark: "12", coefficient: "1" }];
  for (const goal of ["", " ", null, undefined, NaN, Infinity, -1, 21]) {
    assert.equal(calculateForecast(rows, goal).valid, false, "goal should be rejected: " + String(goal));
  }
  for (const coefficient of ["", " ", null, 0, -1, NaN, Infinity]) {
    assert.equal(calculateForecast([{ name: "Math", mark: "12", coefficient }], 10).valid, false);
  }
  assert.equal(calculateForecast([{ name: "Math", mark: " ", coefficient: 1 }], 10).valid, true);
  assert.equal(calculateForecast([{ name: "Math", mark: "21", coefficient: 1 }], 10).valid, false);
  assert.equal(calculateForecast([
    { name: "A", mark: "20", coefficient: 1e308 },
    { name: "B", mark: "20", coefficient: 1e308 }
  ], 10).valid, false);
});
