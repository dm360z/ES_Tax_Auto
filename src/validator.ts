import { TaxInput } from "./types";

/**
 * Validates a TaxInput record.
 * Returns a list of issue descriptions; an empty array means the input is valid.
 */
export function validate(input: TaxInput): string[] {
  const issues: string[] = [];

  if (!input.taxpayerId || input.taxpayerId.trim() === "") {
    issues.push("taxpayerId is required");
  }

  if (!Number.isInteger(input.fiscalYear) || input.fiscalYear < 1900 || input.fiscalYear > 2100) {
    issues.push("fiscalYear must be a valid year");
  }

  if (typeof input.grossIncome !== "number" || input.grossIncome < 0) {
    issues.push("grossIncome must be a non-negative number");
  }

  if (typeof input.deductions !== "number" || input.deductions < 0) {
    issues.push("deductions must be a non-negative number");
  }

  if (
    issues.length === 0 &&
    input.deductions > input.grossIncome
  ) {
    issues.push("deductions cannot exceed grossIncome");
  }

  return issues;
}
