"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { calculateGrade } = require("../assets/js/algeria-grade-math.js");

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
