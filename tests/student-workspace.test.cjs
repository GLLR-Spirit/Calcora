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

const plannerSource = fs.readFileSync("assets/js/university-planner.js", "utf8");
const numberParser = plannerSource.match(/n=v=>[^,]+/)?.[0];
const unitStart = plannerSource.indexOf("function unitResults(sem){");
const weightedStart = plannerSource.indexOf("function weighted(groups){", unitStart);
const renderStart = plannerSource.indexOf("function render(){", weightedStart);
assert.ok(numberParser && unitStart >= 0 && weightedStart > unitStart && renderStart > weightedStart,
  "University planner calculation functions must remain discoverable");
const plannerSandbox = { state: { modules: [] } };
vm.runInNewContext(
  "const " + numberParser + ";\n" +
  plannerSource.slice(unitStart, weightedStart) + "\n" +
  plannerSource.slice(weightedStart, renderStart) + "\n" +
  "globalThis.getUnitResults = unitResults; globalThis.weightGroups = weighted;",
  plannerSandbox
);

test("university planner calculates a coefficient-weighted average inside each UE", () => {
  plannerSandbox.state.modules = [
    { semester: "1", ue: "Math", mark: "10", moduleCoeff: "1", ueCoeff: "2" },
    { semester: "1", ue: "Math", mark: "16", moduleCoeff: "3", ueCoeff: "2" }
  ];
  const result = plannerSandbox.getUnitResults("1");
  assert.equal(result.length, 1);
  assert.equal(result[0].average, 14.5);
  assert.equal(result[0].coeff, 2);
});

test("university planner excludes blank marks from the UE average", () => {
  plannerSandbox.state.modules = [
    { semester: "1", ue: "Physics", mark: "12", moduleCoeff: "2", ueCoeff: "1" },
    { semester: "1", ue: "Physics", mark: "", moduleCoeff: "8", ueCoeff: "1" }
  ];
  const result = plannerSandbox.getUnitResults("1");
  assert.equal(result[0].average, 12);
});

test("university planner weights UE averages by UE coefficients", () => {
  assert.equal(plannerSandbox.weightGroups([
    { average: 10, coeff: 1 },
    { average: 16, coeff: 3 }
  ]), 14.5);
});

test("university planner separates semester calculations", () => {
  plannerSandbox.state.modules = [
    { semester: "1", ue: "A", mark: "10", moduleCoeff: "1", ueCoeff: "1" },
    { semester: "2", ue: "A", mark: "18", moduleCoeff: "1", ueCoeff: "1" }
  ];
  assert.equal(plannerSandbox.getUnitResults("1")[0].average, 10);
  assert.equal(plannerSandbox.getUnitResults("2")[0].average, 18);
});

test("target simulator formula gives the required mark for completed and remaining weights", () => {
  assert.match(source, /let need=\(g\*100-c\*d\)\/r/);
  const calculate = vm.runInNewContext("(g,c,d,r)=>(g*100-c*d)/r");
  assert.equal(calculate(12, 14, 60, 40), 9);
  assert.equal(calculate(12, 10, 60, 40), 15);
});

test("subject forecast formula handles remaining ungraded coefficient", () => {
  assert.match(source, /\(goal\*\(gradedWeight\+remainingWeight\)-gradedSum\)\/remainingWeight/);
  const calculate = vm.runInNewContext("(goal,gradedWeight,remainingWeight,gradedSum)=>(goal*(gradedWeight+remainingWeight)-gradedSum)/remainingWeight");
  assert.equal(calculate(12, 2, 3, 12), 16);
  assert.equal(calculate(12, 2, 3, 24), 12);
});
