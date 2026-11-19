/**
 * cashflow-lens: compare cashflow scenarios without mixing rental income
 * with capital growth.
 *
 * All money arguments must use one consistent currency/unit. Rates are
 * decimal fractions: `0.08` means 8%. Results are unrounded JavaScript
 * numbers (IEEE-754, not decimal accounting); round for display only.
 * All examples are fictional, not investment advice.
 */

/**
 * A scenario to project. Rates are decimals (`0.05` = 5%); money uses one
 * consistent currency.
 *
 * @example
 * const flat = {
 *   initialInvestment: 5000000,   // ₹50 lakh
 *   annualIncome: 300000,         // rent
 *   annualExpenses: 60000,        // maintenance, tax
 *   annualGrowthRate: 0.04,
 *   years: 5,
 *   exitFeeRate: 0.02
 * };
 */
export interface Scenario {
  /** Initial asset value / capital invested. Must be greater than zero. */
  initialInvestment: number;
  /** Gross income per year. Must be non-negative. */
  annualIncome: number;
  /** Fixed annual expenses. Default `0`. Must be non-negative. */
  annualExpenses?: number;
  /** Annual compound asset growth as a decimal. Default `0`. At least `-1`. */
  annualGrowthRate?: number;
  /** Holding period in years; fractional years allowed. Must be greater than zero. */
  years: number;
  /** Fraction of ending asset value charged at exit. Default `0`. Between `0` and `1`. */
  exitFeeRate?: number;
}

/**
 * The projection returned by {@link projectScenario}. All rates are decimal
 * fractions; all money fields use the input's currency.
 */
export interface Projection {
  /** `annualIncome - annualExpenses` */
  netAnnualIncome: number;
  /** `netAnnualIncome * years` (income is not reinvested) */
  accumulatedIncome: number;
  /** `initialInvestment * (1 + annualGrowthRate) ** years` */
  endingAssetValue: number;
  /** `endingAssetValue * exitFeeRate` */
  exitFee: number;
  /** `endingAssetValue - exitFee` */
  terminalProceeds: number;
  /** `terminalProceeds + accumulatedIncome - initialInvestment` */
  netProfit: number;
  /** `netAnnualIncome / initialInvestment` */
  cashYieldRate: number;
  /** `netProfit / initialInvestment` (cumulative, not annualized) */
  totalReturnRate: number;
  /** Capital-only CAGR after exit fees. Excludes interim income; do not add it to cash yield. */
  capitalCagrRate: number;
}

/** A {@link Scenario} plus a unique non-empty string `id`. */
export interface IdentifiedScenario extends Scenario { id: string; }

/** A {@link Projection} plus the `id` of the scenario it came from. */
export interface RankedProjection extends Projection { id: string; }

/**
 * Annual net income divided by initial investment. Returns a decimal rate.
 *
 * @param initialInvestment Positive initial capital.
 * @param annualIncome Non-negative gross annual income.
 * @param annualExpenses Non-negative annual expenses. Default `0`.
 * @returns `(annualIncome - annualExpenses) / initialInvestment`
 * @throws {TypeError} Non-finite or wrongly typed arguments.
 * @throws {RangeError} Negative income/expenses or non-positive investment.
 *
 * @example
 * cashYield(10000, 800, 200); // 0.06, i.e. 6%
 */
export declare function cashYield(initialInvestment: number, annualIncome: number, annualExpenses?: number): number;

/**
 * Cumulative total return: income and terminal proceeds versus initial
 * investment. Not annualized.
 *
 * @param initialInvestment Positive initial capital.
 * @param terminalProceeds Non-negative proceeds at exit.
 * @param accumulatedIncome Income over the holding period; may be negative. Default `0`.
 * @returns `(terminalProceeds + accumulatedIncome - initialInvestment) / initialInvestment`
 * @throws {TypeError} Non-finite or wrongly typed arguments.
 * @throws {RangeError} Negative terminal proceeds or non-positive investment.
 *
 * @example
 * totalReturn(10000, 10804.5, 1200); // 0.20045, i.e. 20.045% over the period
 */
export declare function totalReturn(initialInvestment: number, terminalProceeds: number, accumulatedIncome?: number): number;

/**
 * Capital-only compound annual growth rate. Not IRR/XIRR: ignores interim
 * income and its timing. A zero final value returns `-1` (100% loss).
 *
 * @param initialValue Positive starting value.
 * @param finalValue Non-negative ending value.
 * @param years Positive period; fractional years allowed.
 * @returns `(finalValue / initialValue) ** (1 / years) - 1`
 * @throws {TypeError} Non-finite or wrongly typed arguments.
 * @throws {RangeError} Negative final value, or non-positive initial value or years.
 *
 * @example
 * cagr(100, 121, 2); // 0.1, i.e. 10% per year
 */
