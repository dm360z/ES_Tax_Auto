/**
 * Input validation for the ES Tax Auto workflow.
 *
 * Validation is intentionally kept separate from calculation so that
 * callers can validate and display errors before running any calculations.
 */

import type {
  TaxInput,
  FilingStatus,
  ValidationError,
  ValidationResult,
} from "./types";

// ---------------------------------------------------------------------------
// Supported filing statuses
// ---------------------------------------------------------------------------

const VALID_FILING_STATUSES: FilingStatus[] = [
  "single",
  "married_filing_jointly",
  "married_filing_separately",
  "head_of_household",
];

// ---------------------------------------------------------------------------
// Supported tax years
// ---------------------------------------------------------------------------

// ASSUMPTION: Only tax years 2020–2030 are accepted in this first pass.
const MIN_TAX_YEAR = 2020;
const MAX_TAX_YEAR = 2030;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return (
    typeof value === "number" && isFinite(value) && value >= 0
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validates a {@link TaxInput} object.
 *
 * @returns A {@link ValidationResult} whose `valid` flag is true only when
 *   no errors were found.  All discovered problems are listed in `errors`.
 */
export function validateTaxInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (input === null || typeof input !== "object") {
    errors.push({ message: "Input must be a non-null object." });
    return { valid: false, errors };
  }

  const raw = input as Record<string, unknown>;

  // taxYear ------------------------------------------------------------------
  if (!Number.isInteger(raw.taxYear)) {
    errors.push({
      message: "taxYear must be an integer.",
      field: "taxYear",
    });
  } else {
    const year = raw.taxYear as number;
    if (year < MIN_TAX_YEAR || year > MAX_TAX_YEAR) {
      errors.push({
        message: `taxYear must be between ${MIN_TAX_YEAR} and ${MAX_TAX_YEAR}.`,
        field: "taxYear",
      });
    }
  }

  // filingStatus -------------------------------------------------------------
  if (!VALID_FILING_STATUSES.includes(raw.filingStatus as FilingStatus)) {
    errors.push({
      message: `filingStatus must be one of: ${VALID_FILING_STATUSES.join(", ")}.`,
      field: "filingStatus",
    });
  }

  // grossWages ---------------------------------------------------------------
  if (!isNonNegativeFiniteNumber(raw.grossWages)) {
    errors.push({
      message: "grossWages must be a non-negative finite number.",
      field: "grossWages",
    });
  }

  // ordinaryInterest (optional) ---------------------------------------------
  if (
    raw.ordinaryInterest !== undefined &&
    !isNonNegativeFiniteNumber(raw.ordinaryInterest)
  ) {
    errors.push({
      message: "ordinaryInterest must be a non-negative finite number.",
      field: "ordinaryInterest",
    });
  }

  // ordinaryDividends (optional) --------------------------------------------
  if (
    raw.ordinaryDividends !== undefined &&
    !isNonNegativeFiniteNumber(raw.ordinaryDividends)
  ) {
    errors.push({
      message: "ordinaryDividends must be a non-negative finite number.",
      field: "ordinaryDividends",
    });
  }

  // shortTermCapitalGains (optional) ----------------------------------------
  if (
    raw.shortTermCapitalGains !== undefined &&
    (typeof raw.shortTermCapitalGains !== "number" ||
      !isFinite(raw.shortTermCapitalGains))
  ) {
    errors.push({
      message: "shortTermCapitalGains must be a finite number.",
      field: "shortTermCapitalGains",
    });
  }

  // longTermCapitalGains (optional) -----------------------------------------
  if (
    raw.longTermCapitalGains !== undefined &&
    (typeof raw.longTermCapitalGains !== "number" ||
      !isFinite(raw.longTermCapitalGains))
  ) {
    errors.push({
      message: "longTermCapitalGains must be a finite number.",
      field: "longTermCapitalGains",
    });
  }

  // adjustments (optional) --------------------------------------------------
  if (
    raw.adjustments !== undefined &&
    !isNonNegativeFiniteNumber(raw.adjustments)
  ) {
    errors.push({
      message: "adjustments must be a non-negative finite number.",
      field: "adjustments",
    });
  }

  // itemizedDeductions (optional) -------------------------------------------
  if (
    raw.itemizedDeductions !== undefined &&
    !isNonNegativeFiniteNumber(raw.itemizedDeductions)
  ) {
    errors.push({
      message: "itemizedDeductions must be a non-negative finite number.",
      field: "itemizedDeductions",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
