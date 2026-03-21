import { TaxInput, TaxOutput } from "./types";
import { validate } from "./validator";
import { calculate } from "./calculator";

/**
 * Runs the full tax workflow for a single input record:
 * validates, calculates, and returns a structured output.
 */
export function processTaxRecord(input: TaxInput): TaxOutput {
  const issues = validate(input);

  if (issues.length > 0) {
    return {
      taxpayerId: input.taxpayerId,
      fiscalYear: input.fiscalYear,
      taxableBase: 0,
      taxLiability: 0,
      issues,
    };
  }

  const { taxableBase, taxLiability } = calculate(input);

  return {
    taxpayerId: input.taxpayerId,
    fiscalYear: input.fiscalYear,
    taxableBase,
    taxLiability,
    issues: [],
  };
}
