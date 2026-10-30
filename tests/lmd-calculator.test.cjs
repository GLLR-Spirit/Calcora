const assert = require("node:assert/strict");
const test = require("node:test");
const { average, calculate } = require("../assets/js/lmd-math.js");

const row = (overrides = {}) => ({
  name: "Analysis", ue: "UE1", semester: "S1",
  cc: "12", exam: "16", ccW: "1", examW: "2",
  mc: "2", uc: "3", credits: "6", ...overrides
});

test("LMD assessment and module averages use configurable assessment weights", () => {
  const result = calculate([row()]);
  assert.equal(result.valid, true);
  assert.equal(result.modules[0].average, 44 / 3);
  assert.equal(result.units[0].average, 44 / 3);
  assert.equal(result.semesterAverages.S1, 44 / 3);
  assert.equal(result.semesterAverages.S2, null);
  assert.equal(result.annual, 44 / 3);
});

test("LMD aggregates multiple modules, teaching units and semesters", () => {
  const result = calculate([
    row({ name: "Analysis", ue: "UE1", semester: "S1", cc: "10", exam: "14", mc: "2", uc: "3", credits: "6" }),
    row({ name: "Algebra", ue: "UE1", semester: "S1", cc: "16", exam: "18", mc: "1", uc: "3", credits: "6" }),
    row({ name: "Physics", ue: "UE2", semester: "S1", cc: "12", exam: "12", mc: "1", uc: "1", credits: "4" }),
    row({ name: "Programming", ue: "UE3", semester: "S2", cc: "14", exam: "16", mc: "1", uc: "2", credits: "5" })
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.units.length, 3);
  assert.equal(result.semesterAverages.S1, 13.666666666666666);
  assert.equal(result.semesterAverages.S2, 46 / 3);
  assert.equal(result.annual, 14.222222222222221);
  assert.equal(result.earnedECTS, 15);
  assert.equal(result.totalECTS, 15);
});

test("LMD supports a single assessment when its weight is positive", () => {
  const result = calculate([row({ cc: "", exam: "15", ccW: "0", examW: "2" })]);
  assert.equal(result.valid, true);
  assert.equal(result.modules[0].average, 15);
});

test("LMD marks invalid, blank, out-of-range and zero-weight rows as invalid", () => {
  assert.equal(calculate([]).reason, "empty");
  assert.equal(calculate([row({ cc: "", exam: "" })]).valid, false);
  assert.equal(calculate([row({ cc: "21" })]).valid, false);
  assert.equal(calculate([row({ cc: "-1" })]).valid, false);
  assert.equal(calculate([row({ cc: "", exam: "15", ccW: "0", examW: "0" })]).valid, false);
  assert.equal(calculate([row({ mc: "0" })]).valid, false);
  assert.equal(calculate([row({ uc: "-1" })]).valid, false);
  assert.equal(calculate([row({ credits: "-1" })]).valid, false);
  assert.equal(calculate([row({ semester: "S3" })]).valid, false);
  assert.equal(calculate([row({ name: "" })]).valid, false);
});

test("LMD validates the pass threshold and rejects non-finite input", () => {
  assert.equal(calculate([row()], "").valid, false);
  assert.equal(calculate([row()], "20.1").valid, false);
  assert.equal(calculate([row({ exam: "Infinity" })]).valid, false);
  assert.equal(calculate([row({ examW: "NaN" })]).valid, false);
  assert.equal(calculate([row({ mc: String(Number.MAX_VALUE) })]).valid, false);
  assert.equal(calculate([row({ examW: String(Number.MAX_VALUE), ccW: String(Number.MAX_VALUE) })]).valid, false);
});

test("LMD reports differing UE coefficients and ECTS values without silently changing the first value", () => {
  const result = calculate([
    row({ name: "Analysis", cc: "12", exam: "14", uc: "3", credits: "6" }),
    row({ name: "Algebra", cc: "14", exam: "16", uc: "4", credits: "5" })
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.coefficientConflict, true);
  assert.equal(result.creditConflict, true);
  assert.equal(result.units[0].coefficient, 3);
  assert.equal(result.units[0].credits, 6);
  assert.equal(result.totalECTS, 6);
});

test("LMD credits are awarded only when the UE reaches the selected threshold", () => {
  const result = calculate([
    row({ name: "Analysis", cc: "8", exam: "9", credits: "6" }),
    row({ name: "Physics", ue: "UE2", cc: "12", exam: "14", credits: "4" })
  ], 10);
  assert.equal(result.valid, true);
  assert.equal(result.units[0].earned, 0);
  assert.equal(result.units[1].earned, 4);
  assert.equal(result.earnedECTS, 4);
});

test("weighted average rejects invalid weights and arithmetic overflow", () => {
  assert.equal(average([]), null);
  assert.equal(average([{ value: 10, weight: 0 }]), null);
  assert.equal(average([{ value: Infinity, weight: 1 }]), null);
  assert.equal(average([{ value: Number.MAX_VALUE, weight: 2 }]), null);
});
