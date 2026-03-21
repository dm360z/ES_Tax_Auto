import { TaxInput } from "./types";

/** Progressive tax brackets (taxableBase in euros, rate as fraction). */
const TAX_BRACKETS: Array<{ upTo: number; rate: number }> = [
  { upTo: 12450,  rate: 0.19 },
  { upTo: 20200,  rate: 0.24 },
  { upTo: 35200,  rate: 0.30 },
  { upTo: 60000,  rate: 0.37 },
  { upTo: 300000, rate: 0.45 },
  { upTo: Infinity, rate: 0.47 },
];

/**
 * Calculates the tax liability for the given input.
 * Returns the taxable base and the tax liability in euros.
 */
export function calculate(input: TaxInput): { taxableBase: number; taxLiability: number } {
  const taxableBase = Math.max(0, input.grossIncome - input.deductions);
  let taxLiability = 0;
  let remaining = taxableBase;
  let previousBracketLimit = 0;

  for (const bracket of TAX_BRACKETS) {
    if (remaining <= 0) break;
    const bracketWidth = bracket.upTo - previousBracketLimit;
    const taxable = Math.min(remaining, bracketWidth);
    taxLiability += taxable * bracket.rate;
    remaining -= taxable;
    previousBracketLimit = bracket.upTo;
  }

  return {
    taxableBase: Math.round(taxableBase * 100) / 100,
    taxLiability: Math.round(taxLiability * 100) / 100,
  };
}
