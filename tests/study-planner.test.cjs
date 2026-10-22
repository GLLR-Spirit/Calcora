const test = require("node:test");
const assert = require("node:assert/strict");
const planner = require("../assets/js/study-planner.js");

test("counts days to an exam using calendar dates, not time of day", () => {
  assert.equal(planner.daysUntil("2026-10-25", "2026-10-22"), 3);
  assert.equal(planner.daysUntil("2026-10-22", "2026-10-22"), 0);
  assert.equal(planner.daysUntil("2026-10-20", "2026-10-22"), -2);
});

test("validates and normalizes a revision plan", () => {
  const p = planner.normalizePlan({
    subject: "  Algorithms  ", examDate: "2026-11-02", priority: "high",
    plannedMinutes: 90, studiedMinutes: 25, topic: "Recursion", notes: "Practice problems"
  });
  assert.ok(p);
  assert.equal(p.subject, "Algorithms");
  assert.equal(p.plannedMinutes, 90);
  assert.equal(p.studiedMinutes, 25);
  assert.equal(p.priority, "high");
});

test("rejects missing subjects, malformed dates and invalid durations", () => {
  assert.equal(planner.normalizePlan({subject:"",examDate:"2026-11-02",plannedMinutes:60}), null);
  assert.equal(planner.normalizePlan({subject:"Math",examDate:"not-a-date",plannedMinutes:60}), null);
  assert.equal(planner.normalizePlan({subject:"Math",examDate:"2026-11-02",plannedMinutes:4}), null);
  assert.equal(planner.normalizePlan({subject:"Math",examDate:"2026-11-02",plannedMinutes:10001}), null);
  assert.equal(planner.normalizePlan({subject:"Math",examDate:"2026-11-02",plannedMinutes:60,studiedMinutes:-1}), null);
});

test("summary counts active, completed, overdue and study minutes accurately", () => {
  const plans = [
    {completed:false,examDate:"2026-10-20",plannedMinutes:120,studiedMinutes:25},
    {completed:false,examDate:"2026-10-24",plannedMinutes:60,studiedMinutes:10},
    {completed:true,examDate:"2026-10-19",plannedMinutes:30,studiedMinutes:30}
  ];
  assert.deepEqual(planner.summarize(plans,"2026-10-22"), {
    active:2, completed:1, plannedMinutes:180, studiedMinutes:65, overdue:1
  });
});

test("caps progress at 100 percent conceptually by supporting study time beyond the plan", () => {
  const p = planner.normalizePlan({subject:"Physics",examDate:"2026-12-01",plannedMinutes:30,studiedMinutes:45});
  assert.equal(Math.min(100,Math.round(p.studiedMinutes/p.plannedMinutes*100)),100);
});

test("homepage links to the revision planner and deployment checks include its tests", () => {
  const fs = require("node:fs");
  const home = fs.readFileSync("index.html","utf8");
  const workflow = fs.readFileSync(".github/workflows/pages.yml","utf8");
  assert.match(home,/href="study-planner\.html"/);
  assert.match(workflow,/node --check assets\/js\/study-planner\.js/);
  assert.match(workflow,/node --test tests\/\*\.test\.cjs/);
});

test("suggests revision priorities from marks and treats ungraded subjects as high priority",()=>{assert.equal(planner.suggestedPriority(""),"high");assert.equal(planner.suggestedPriority(null),"high");assert.equal(planner.suggestedPriority(9.99),"high");assert.equal(planner.suggestedPriority(10),"medium");assert.equal(planner.suggestedPriority(11.99),"medium");assert.equal(planner.suggestedPriority(12),"low")});
test("revision planner reads shared workspace key and exposes integration UI",()=>{const fs=require("node:fs");const script=fs.readFileSync("assets/js/study-planner.js","utf8");const html=fs.readFileSync("study-planner.html","utf8");const workspace=fs.readFileSync("student-workspace.html","utf8");assert.match(script,/calcora-student-workspace-v1/);assert.match(script,/renderWorkspaceSubjects/);assert.match(html,/id="workspace-subjects"/);assert.match(workspace,/href="study-planner\.html"/)});
