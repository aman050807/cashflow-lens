# cashflow-lens

[![CI](https://github.com/aman050807/cashflow-lens/actions/workflows/test.yml/badge.svg)](https://github.com/aman050807/cashflow-lens/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@aman050807/cashflow-lens.svg)](https://www.npmjs.com/package/@aman050807/cashflow-lens)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@aman050807/cashflow-lens)](https://bundlephobia.com/package/@aman050807/cashflow-lens)
[![license](https://img.shields.io/npm/l/@aman050807/cashflow-lens)](https://github.com/aman050807/cashflow-lens/blob/main/LICENSE)

Compare cashflow scenarios without mixing rental income with capital growth.
A dependency-free JavaScript/Node.js library with CommonJS, ESM named imports,
TypeScript declarations and strict runtime validation.

Useful for comparison tables, educational investment calculators and scenario
analysis. All examples are fictional, not investment advice or expected returns.

## Install

```sh
npm install @aman050807/cashflow-lens
```

Requires Node.js 20+. No runtime dependencies, network calls, build step or side effects.

## Quick start

```js
const { projectScenario } = require('@aman050807/cashflow-lens');
// ESM: import { projectScenario } from '@aman050807/cashflow-lens';

const result = projectScenario({
  initialInvestment: 10000,
  annualIncome: 800,
  annualExpenses: 200,
  annualGrowthRate: 0.05, // 5%, not 5
  years: 2,
  exitFeeRate: 0.02      // 2% of ending asset value
});

console.log(result.netProfit);        // 2004.5
console.log(result.cashYieldRate);    // 0.06 = 6%
console.log(result.totalReturnRate);  // 0.20045 = 20.045% over two years
console.log(result.capitalCagrRate);  // about 0.039447 = 3.9447% per year
```

## Compare scenarios

```js
const { compareScenarios } = require('@aman050807/cashflow-lens');

const ranked = compareScenarios([
  { id: 'income-first', initialInvestment: 10000, annualIncome: 800, years: 3 },
  { id: 'growth-first', initialInvestment: 10000, annualIncome: 400,
    annualGrowthRate: 0.05, years: 3 }
]);

console.log(ranked.map(row => row.id)); // ['growth-first', 'income-first']
```

Results are sorted by **total return rate**, highest first. Equal rates retain
input order. No input array or object is changed. Empty input returns `[]`.
Each scenario needs a unique non-empty string `id`; results contain that `id`
and the projection fields below, not arbitrary input metadata.

**Only compare like-for-like horizons and currency assumptions.** A higher total
return over ten years is not automatically better than a smaller return over one.
This function ranks one metric, not risk, liquidity, suitability or investment quality.

## API

All money arguments must use the same currency/unit. Rates are decimal fractions:
`0.08` means 8%. Results are unrounded JavaScript numbers. Round for display only.

### `cashYield(initialInvestment, annualIncome, annualExpenses = 0)`

Returns `(annualIncome - annualExpenses) / initialInvestment`.
Income and expenses must be non-negative; a net loss is allowed.

### `totalReturn(initialInvestment, terminalProceeds, accumulatedIncome = 0)`

Returns `(terminalProceeds + accumulatedIncome - initialInvestment) / initialInvestment`.
Terminal proceeds must be non-negative. Accumulated income may be negative to
represent operating losses. This is a **cumulative**, not annualized, return.

### `cagr(initialValue, finalValue, years)`

Returns `(finalValue / initialValue) ** (1 / years) - 1`.
Final value must be non-negative. A zero final value returns `-1` (100% loss).
This is a **capital-only** measure. It is not IRR/XIRR and does not account for
interim cashflow timing. Do not add this rate to cash yield to invent a total CAGR.

### `projectScenario(options)`

| Option | Required | Meaning |
| --- | --- | --- |
| `initialInvestment` | yes | Positive initial asset value / capital invested |
| `annualIncome` | yes | Non-negative gross income per year |
| `years` | yes | Positive holding period; fractional years allowed |
| `annualExpenses` | no, `0` | Non-negative fixed annual expenses |
| `annualGrowthRate` | no, `0` | Annual compound asset growth, at least `-1` |
| `exitFeeRate` | no, `0` | Fraction of ending asset value, between `0` and `1` |

Returned fields:

| Field | Formula |
| --- | --- |
| `netAnnualIncome` | annualIncome - annualExpenses |
| `accumulatedIncome` | netAnnualIncome * years |
| `endingAssetValue` | initialInvestment * (1 + annualGrowthRate) ** years |
| `exitFee` | endingAssetValue * exitFeeRate |
| `terminalProceeds` | endingAssetValue - exitFee |
| `netProfit` | terminalProceeds + accumulatedIncome - initialInvestment |
| `cashYieldRate` | netAnnualIncome / initialInvestment |
| `totalReturnRate` | netProfit / initialInvestment |
| `capitalCagrRate` | cagr(initialInvestment, terminalProceeds, years) |

### `compareScenarios(scenarios)`

Accepts an array of the options above plus a unique `id`. Returns ranked projection
objects. Duplicate ids throw `RangeError`; missing/blank/non-string ids throw `TypeError`.

### `formatMoney(amount, options)`

Formats a money amount for display with `Intl.NumberFormat`. `options.currency`
is required (3-letter ISO 4217 code); `options.locale` defaults to `en-US`.
Use `en-IN` for Indian digit grouping.

```js
formatMoney(100000, { locale: 'en-IN', currency: 'INR' }); // "₹1,00,000.00"
formatMoney(1000, { locale: 'en-US', currency: 'USD' });    // "$1,000.00"
```

### `formatRate(rate, options)`

Formats a decimal rate as a percentage. `options.maximumFractionDigits`
defaults to `2` (integer 0-20); `options.locale` defaults to `en-US`.

```js
formatRate(0.06);    // "6%"
formatRate(0.03945); // "3.95%"
```

Both helpers are **display only**. They format output for humans; every
calculation stays an unrounded IEEE-754 number exactly as documented above.
They change nothing about financial accuracy and are never used internally.

## Browser playground

A zero-build playground that ranks scenarios against the published package
lives in the demo repo: [cashflow-lens-demo/playground](https://github.com/aman050807/cashflow-lens-demo/tree/main/playground).

## Model assumptions and limits

- Initial investment equals initial asset value. Acquisition costs are not modeled.
- Income and expenses stay constant and are **not reinvested**. Fractional years
  prorate these flows linearly; asset growth compounds over the fractional exponent.
- No taxes, inflation, debt, currency conversion, vacancies, changing fees or risk model.
  Model an expected vacancy allowance within annual income, not as a guaranteed outcome.
- Exit fee applies to ending asset value, not profit. Net cashflow may be negative.
- Annual growth cannot be below -100%; exit fees can reach 100%.
- Unknown option fields are ignored. Sparse comparison arrays are invalid.
- Uses IEEE-754 numbers, not decimal accounting arithmetic. Do not use for payment
  settlement, ledger reconciliation or exact money storage. Very large inputs may overflow.
- Inputs must be finite numbers, not numeric strings. Initial capital and years must
  be greater than zero. Invalid types throw `TypeError`, invalid ranges and non-finite
  calculated results throw `RangeError`. Very tiny values can underflow to zero.

## Development and verification

```sh
npm ci
npm test
npm run test:coverage
npm pack --dry-run
```

Tests cover hand-calculated examples, losses, zero final values, fractional years,
invalid input, overflow, stable sorting, scale invariance, non-mutation, display
formatting and both module loading styles. CI runs on Node.js 20, 22 and 24.

## Versioning

Semantic versioning. The first stable release is `1.0.0`. Patch versions fix bugs;
minor versions add backward-compatible features; major versions change existing
contracts. See [CHANGELOG.md](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE).
