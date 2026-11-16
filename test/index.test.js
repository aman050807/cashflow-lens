'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { cashYield, totalReturn, cagr, projectScenario, compareScenarios } = require('..');
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const base = { initialInvestment: 10000, annualIncome: 800, annualExpenses: 200, years: 2, annualGrowthRate: 0.05, exitFeeRate: 0.02 };

test('cash yield subtracts expenses and returns a decimal', () => close(cashYield(10000, 800, 200), 0.06));
test('cash yield supports defaults, zero and negative net cashflow', () => {
  close(cashYield(100, 8), 0.08); close(cashYield(100, 0), 0); close(cashYield(100, 0, 10), -0.1);
});
test('total return separates income from terminal proceeds', () => close(totalReturn(10000, 10804.5, 1200), 0.20045));
test('total return covers loss, total loss and negative income', () => {
  close(totalReturn(100, 90), -0.1); close(totalReturn(100, 0), -1); close(totalReturn(100, 100, -20), -0.2);
});
test('CAGR covers growth, loss, zero final value and fractional years', () => {
  close(cagr(100, 121, 2), 0.1); close(cagr(100, 81, 2), -0.1); close(cagr(100, 0, 2), -1); close(cagr(100, 110, 0.5), 0.21);
});
test('projection matches independently calculated two-year example', () => {
  const x = projectScenario(base);
  assert.deepEqual(x, { netAnnualIncome: 600, accumulatedIncome: 1200, endingAssetValue: 11025,
    exitFee: 220.5, terminalProceeds: 10804.5, netProfit: 2004.5, cashYieldRate: 0.06,
    totalReturnRate: 0.20045, capitalCagrRate: cagr(10000,10804.5,2) });
});
test('projection defaults to zero expenses, fees and growth', () => {
  const x = projectScenario({ initialInvestment: 100, annualIncome: 5, years: 3 });
  assert.equal(x.netProfit, 15); assert.equal(x.endingAssetValue, 100); assert.equal(x.exitFee, 0);
});
test('projection prorates fixed income for fractional years', () => {
  assert.equal(projectScenario({ initialInvestment: 100, annualIncome: 10, years: 0.5 }).accumulatedIncome, 5);
});
test('100% asset loss and 100% exit fee have defined outcomes', () => {
  assert.equal(projectScenario({ ...base, annualGrowthRate: -1 }).endingAssetValue, 0);
  assert.equal(projectScenario({ ...base, exitFeeRate: 1 }).terminalProceeds, 0);
});
test('pure functions do not mutate or retain input objects', () => {
  const input = Object.freeze({ ...base }); const a = projectScenario(input); a.netProfit = 0;
  assert.equal(projectScenario(input).netProfit, 2004.5);
});
test('comparison ranks by total return without mutating inputs', () => {
  const entries = Object.freeze([Object.freeze({ ...base, id: 'low', annualIncome: 400 }), Object.freeze({ ...base, id: 'high' })]);
  assert.deepEqual(compareScenarios(entries).map(x=>x.id), ['high','low']); assert.equal(entries[0].id, 'low');
});
test('comparison preserves tie order and handles empty arrays', () => {
  assert.deepEqual(compareScenarios([{ ...base,id:'b' },{ ...base,id:'a' }]).map(x=>x.id), ['b','a']);
  assert.deepEqual(compareScenarios([]), []);
});
test('comparison rejects duplicate, empty, non-string or missing ids', () => {
  for (const bad of [[{...base,id:'a'},{...base,id:'a'}],[{...base,id:' '}],[{...base,id:5}],[null],[{...base}]]) assert.throws(()=>compareScenarios(bad));
});
test('rejects non-object scenarios and non-array comparisons', () => {
  for (const bad of [null, undefined, [], 5, 'x']) assert.throws(()=>projectScenario(bad), TypeError);
  for (const bad of [null, {}, 'x']) assert.throws(()=>compareScenarios(bad), TypeError);
});
test('all numeric fields reject strings, NaN, Infinity and missing required values', () => {
  for (const key of Object.keys(base)) for (const bad of ['1', NaN, Infinity, -Infinity, null]) assert.throws(()=>projectScenario({...base,[key]:bad}), TypeError);
  for (const key of ['initialInvestment','annualIncome','years']) { const x={...base}; delete x[key]; assert.throws(()=>projectScenario(x), TypeError); }
});
test('rejects out-of-range values', () => {
  for (const [key,bad] of [['initialInvestment',0],['initialInvestment',-1],['annualIncome',-1],['annualExpenses',-1],['years',0],['years',-2],['annualGrowthRate',-1.01],['exitFeeRate',-0.01],['exitFeeRate',1.01]]) assert.throws(()=>projectScenario({...base,[key]:bad}), RangeError);
});
test('standalone metrics validate every argument', () => {
  for (const f of [()=>cashYield(0,1),()=>cashYield(100,-1),()=>cashYield(100,1,-1),()=>totalReturn(0,1),()=>totalReturn(100,-1),()=>totalReturn(100,1,NaN),()=>cagr(0,1,1),()=>cagr(100,-1,1),()=>cagr(100,1,0)]) assert.throws(f);
});
test('overflow is rejected, never returned as Infinity', () => {
  assert.throws(()=>projectScenario({...base,annualGrowthRate:100,years:10000}),RangeError);
  assert.throws(()=>cashYield(Number.MIN_VALUE,Number.MAX_VALUE),RangeError);
  assert.throws(()=>totalReturn(Number.MIN_VALUE,Number.MAX_VALUE),RangeError);
  assert.throws(()=>cagr(Number.MIN_VALUE,Number.MAX_VALUE,1),RangeError);
  assert.throws(()=>projectScenario({...base,annualIncome:Number.MAX_VALUE,years:10}),RangeError);
});
test('equivalent scenarios are scale invariant across a range of amounts', () => {
  const expected=projectScenario(base);
  for (const scale of [0.001,0.1,1,100,10000]) {
    const x=projectScenario({...base,initialInvestment:base.initialInvestment*scale,annualIncome:base.annualIncome*scale,annualExpenses:base.annualExpenses*scale});
    close(x.totalReturnRate,expected.totalReturnRate);close(x.cashYieldRate,expected.cashYieldRate);
  }
});
test('package supports ESM named imports as well as require', async () => {
  const esm=await import('../src/index.js'); assert.equal(esm.cashYield(100,10),0.1);
});
