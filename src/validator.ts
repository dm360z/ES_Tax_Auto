import { TaxInput, ValidationError, ValidationResult } from "./types";

// ── Constants ────────────────────────────────────────────────────────────────

/** Earliest tax year the system accepts (inclusive). */
const MIN_TAX_YEAR = 2000;

/** Latest tax year the system accepts: current calendar year. */
const MAX_TAX_YEAR = new Date().getFullYear();

/** Regex for a 4-digit year string. */
const TAX_YEAR_RE = /^\d{4}$/;

/**
 * Regex for a Spanish NIF (8 digits + 1 letter) or NIE (X/Y/Z + 7 digits + 1 letter).
 * Checks structural format only; does not verify the check letter.
 */
const NIF_NIE_RE = /^[0-9XYZxyz][0-9]{7}[A-Za-z]$/;

/** Regex for an ISO 8601 calendar date (YYYY-MM-DD). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── Individual rule helpers ───────────────────────────────────────────────────

function validateRequiredFields(input: TaxInput, errors: ValidationError[]): void {
  const required: Array<keyof TaxInput> = [
    "taxYear",
    "taxpayerName",
    "taxpayerNIF",
    "fiscalResidency",
  ];

  for (const field of required) {
    const value = input[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      errors.push({ field, message: `'${field}' is required and must not be empty.` });
    }
  }
}

function validateTaxYear(input: TaxInput, errors: ValidationError[]): void {
  const { taxYear } = input;
  if (!taxYear) return; // already caught by required check

  if (!TAX_YEAR_RE.test(taxYear)) {
    errors.push({
      field: "taxYear",
      message: `'taxYear' must be a 4-digit year string (e.g. '2024'). Received: '${taxYear}'.`,
    });
    return;
  }

  const year = parseInt(taxYear, 10);
  if (year < MIN_TAX_YEAR || year > MAX_TAX_YEAR) {
    errors.push({
      field: "taxYear",
      message: `'taxYear' must be between ${MIN_TAX_YEAR} and ${MAX_TAX_YEAR}. Received: ${year}.`,
    });
  }
}

function validateNIF(input: TaxInput, errors: ValidationError[]): void {
  const { taxpayerNIF } = input;
  if (!taxpayerNIF) return;

  if (!NIF_NIE_RE.test(taxpayerNIF)) {
    errors.push({
      field: "taxpayerNIF",
      message:
        "'taxpayerNIF' must be a valid Spanish NIF (8 digits + letter) or NIE (X/Y/Z + 7 digits + letter).",
    });
  }
}

function validateNonNegativeFields(input: TaxInput, errors: ValidationError[]): void {
  const nonNegativeFields: Array<keyof TaxInput> = [
    "incomeFromWork",
    "investmentIncome",
    "socialSecurityContributions",
  ];

  for (const field of nonNegativeFields) {
    const value = input[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== "number" || !isFinite(value)) {
        errors.push({ field, message: `'${field}' must be a finite number.` });
      } else if (value < 0) {
        errors.push({ field, message: `'${field}' must be >= 0. Received: ${value}.` });
      }
    }
  }
}

function validateNumericFields(input: TaxInput, errors: ValidationError[]): void {
  // Fields that must be finite numbers when provided (sign unrestricted)
  const numericFields: Array<keyof TaxInput> = [
    "selfEmploymentIncome",
    "rentalIncome",
    "capitalGains",
  ];

  for (const field of numericFields) {
    const value = input[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== "number" || !isFinite(value)) {
        errors.push({ field, message: `'${field}' must be a finite number.` });
      }
    }
  }
}

function validateNonNegativeIntegerFields(input: TaxInput, errors: ValidationError[]): void {
  const intFields: Array<keyof TaxInput> = ["dependentChildren", "dependentRelatives"];

  for (const field of intFields) {
    const value = input[field];
    if (value !== undefined && value !== null) {
      if (typeof value !== "number" || !isFinite(value) || value < 0 || !Number.isInteger(value)) {
        errors.push({
          field,
          message: `'${field}' must be a non-negative integer. Received: ${value}.`,
        });
      }
    }
  }
}

function validateDateOfBirth(input: TaxInput, errors: ValidationError[]): void {
  const { dateOfBirth } = input;
  if (!dateOfBirth) return;

  if (!ISO_DATE_RE.test(dateOfBirth)) {
    errors.push({
      field: "dateOfBirth",
      message: `'dateOfBirth' must be in ISO 8601 format 'YYYY-MM-DD'. Received: '${dateOfBirth}'.`,
    });
    return;
  }

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    errors.push({
      field: "dateOfBirth",
      message: `'dateOfBirth' is not a valid calendar date. Received: '${dateOfBirth}'.`,
    });
    return;
  }

  // Date-consistency check: taxpayer must have been born before the tax year ends
  if (input.taxYear && TAX_YEAR_RE.test(input.taxYear)) {
    const taxYearEnd = new Date(`${input.taxYear}-12-31`);
    if (dob >= taxYearEnd) {
      errors.push({
        field: "dateOfBirth",
        message: `'dateOfBirth' (${dateOfBirth}) must be before the end of the tax year (${input.taxYear}).`,
      });
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Validates a {@link TaxInput} object against all defined rules.
 *
 * Rules applied (in order):
 * 1. Required-field presence
 * 2. Tax-year format and range
 * 3. NIF/NIE structural format
 * 4. Non-negative monetary fields
 * 5. Finite numeric monetary fields (may be negative)
 * 6. Non-negative integer count fields
 * 7. Date-of-birth format and date consistency
 *
 * @param input - The tax input to validate.
 * @returns A {@link ValidationResult} containing `valid` and an array of {@link ValidationError}s.
 */
export function validateTaxInput(input: TaxInput): ValidationResult {
  const errors: ValidationError[] = [];

  validateRequiredFields(input, errors);
  validateTaxYear(input, errors);
  validateNIF(input, errors);
  validateNonNegativeFields(input, errors);
  validateNumericFields(input, errors);
  validateNonNegativeIntegerFields(input, errors);
  validateDateOfBirth(input, errors);

  return { valid: errors.length === 0, errors };
}