export declare function cagr(initialValue: number, finalValue: number, years: number): number;

/**
 * Project one scenario: fixed annual net income (not reinvested) plus
 * constant compound asset growth, minus an exit fee on the ending value.
 *
 * Model limits: no taxes, inflation, debt, vacancies or reinvestment.
 * Unknown option fields are ignored.
 *
 * @param scenario The scenario to project.
 * @returns The {@link Projection}. Throws `RangeError` if any result overflows to a non-finite number.
 * @throws {TypeError} Missing/invalid fields or a non-object argument.
 * @throws {RangeError} Out-of-range fields (see {@link Scenario}).
 *
 * @example
 * const p = projectScenario({
 *   initialInvestment: 10000, annualIncome: 800, annualExpenses: 200,
 *   annualGrowthRate: 0.05, years: 2, exitFeeRate: 0.02
 * });
 * p.netProfit;       // 2004.5
 * p.cashYieldRate;   // 0.06
 * p.totalReturnRate; // 0.20045
 * p.capitalCagrRate; // about 0.0394
 */
export declare function projectScenario(scenario: Scenario): Projection;

/**
 * Rank scenarios by total return rate, highest first. Equal rates retain
 * input order. Inputs are never mutated; empty input returns `[]`.
 *
 * Only compare like-for-like horizons and currency assumptions: this ranks
 * one metric, not risk, liquidity, suitability or investment quality.
 *
 * @param scenarios Scenarios with unique non-empty string `id`s.
 * @returns Ranked projections carrying each scenario's `id`.
 * @throws {TypeError} Non-array input, or a missing/blank/non-string `id`.
 * @throws {RangeError} Duplicate `id`s.
 *
 * @example
 * const ranked = compareScenarios([
 *   { id: 'income-first', initialInvestment: 10000, annualIncome: 800, years: 3 },
 *   { id: 'growth-first', initialInvestment: 10000, annualIncome: 400, annualGrowthRate: 0.05, years: 3 }
 * ]);
 * ranked.map(row => row.id); // ['growth-first', 'income-first']
 */
export declare function compareScenarios(scenarios: readonly IdentifiedScenario[]): RankedProjection[];

/** Options for {@link formatMoney}. */
export interface FormatMoneyOptions {
  /**
   * BCP 47 locale controlling digit grouping and symbol placement.
   * Default `'en-US'`. Use `'en-IN'` for Indian grouping (`1,00,000`).
   */
  locale?: string;
  /** 3-letter ISO 4217 currency code, e.g. `'INR'`, `'USD'`, `'EUR'`. Required. */
  currency: string;
}

/** Options for {@link formatRate}. */
export interface FormatRateOptions {
  /** BCP 47 locale. Default `'en-US'`. */
  locale?: string;
  /** Fraction digits shown after the decimal point, integer 0-20. Default `2`. */
  maximumFractionDigits?: number;
}

/**
 * Format a money amount for display, using the runtime's `Intl.NumberFormat`
 * data. Display only: the returned string is for humans and never feeds the
 * library's calculations, which stay unrounded IEEE-754 numbers.
 *
 * @param amount Finite number in the given currency.
 * @param options See {@link FormatMoneyOptions}. `currency` is required.
 * @returns A localized currency string.
 * @throws {TypeError} Non-finite amount, missing/non-string currency, or non-object options.
 * @throws {RangeError} Currency that is not a 3-letter ISO 4217 code.
 *
 * @example
 * formatMoney(100000, { locale: 'en-IN', currency: 'INR' }); // "₹1,00,000.00"
 * formatMoney(1000, { locale: 'en-US', currency: 'USD' });    // "$1,000.00"
 */
export declare function formatMoney(amount: number, options: FormatMoneyOptions): string;

/**
 * Format a decimal rate as a percentage for display. Display only: rounding
 * applies to the string, not to stored values.
 *
 * @param rate Finite decimal rate (`0.06` = 6%).
 * @param options See {@link FormatRateOptions}.
 * @returns A localized percent string.
 * @throws {TypeError} Non-finite rate, non-integer digits, or non-object options.
 * @throws {RangeError} `maximumFractionDigits` outside 0-20.
 *
 * @example
 * formatRate(0.06);                              // "6%"
 * formatRate(0.0394, { maximumFractionDigits: 1 }); // "3.9%"
 */
export declare function formatRate(rate: number, options?: FormatRateOptions): string;
