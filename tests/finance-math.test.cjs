const assert = require("node:assert/strict");
const test = require("node:test");
const { simpleInterest, compoundInterest, loanPayment } = require("../assets/js/finance-math.js");

test("simple interest calculates interest on principal only", () => {
  const result = simpleInterest(10000, 5, 3);
  assert.equal(result.ok, true);
  assert.equal(result.interest, 1500);
  assert.equal(result.total, 11500);
});

test("simple interest rejects invalid inputs and arithmetic overflow", () => {
  for (const args of [[0, 5, 1], [-1, 5, 1], [100, -1, 1], [100, 5, 0], ["", 5, 1], [100, Infinity, 1]]) {
    assert.equal(simpleInterest(...args).ok, false);
  }
  assert.equal(simpleInterest(Number.MAX_VALUE, 100, 1).reason, "overflow");
});

test("compound interest handles annual, monthly and zero-rate compounding", () => {
  const annual = compoundInterest(10000, 5, 2, 1);
  assert.equal(annual.ok, true);
  assert.equal(annual.total, 11025);
  const monthly = compoundInterest(10000, 5, 2, 12);
  assert.equal(monthly.ok, true);
  assert.ok(monthly.total > annual.total);
  assert.equal(monthly.periods, 24);
  const zeroRate = compoundInterest(10000, 0, 2, 12);
  assert.equal(zeroRate.total, 10000);
  assert.equal(zeroRate.interest, 0);
});

test("compound interest rejects invalid frequencies and non-finite results", () => {
  for (const args of [[0, 5, 1, 12], [100, -1, 1, 12], [100, 5, 0, 12], [100, 5, 1, 0], [100, 5, 1, 1.5], [100, 5, 1, 366], [100, Infinity, 1, 12]]) {
    assert.equal(compoundInterest(...args).ok, false);
  }
  assert.equal(compoundInterest(1e308, 100, 100, 365).reason, "overflow");
});

test("loan payment supports zero interest and standard fixed-rate amortization", () => {
  const zero = loanPayment(12000, 0, 12);
  assert.equal(zero.ok, true);
  assert.equal(zero.payment, 1000);
  assert.equal(zero.interest, 0);
  const loan = loanPayment(100000, 6, 60);
  assert.equal(loan.ok, true);
  assert.ok(Math.abs(loan.payment - 1933.280149) < 0.001);
  assert.ok(Math.abs(loan.total - loan.payment * 60) < 1e-9);
  assert.ok(loan.interest > 0);
});

test("loan payment rejects invalid terms, fractional months and overflow", () => {
  for (const args of [[0, 6, 60], [1000, -1, 60], [1000, 6, 0], [1000, 6, 1.5], [1000, 6, 1201], ["", 6, 60], [1000, Infinity, 60]]) {
    assert.equal(loanPayment(...args).ok, false);
  }
  assert.equal(loanPayment(Number.MAX_VALUE, 1e308, 1200).reason, "overflow");
});
