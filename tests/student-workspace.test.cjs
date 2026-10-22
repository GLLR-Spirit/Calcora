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


test("target simulator identifies an already-achieved goal and impossible targets", () => {
  const need = (current, goal, done, remaining) => (goal * 100 - current * done) / remaining;
  assert.ok(need(20, 10, 60, 40) <= 0);
  assert.ok(need(18, 19, 80, 20) > 20);
  assert.equal(need(10, 12, 50, 50), 14);
  assert.match(source, /need<=0\?t\("already"\):need>20\?t\("impossible"\)/);
});

test("subject forecast rejects invalid goals and handles no remaining subjects", () => {
  assert.match(source, /goal<0\|\|goal>20/);
  assert.match(source, /remainingWeight<=0/);
  assert.match(source, /forecastNoRemaining/);
  assert.match(source, /forecastImpossible/);
});

test("complete JSON backup includes a version, goal, subjects and bounded history", () => {
  assert.match(source, /format:"calcora-student-workspace",version:2/);
  assert.match(source, /forecastGoal:\$\("#forecast-goal"\)\.value/);
  assert.match(source, /subjects:items,history:history\.slice\(-40\)/);
  assert.match(source, /d\.format==="calcora-student-workspace"&&Number\(d\.version\)>=2/);
});

test("import validation rejects too many subjects, invalid marks and invalid coefficients", () => {
  assert.match(source, /!Array\.isArray\(a\)\|\|a\.length>500/);
  assert.match(source, /Number\.isFinite\(Number\(x\.mark\)\)&&Number\(x\.mark\)>=0&&Number\(x\.mark\)<=20/);
  assert.match(source, /Number\.isFinite\(Number\(x\.coefficient\?\?1\)\)&&Number\(x\.coefficient\?\?1\)>0/);
  assert.match(source, /d\.history\.every\(validImportedSnapshot\)/);
});

test("complete backup import asks before replacing existing data and restores history", () => {
  assert.match(source, /confirm\(t\("fullBackupConfirm"\)\)/);
  assert.match(source, /items=nextItems;history=nextHistory/);
  assert.match(source, /localStorage\.setItem\(HKEY,JSON\.stringify\(history\)\)/);
  assert.match(source, /renderHistory\(\);renderDashboard\(\)/);
});

test("history restoration regenerates subject IDs and requires confirmation", () => {
  assert.match(source, /confirm\(t\("restoreConfirm"\)\)/);
  assert.match(source, /items=s\.subjects\.map\(x=>\(\{\.\.\.x,id:uid\(\)\}\)\)/);
});

test("university planner flags invalid marks and non-positive coefficients", () => {
  plannerSandbox.state.modules = [
    { semester: "1", ue: "Bad", mark: "21", moduleCoeff: "1", ueCoeff: "1" },
    { semester: "1", ue: "Bad", mark: "10", moduleCoeff: "0", ueCoeff: "1" }
  ];
  const result = plannerSandbox.getUnitResults("1");
  assert.equal(result[0].invalid, true);
  assert.equal(result[0].average, null);
});

test("student workspace provides Arabic RTL and the search/filter controls", () => {
  const html = fs.readFileSync("student-workspace.html", "utf8");
  assert.match(source, /ar:\{/);
  assert.match(source, /document\.documentElement\.dir=lang==="ar"\?"rtl":"ltr"/);
  assert.match(html, /id="language-select"/);
  assert.match(html, /id="subject-search"/);
  assert.match(html, /id="semester-filter"/);
});


test("CSV parser handles quoted commas, escaped quotes, and line breaks", () => {
  const start = source.indexOf("function parseCSV(text){");
  const end = source.indexOf("\nfunction avg(a){", start);
  assert.ok(start >= 0 && end > start, "CSV parser must exist in production source");
  const parserSource = source.slice(start, end);
  const sandbox = {};
  vm.runInNewContext(parserSource + "\nglobalThis.parseCSV = parseCSV;", sandbox);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.parseCSV('Subject,Mark,Coefficient,Semester\r\n"Math, Algebra",12,2,Semester 1\r\n"Say ""hello""",,1,Semester 2'))), [
    ["Subject", "Mark", "Coefficient", "Semester"],
    ["Math, Algebra", "12", "2", "Semester 1"],
    ['Say "hello"', "", "1", "Semester 2"]
  ]);
});

