/**
 * Structured input for an ES (Spain) IRPF tax return.
 * All monetary amounts are in euros (EUR).
 */
export interface TaxInput {
  /** Tax year in 'YYYY' format (e.g. '2024'). Required. */
  taxYear: string;

  /** Taxpayer full name. Required. */
  taxpayerName: string;

  /** Spanish NIF / NIE identifier. Required. */
  taxpayerNIF: string;

  /** Region of fiscal residency (autonomous community). Required. */
  fiscalResidency: string;

  /** Date of birth in ISO 8601 format 'YYYY-MM-DD'. Optional. */
  dateOfBirth?: string;

  /** Income from employment (gross). Must be >= 0. */
  incomeFromWork?: number;

  /** Net income from self-employment activity. May be negative (losses). */
  selfEmploymentIncome?: number;

  /** Net rental income. May be negative (net losses). */
  rentalIncome?: number;

  /** Capital gains / losses from asset transfers. May be negative. */
  capitalGains?: number;

  /** Income from movable capital (dividends, interest, etc.). Must be >= 0. */
  investmentIncome?: number;

  /** Social Security / mutual society contributions paid. Must be >= 0. */
  socialSecurityContributions?: number;

  /** Number of dependent children. Must be a non-negative integer. */
  dependentChildren?: number;

  /** Number of dependent elderly/disabled relatives. Must be a non-negative integer. */
  dependentRelatives?: number;
}

/** A single structured validation error. */
export interface ValidationError {
  /** The field that failed validation. */
  field: string;
  /** Human-readable description of the problem. */
  message: string;
}

/** Result returned by the validator. */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
