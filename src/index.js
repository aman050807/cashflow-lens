'use strict';

function finite(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
  return value;
}

function positive(value, name) {
  finite(value, name);
  if (value <= 0) throw new RangeError(`${name} must be greater than zero`);
  return value;
}

function nonnegative(value, name) {
  finite(value, name);
  if (value < 0) throw new RangeError(`${name} must not be negative`);
  return value;
}

function result(value) {
  if (!Number.isFinite(value)) throw new RangeError('calculation exceeds the finite number range');
  return value;
}

/** Annual net income divided by initial investment. Returns a decimal rate. */
function cashYield(initialInvestment, annualIncome, annualExpenses = 0) {
  positive(initialInvestment, 'initialInvestment');
  nonnegative(annualIncome, 'annualIncome');
  nonnegative(annualExpenses, 'annualExpenses');
  return result((annualIncome - annualExpenses) / initialInvestment);
}

/** (Terminal proceeds + accumulated income - initial investment) / initial investment. */
function totalReturn(initialInvestment, terminalProceeds, accumulatedIncome = 0) {
  positive(initialInvestment, 'initialInvestment');
  nonnegative(terminalProceeds, 'terminalProceeds');
  finite(accumulatedIncome, 'accumulatedIncome');
  return result((terminalProceeds + accumulatedIncome - initialInvestment) / initialInvestment);
}

/** Capital-only CAGR. Does not account for interim income or its timing. */
function cagr(initialValue, finalValue, years) {
  positive(initialValue, 'initialValue');
  nonnegative(finalValue, 'finalValue');
  positive(years, 'years');
  return result(Math.pow(finalValue / initialValue, 1 / years) - 1);
}

/** Fixed annual net income, no reinvestment, constant annual asset growth. */
function projectScenario(options) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('scenario must be an object');
  }
  const { initialInvestment, annualIncome, annualExpenses = 0,
    annualGrowthRate = 0, years, exitFeeRate = 0 } = options;
  positive(initialInvestment, 'initialInvestment');
  nonnegative(annualIncome, 'annualIncome');
  nonnegative(annualExpenses, 'annualExpenses');
  positive(years, 'years');
  finite(annualGrowthRate, 'annualGrowthRate');
  if (annualGrowthRate < -1) throw new RangeError('annualGrowthRate must be at least -1');
  finite(exitFeeRate, 'exitFeeRate');
  if (exitFeeRate < 0 || exitFeeRate > 1) throw new RangeError('exitFeeRate must be between 0 and 1');
  const netAnnualIncome = result(annualIncome - annualExpenses);
  const accumulatedIncome = result(netAnnualIncome * years);
  const endingAssetValue = result(initialInvestment * Math.pow(1 + annualGrowthRate, years));
  const exitFee = result(endingAssetValue * exitFeeRate);
  const terminalProceeds = result(endingAssetValue - exitFee);
  const netProfit = result(terminalProceeds + accumulatedIncome - initialInvestment);
  return {
    netAnnualIncome, accumulatedIncome, endingAssetValue, exitFee, terminalProceeds, netProfit,
    cashYieldRate: cashYield(initialInvestment, annualIncome, annualExpenses),
    totalReturnRate: totalReturn(initialInvestment, terminalProceeds, accumulatedIncome),
    capitalCagrRate: cagr(initialInvestment, terminalProceeds, years)
  };
}

/** Rank scenarios by total return rate, descending. Input order breaks ties. */
function compareScenarios(scenarios) {
  if (!Array.isArray(scenarios)) throw new TypeError('scenarios must be an array');
  const ids = new Set();
  return Array.from(scenarios, (scenario) => {
    if (!scenario || typeof scenario.id !== 'string' || scenario.id.trim() === '') {
      throw new TypeError('each scenario must have a non-empty string id');
    }
    if (ids.has(scenario.id)) throw new RangeError(`duplicate scenario id: ${scenario.id}`);
    ids.add(scenario.id);
    return { id: scenario.id, ...projectScenario(scenario) };
  }).sort((a, b) => b.totalReturnRate - a.totalReturnRate);
}

function localeOf(value) {
  if (value === undefined) return 'en-US';
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('locale must be a non-empty BCP 47 string, e.g. "en-IN"');
  }
  return value;
}

/**
 * Format a money amount for display, e.g. "\u20B91,00,000.00" in en-IN/INR.
 * Display only: the result is a string for humans and never feeds calculations.
 */
function formatMoney(amount, options = {}) {
  finite(amount, 'amount');
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object');
  }
  if (options.currency === undefined) throw new TypeError('options.currency is required');
  if (typeof options.currency !== 'string') throw new TypeError('currency must be a string');
  if (!/^[A-Za-z]{3}$/.test(options.currency)) {
    throw new RangeError('currency must be a 3-letter ISO 4217 code, e.g. "INR"');
  }
  return new Intl.NumberFormat(localeOf(options.locale),
    { style: 'currency', currency: options.currency.toUpperCase() }).format(amount);
}

/**
 * Format a decimal rate as a percentage for display, e.g. 0.06 -> "6%".
 * Display only: rounding applies to the string, not to stored values.
 */
function formatRate(rate, options = {}) {
  finite(rate, 'rate');
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('options must be an object');
  }
  const digits = options.maximumFractionDigits === undefined ? 2 : options.maximumFractionDigits;
  if (typeof digits !== 'number' || !Number.isInteger(digits)) {
    throw new TypeError('maximumFractionDigits must be an integer');
  }
  if (digits < 0 || digits > 20) throw new RangeError('maximumFractionDigits must be between 0 and 20');
  return new Intl.NumberFormat(localeOf(options.locale),
    { style: 'percent', maximumFractionDigits: digits }).format(rate);
}

exports.cashYield = cashYield;
exports.totalReturn = totalReturn;
exports.cagr = cagr;
exports.projectScenario = projectScenario;
exports.compareScenarios = compareScenarios;
exports.formatMoney = formatMoney;
exports.formatRate = formatRate;
