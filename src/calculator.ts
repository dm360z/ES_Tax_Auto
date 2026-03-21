/**
 * First-pass tax calculation engine for the ES Tax Auto workflow.
 *
 * Design principles
 * -----------------
 * 1. Accepts only validated, structured {@link TaxInput} objects.
 * 2. Calculation logic is completely separate from validation logic.
 * 3. Returns a fully structured {@link TaxResult} object.
 * 4. No PDF generation, no UI, no side-effects.
 *
 * Assumptions (first pass – clearly marked)
 * -----------------------------------------
 * ASSUMPTION A: US federal income tax only. State tax is not computed.
 * ASSUMPTION B: Tax year 2024 brackets (inflation-adjusted) are used as the
 *   baseline. When `taxYear` !== 2024 the same bracket thresholds are used;
 *   future versions should load year-specific tables.
 * ASSUMPTION C: Long-term capital gains are taxed at ordinary income rates.
 *   Preferential LTCG / qualified-dividend rates (0 %, 15 %, 20 %) are not
 *   applied in this first pass.
 * ASSUMPTION D: The capital-loss deduction cap of $3,000 per year is applied
 *   to net capital losses (short-term + long-term combined).
 * ASSUMPTION E: No credits (child tax credit, EITC, foreign tax credit, etc.)
 *   are modelled. The output represents pre-credit tax liability.
 * ASSUMPTION F: AMT is not computed.
 * ASSUMPTION G: Self-employment tax is not computed.
 */

