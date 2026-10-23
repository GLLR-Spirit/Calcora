const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateRequiredMark, makeRecallPrompts } = require("../assets/js/study-hub.js");
test("target mark uses completed weight",()=>assert.equal(calculateRequiredMark(60,60,70),85));
test("impossible target can be detected above 100 percent",()=>assert.ok(calculateRequiredMark(40,80,90)>100));
test("active recall prompts use the supplied topic",()=>assert.deepEqual(makeRecallPrompts("binary trees"),["Explain binary trees","Give an example of binary trees"]));
