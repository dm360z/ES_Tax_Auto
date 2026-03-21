/**
 * Shared type definitions for the ES Tax Auto workflow.
 *
 * Assumptions (first-pass):
 * - Supports US federal income tax only. State tax is not modelled yet.
 * - Tax year 2024 brackets and standard deductions are used as the baseline.
 *   Values are explicitly marked ASSUMPTION so they can be updated each year.
 * - Only the four standard filing statuses are supported.
 * - Income is expressed in US dollars (whole numbers or decimals).
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** IRS filing status codes. */
export type FilingStatus =
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household";

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

/**
 * Validated structured input passed to the calculation engine.
 *
 * All monetary values are in USD.
 */
export interface TaxInput {
  /** Calendar year the return covers (e.g. 2024). */
  taxYear: number;

  /** IRS filing status. */
  filingStatus: FilingStatus;

  /**
   * Gross wages and salaries (W-2 box 1 equivalent).
   * Must be >= 0.
   */
  grossWages: number;

  /**
   * Ordinary taxable interest income (1099-INT).
   * Must be >= 0. Defaults to 0 if omitted.
   */
  ordinaryInterest?: number;

  /**
   * Ordinary (non-qualified) dividend income (1099-DIV box 1a).
   * Must be >= 0. Defaults to 0 if omitted.
   */
  ordinaryDividends?: number;

  /**
   * Net short-term capital gains (or losses, expressed as a negative number).
   * For a first pass, losses are only deducted up to the $3,000 annual cap.
   */
  shortTermCapitalGains?: number;

  /**
   * Net long-term capital gains (or losses, expressed as a negative number).
   * Preferential rates are NOT applied in this first pass – they are taxed
   * at ordinary income rates as a simplifying assumption.
   */
  longTermCapitalGains?: number;

  /**
   * Above-the-line deductions (e.g. student loan interest, HSA contributions).
   * Must be >= 0. Defaults to 0 if omitted.
   */
  adjustments?: number;

  /**
   * Itemized deductions. If provided and greater than the applicable standard
   * deduction, itemized deductions are used instead.
   * Must be >= 0. Defaults to 0 if omitted.
   */
  itemizedDeductions?: number;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** A single federal income-tax bracket applied to the return. */
export interface TaxBracketResult {
  /** Lower bound of the bracket (inclusive). */
  from: number;
  /** Upper bound of the bracket (inclusive, or Infinity). */
  to: number;
  /** Marginal rate for this bracket (e.g. 0.22 = 22 %). */
  rate: number;
  /** Amount of taxable income that falls within this bracket. */
  taxableIncome: number;
  /** Tax owed for this bracket (taxableIncome * rate). */
  taxOwed: number;
}

/**
 * Structured output produced by the calculation engine.
 *
 * All monetary values are in USD, rounded to two decimal places.
 */
export interface TaxResult {
  /** Echo of the tax year used for the calculation. */
  taxYear: number;

  /** Echo of the filing status used for the calculation. */
  filingStatus: FilingStatus;

  /** Total income before any deductions or adjustments. */
  grossIncome: number;

  /** Adjusted gross income (grossIncome − above-the-line adjustments). */
  adjustedGrossIncome: number;

  /**
   * Deduction applied (the greater of standard deduction or itemized
   * deductions for the given filing status).
   */
  deductionUsed: number;

  /** Whether the standard deduction was used (false = itemized). */
  standardDeductionUsed: boolean;

  /** Income subject to federal income tax (AGI − deductionUsed). */
  taxableIncome: number;

  /** Per-bracket breakdown of how the tax liability was computed. */
  bracketBreakdown: TaxBracketResult[];

  /** Total federal income-tax liability before credits. */
  federalTaxLiability: number;

  /**
   * Effective (average) tax rate expressed as a decimal (e.g. 0.18 = 18 %).
   * Computed as federalTaxLiability / grossIncome (0 when grossIncome = 0).
   */
  effectiveTaxRate: number;

  /**
   * Marginal rate – the rate of the highest bracket that contains taxable
   * income. Returns 0 when taxable income is 0.
   */
  marginalRate: number;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Describes a single validation problem with the input. */
export interface ValidationError {
  /** Human-readable description of the problem. */
  message: string;
  /** The field name that caused the error, if applicable. */
  field?: keyof TaxInput;
}

/** Return type from the validator. */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
