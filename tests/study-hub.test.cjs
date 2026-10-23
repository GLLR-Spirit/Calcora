const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateRequiredMark, makeRecallPrompts, dueCardStats } = require("../assets/js/study-hub.js");

test("target mark uses completed assessment weight", () => assert.equal(calculateRequiredMark(60, 60, 70), 85));
test("unreachable target returns a mark above 100 percent", () => assert.ok(calculateRequiredMark(40, 80, 90) > 100));
test("active recall prompts use the supplied topic", () => assert.deepEqual(makeRecallPrompts("binary trees"), ["Explain binary trees", "Give an example of binary trees"]));
test("spaced repetition bridge counts new cards as due", () => assert.deepEqual(dueCardStats([{q:"Q",a:"A"}], 100), {total:1,due:1,nextDue:null}));
test("spaced repetition bridge separates due and future cards", () => assert.deepEqual(dueCardStats([{q:"Q1",a:"A1",dueAt:90},{q:"Q2",a:"A2",dueAt:120}],100), {total:2,due:1,nextDue:120}));
test("spaced repetition bridge ignores malformed card records", () => assert.deepEqual(dueCardStats([null,{q:"Q"},{q:"Q",a:"A",dueAt:120}],100), {total:1,due:0,nextDue:120}));