test("CSV import is enabled and maps the exported four-column format", () => {
  const html = fs.readFileSync("student-workspace.html", "utf8");
  assert.match(html, /accept="\.json,\.csv,application\/json,text\/csv"/);
  assert.match(source, /rows\.slice\(1\).*map\(r=>\(\{name:String\(r\[0\]\?\?""\),mark:String\(r\[1\]\?\?""\),coefficient:String\(r\[2\]\|\|"1"\),semester:\/2\\s\*\$\/\.test/);
});


test("student workspace calculates semester averages independently using weighted-average logic", () => {
  const subjects = [
    { mark: "10", coefficient: "1", semester: "1" },
    { mark: "16", coefficient: "3", semester: "1" },
    { mark: "8", coefficient: "2", semester: "2" },
    { mark: "", coefficient: "5", semester: "2" }
  ];
  assert.equal(average(subjects.filter(x => x.semester === "1")), 14.5);
  assert.equal(average(subjects.filter(x => x.semester === "2")), 8);
  assert.equal(average(subjects.filter(x => x.semester === "3")), null);
});

test("review dashboard sorts valid graded subjects by ascending mark and limits the list to three", () => {
  assert.match(source, /const graded=items\.filter\(x=>x\.name\.trim\(\).*?\.sort\(\(a,b\)=>num\(a\.mark\)-num\(b\.mark\)\)\.slice\(0,3\)/);
  assert.match(source, /Number\.isFinite\(num\(x\.mark\)\)&&num\(x\.mark\)>=0&&num\(x\.mark\)<=20/);
  assert.match(source, /Number\.isFinite\(num\(x\.coefficient\)\)&&num\(x\.coefficient\)>0/);
});

test("snapshot creation stores overall and semester averages from the captured subjects", () => {
  assert.match(source, /subjects:copy,average:avg\(copy\),sem1:avg\(copy\.filter\(x=>x\.semester==="1"\)\),sem2:avg\(copy\.filter\(x=>x\.semester==="2"\)\)/);
});

test("student backup validators reject malformed records before import", () => {
  const start = source.indexOf("function validImportedSubject(x){");
  const end = source.indexOf("\nfunction esc(v){", start);
  assert.ok(start >= 0 && end > start);
  const sandbox = {};
  vm.runInNewContext(source.slice(start, end) + "\nglobalThis.validSubject=validImportedSubject;globalThis.validSnapshot=validImportedSnapshot;", sandbox);
  assert.equal(sandbox.validSubject({name:"Math",mark:"0",coefficient:"1",semester:"1"}), true);
  assert.equal(sandbox.validSubject({name:"Math",mark:"21",coefficient:"1"}), false);
  assert.equal(sandbox.validSubject({name:"Math",mark:"10",coefficient:"0"}), false);
  assert.equal(sandbox.validSubject({name:"x".repeat(121),mark:"10",coefficient:"1"}), false);
  assert.equal(sandbox.validSnapshot({label:"Semester 1",timestamp:1,subjects:[{name:"Math",mark:"10",coefficient:"1"}]}), true);
  assert.equal(sandbox.validSnapshot({label:"Semester 1",timestamp:1,subjects:[{name:"Math",mark:"30",coefficient:"1"}]}), false);
  assert.match(source, /f\.size>2\*1024\*1024/);
});

test("university backup validator rejects invalid modules and oversized values", () => {
  const start = plannerSource.indexOf("function validImportedModule(m){");
  const end = plannerSource.indexOf("\nfunction f(v){", start);
  assert.ok(start >= 0 && end > start);
  const sandbox = {};
  vm.runInNewContext(plannerSource.slice(start, end) + "\nglobalThis.validModule=validImportedModule;", sandbox);
  assert.equal(sandbox.validModule({name:"Algorithms",ue:"Math",mark:"10",moduleCoeff:"2",ueCoeff:"1",semester:"1"}), true);
  assert.equal(sandbox.validModule({name:"Algorithms",mark:"21",moduleCoeff:"1",ueCoeff:"1"}), false);
  assert.equal(sandbox.validModule({name:"Algorithms",mark:"10",moduleCoeff:"0",ueCoeff:"1"}), false);
  assert.equal(sandbox.validModule({name:"x".repeat(121),mark:"10",moduleCoeff:"1",ueCoeff:"1"}), false);
  assert.match(plannerSource, /file\.size>2\*1024\*1024/);
  assert.match(plannerSource, /x\.modules\.length>500/);
});


test("university backup import confirms replacement in all supported languages", () => {
  assert.match(plannerSource, /if\(!confirm\(t\("importConfirm"\)\)\)\{e\.target\.value="";return\}state=nextState/);
  assert.match(plannerSource, /importConfirm:"Importer cette sauvegarde remplacera le parcours actuel\. Continuer \?"/);
  assert.match(plannerSource, /importConfirm:"Importing this backup will replace the current program\. Continue\?"/);
  assert.match(plannerSource, /importConfirm:"سيؤدي استيراد هذه النسخة إلى استبدال المسار الحالي\. هل تريد المتابعة؟"/);
});

test("student backup import validates full history before asking to replace data", () => {
  const validation = source.indexOf("d.history.every(validImportedSnapshot)");
  const confirmation = source.indexOf('confirm(t("fullBackupConfirm"))');
  const mutation = source.indexOf("items=nextItems;history=nextHistory");
  assert.ok(validation >= 0 && confirmation > validation && mutation > confirmation);
});
