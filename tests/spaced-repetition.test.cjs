const test = require("node:test");
const assert = require("node:assert/strict");
const { scheduleReview, isDue } = require("../assets/js/revision.js");

const now = Date.UTC(2026, 0, 1);
const day = 24 * 60 * 60 * 1000;

test("new flashcards are due immediately", () => {
  assert.equal(isDue({ q: "Question", a: "Answer" }, now), true);
});

test("a future review is not due yet", () => {
  assert.equal(isDue({ dueAt: now + day }, now), false);
});

test("Again schedules a retry in ten minutes and resets repetitions", () => {
  const result = scheduleReview({ repetitions: 4, intervalDays: 10, ease: 2.5 }, "again", now);
  assert.equal(result.dueAt, now + 10 * 60 * 1000);
  assert.equal(result.repetitions, 0);
});

test("Hard schedules a first review for one day later", () => {
  assert.equal(scheduleReview({}, "hard", now).dueAt, now + day);
});

test("Good schedules a first review for one day later", () => {
  assert.equal(scheduleReview({}, "good", now).dueAt, now + day);
});

test("Easy schedules a first review for four days later", () => {
  assert.equal(scheduleReview({}, "easy", now).dueAt, now + 4 * day);
});

test("successful later reviews increase the interval", () => {
  const result = scheduleReview({ repetitions: 2, intervalDays: 3, ease: 2.5 }, "good", now);
  assert.equal(result.repetitions, 3);
  assert.equal(result.intervalDays, 7.5);
});

test("ease factor stays within configured bounds", () => {
  const result = scheduleReview({ repetitions: 2, intervalDays: 3, ease: 1.3 }, "again", now);
  assert.equal(result.ease, 1.3);
  const easy = scheduleReview({ repetitions: 2, intervalDays: 3, ease: 3 }, "easy", now);
  assert.equal(easy.ease, 3);
});

test("unknown ratings are rejected", () => {
  assert.throws(() => scheduleReview({}, "unknown", now), /Unknown review rating/);
});
