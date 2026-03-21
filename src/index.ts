/**
 * Public entry point for the ES Tax Auto module.
 *
 * Exposes the validator and the calculation engine together so that consumers
 * can validate input and then compute a result in a clean two-step flow.
 *
 * @example
 * ```ts
 * import { validateTaxInput, calculateTax } from "es-tax-auto";
 *
 * const result = validateTaxInput(rawInput);
 * if (!result.valid) {
 *   console.error(result.errors);
 * } else {
 *   const tax = calculateTax(rawInput as TaxInput);
 *   console.log(tax.federalTaxLiability);
 * }
 * ```
 */

export { validateTaxInput } from "./validator";
export { calculateTax } from "./calculator";
export type {
  TaxInput,
  TaxResult,
  TaxBracketResult,
  FilingStatus,
  ValidationError,
  ValidationResult,
} from "./types";
