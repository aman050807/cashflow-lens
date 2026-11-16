/** Rates are decimals (0.05 = 5%); money uses one consistent currency. */
export interface Scenario {
  initialInvestment: number;
  annualIncome: number;
  annualExpenses?: number;
  annualGrowthRate?: number;
  years: number;
  exitFeeRate?: number;
}
export interface Projection {
  netAnnualIncome: number;
  accumulatedIncome: number;
  endingAssetValue: number;
  exitFee: number;
  terminalProceeds: number;
  netProfit: number;
  cashYieldRate: number;
  totalReturnRate: number;
  /** Capital-only CAGR after exit fees. Excludes interim income. */
  capitalCagrRate: number;
}
export interface IdentifiedScenario extends Scenario { id: string; }
export interface RankedProjection extends Projection { id: string; }
export declare function cashYield(initialInvestment: number, annualIncome: number, annualExpenses?: number): number;
export declare function totalReturn(initialInvestment: number, terminalProceeds: number, accumulatedIncome?: number): number;
export declare function cagr(initialValue: number, finalValue: number, years: number): number;
export declare function projectScenario(scenario: Scenario): Projection;
export declare function compareScenarios(scenarios: readonly IdentifiedScenario[]): RankedProjection[];
