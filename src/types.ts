/** Structured input provided to the tax workflow. */
export interface TaxInput {
  /** Taxpayer identifier (NIF/CIF). */
  taxpayerId: string;
  /** Fiscal year (e.g. 2024). */
  fiscalYear: number;
  /** Gross income in euros. */
  grossIncome: number;
  /** Allowable deductions in euros. */
  deductions: number;
}

/** Result produced by the tax workflow. */
export interface TaxOutput {
  taxpayerId: string;
  fiscalYear: number;
  /** Taxable base after deductions. */
  taxableBase: number;
  /** Calculated tax liability in euros. */
  taxLiability: number;
  /** Validation issues found in the input, if any. */
  issues: string[];
}