import type {
  TaxInput,
  TaxResult,
  TaxBracketResult,
  FilingStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Tax tables (Tax Year 2024 – ASSUMPTION B)
// ---------------------------------------------------------------------------

/**
 * A single bracket definition.
 * `from` and `to` are taxable-income thresholds in USD.
 */
interface BracketDefinition {
  from: number;
  to: number;
  rate: number;
}

type BracketTable = Record<FilingStatus, BracketDefinition[]>;

/**
 * Federal income-tax brackets for tax year 2024.
 * Source: IRS Revenue Procedure 2023-34.
 * ASSUMPTION B – these thresholds must be updated for subsequent tax years.
 */
const BRACKETS_2024: BracketTable = {
  single: [
    { from: 0,       to: 11600,   rate: 0.10 },
    { from: 11600,   to: 47150,   rate: 0.12 },
    { from: 47150,   to: 100525,  rate: 0.22 },
    { from: 100525,  to: 191950,  rate: 0.24 },
    { from: 191950,  to: 243725,  rate: 0.32 },
    { from: 243725,  to: 609350,  rate: 0.35 },
    { from: 609350,  to: Infinity, rate: 0.37 },
  ],
  married_filing_jointly: [
    { from: 0,       to: 23200,   rate: 0.10 },
    { from: 23200,   to: 94300,   rate: 0.12 },
    { from: 94300,   to: 201050,  rate: 0.22 },
    { from: 201050,  to: 383900,  rate: 0.24 },
    { from: 383900,  to: 487450,  rate: 0.32 },
    { from: 487450,  to: 731200,  rate: 0.35 },
    { from: 731200,  to: Infinity, rate: 0.37 },
  ],
  married_filing_separately: [
    { from: 0,       to: 11600,   rate: 0.10 },
    { from: 11600,   to: 47150,   rate: 0.12 },
    { from: 47150,   to: 100525,  rate: 0.22 },
    { from: 100525,  to: 191950,  rate: 0.24 },
    { from: 191950,  to: 243725,  rate: 0.32 },
    { from: 243725,  to: 365600,  rate: 0.35 },
    { from: 365600,  to: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { from: 0,       to: 16550,   rate: 0.10 },
    { from: 16550,   to: 63100,   rate: 0.12 },
    { from: 63100,   to: 100500,  rate: 0.22 },
    { from: 100500,  to: 191950,  rate: 0.24 },
    { from: 191950,  to: 243700,  rate: 0.32 },
    { from: 243700,  to: 609350,  rate: 0.35 },
    { from: 609350,  to: Infinity, rate: 0.37 },
  ],
};

/**
 * Standard deduction amounts for tax year 2024.
 * Source: IRS Revenue Procedure 2023-34.
 * ASSUMPTION B – update annually.
 */
const STANDARD_DEDUCTIONS_2024: Record<FilingStatus, number> = {
  single: 14600,
  married_filing_jointly: 29200,
  married_filing_separately: 14600,
  head_of_household: 21900,
};

/**
 * Maximum capital-loss deduction per year (ASSUMPTION D).
 * Source: IRC § 1211(b).
 */
const CAPITAL_LOSS_DEDUCTION_CAP = 3000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Round a number to two decimal places. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Apply the bracket table to a taxable-income figure and return both the
 * per-bracket breakdown and the total liability.
 */
function applyBrackets(
  taxableIncome: number,
  brackets: BracketDefinition[]
): { breakdown: TaxBracketResult[]; total: number } {
  let remaining = taxableIncome;
  let total = 0;
  const breakdown: TaxBracketResult[] = [];

  for (const bracket of brackets) {
    if (remaining <= 0) break;

    const bracketWidth =
      bracket.to === Infinity ? remaining : bracket.to - bracket.from;
    const incomeInBracket = Math.min(remaining, bracketWidth);
    const taxOwed = incomeInBracket * bracket.rate;

    breakdown.push({
      from: bracket.from,
      to: bracket.to,
      rate: bracket.rate,
      taxableIncome: round2(incomeInBracket),
      taxOwed: round2(taxOwed),
    });

    total += taxOwed;
    remaining -= incomeInBracket;
  }

  return { breakdown, total: round2(total) };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Computes a first-pass federal income-tax estimate from validated input.
 *
 * This function assumes the input has already been validated with
 * {@link validateTaxInput}.  Passing unvalidated input may produce
 * incorrect results.
 *
 * @param input - A {@link TaxInput} object that has passed validation.
 * @returns A structured {@link TaxResult} with the computed values.
 */
export function calculateTax(input: TaxInput): TaxResult {
  const {
    taxYear,
    filingStatus,
    grossWages,
    ordinaryInterest = 0,
    ordinaryDividends = 0,
    shortTermCapitalGains = 0,
    longTermCapitalGains = 0,
    adjustments = 0,
    itemizedDeductions = 0,
  } = input;

  // 1. Gross income -----------------------------------------------------------
  //    Sum all income streams.
  //    Capital gains / losses are included at their raw value here;
  //    the $3,000 loss cap is applied when computing AGI (step 2).
  const netCapitalGains = shortTermCapitalGains + longTermCapitalGains;

  // ASSUMPTION D: cap capital loss deduction at $3,000.
  const capitalGainsForAgi =
    netCapitalGains >= 0
      ? netCapitalGains
      : Math.max(netCapitalGains, -CAPITAL_LOSS_DEDUCTION_CAP);

  const grossIncome = round2(
    grossWages + ordinaryInterest + ordinaryDividends + netCapitalGains
  );

  // 2. Adjusted Gross Income (AGI) -------------------------------------------
  const adjustedGrossIncome = round2(
    grossWages +
      ordinaryInterest +
      ordinaryDividends +
      capitalGainsForAgi -
      adjustments
  );
  const agi = Math.max(0, adjustedGrossIncome);

  // 3. Deduction selection ---------------------------------------------------
  //    ASSUMPTION B: use 2024 standard deductions regardless of tax year.
  const standardDeduction = STANDARD_DEDUCTIONS_2024[filingStatus];
  const useItemized = itemizedDeductions > standardDeduction;
  const deductionUsed = useItemized ? itemizedDeductions : standardDeduction;

  // 4. Taxable income --------------------------------------------------------
  const taxableIncome = Math.max(0, round2(agi - deductionUsed));

  // 5. Apply tax brackets ----------------------------------------------------
  //    ASSUMPTION B: use 2024 brackets regardless of taxYear.
  const brackets = BRACKETS_2024[filingStatus];
  const { breakdown: bracketBreakdown, total: federalTaxLiability } =
    applyBrackets(taxableIncome, brackets);

  // 6. Derived rates ---------------------------------------------------------
  const effectiveTaxRate =
    grossIncome > 0 ? round2(federalTaxLiability / grossIncome) : 0;

  const marginalRate =
    bracketBreakdown.length > 0
      ? bracketBreakdown[bracketBreakdown.length - 1].rate
      : 0;

  return {
    taxYear,
    filingStatus,
    grossIncome,
    adjustedGrossIncome: round2(agi),
    deductionUsed,
    standardDeductionUsed: !useItemized,
    taxableIncome,
    bracketBreakdown,
    federalTaxLiability,
    effectiveTaxRate,
    marginalRate,
  };
}
