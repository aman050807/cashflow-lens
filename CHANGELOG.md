# Changelog

Changes follow semantic versioning. Dates are actual release dates.

## 0.2.0 - 2026-11-19

Backward-compatible additions; all calculations are unchanged.

- `formatMoney` and `formatRate` display helpers built on `Intl.NumberFormat`,
  including Indian locale grouping (`en-IN`). Display only: calculations stay
  unrounded IEEE-754 numbers.
- Marked the package as side-effect free (`"sideEffects": false`) so bundlers
  can drop unimported functions.
- Expanded editor hover documentation: full JSDoc with examples in the
  TypeScript declarations.
- CI, npm version, bundle size and license badges in the README.
- Browser playground added to the companion demo repository.

## 0.1.0 - 2026-11-16

Initial development release.

- Cash yield, cumulative total return and capital-only CAGR functions.
- Constant-income scenario projection with compound asset growth and exit fees.
- Stable, non-mutating scenario ranking with unique identifiers.
- Runtime validation, TypeScript declarations and CommonJS/ESM support.
- Unit tests and Node.js 20/22/24 CI workflow.

The model is educational. It does not calculate IRR, taxes, debt or investment risk.
