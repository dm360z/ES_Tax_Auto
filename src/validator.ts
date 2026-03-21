import { AEATInput } from './types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Spanish NIF: 8 digits + 1 uppercase letter. */
const NIF_REGEX = /^\d{8}[A-Z]$/;

/** Spanish NIE: X/Y/Z + 7 digits + 1 uppercase letter. */
const NIE_REGEX = /^[XYZ]\d{7}[A-Z]$/;

/** ISO 8601 date: YYYY-MM-DD. */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Two-letter autonomous community codes used in Spain. */
const AUTONOMOUS_COMMUNITY_CODES = new Set([
  'AN', 'AR', 'AS', 'IB', 'CN', 'CB', 'CL', 'CM',
  'CT', 'VC', 'EX', 'GA', 'MD', 'MC', 'NC', 'PV',
  'LR', 'CE', 'ML',
]);

function isValidTaxId(taxId: string): boolean {
  return NIF_REGEX.test(taxId) || NIE_REGEX.test(taxId);
}

function isValidDate(date: string): boolean {
  if (!DATE_REGEX.test(date)) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
}

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

/**
 * Validates an AEATInput payload and returns a ValidationResult.
 * Returns { valid: true, errors: [] } when the payload is valid.
 */
export function validateAEATInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (input === null || typeof input !== 'object') {
    return { valid: false, errors: [{ field: 'root', message: 'Input must be a non-null object.' }] };
  }

  const data = input as Record<string, unknown>;

  // --- taxYear ---
  if (!('taxYear' in data)) {
    errors.push({ field: 'taxYear', message: 'taxYear is required.' });
  } else {
    const year = data['taxYear'];
    if (typeof year !== 'number' || !Number.isInteger(year) || year < 1990 || year > 2100) {
      errors.push({ field: 'taxYear', message: 'taxYear must be an integer between 1990 and 2100.' });
    }
  }

  // --- taxpayer ---
  if (!('taxpayer' in data) || data['taxpayer'] === null || typeof data['taxpayer'] !== 'object') {
    errors.push({ field: 'taxpayer', message: 'taxpayer is required and must be an object.' });
  } else {
    const tp = data['taxpayer'] as Record<string, unknown>;

    if (typeof tp['taxId'] !== 'string' || !isValidTaxId(tp['taxId'])) {
      errors.push({ field: 'taxpayer.taxId', message: 'taxId must be a valid Spanish NIF or NIE.' });
    }
    if (typeof tp['firstName'] !== 'string' || tp['firstName'].trim() === '') {
      errors.push({ field: 'taxpayer.firstName', message: 'firstName is required.' });
    }
    if (typeof tp['firstSurname'] !== 'string' || tp['firstSurname'].trim() === '') {
      errors.push({ field: 'taxpayer.firstSurname', message: 'firstSurname is required.' });
    }
    if ('secondSurname' in tp && tp['secondSurname'] !== undefined) {
      if (typeof tp['secondSurname'] !== 'string') {
        errors.push({ field: 'taxpayer.secondSurname', message: 'secondSurname must be a string when provided.' });
      }
    }
    if (typeof tp['dateOfBirth'] !== 'string' || !isValidDate(tp['dateOfBirth'])) {
      errors.push({ field: 'taxpayer.dateOfBirth', message: 'dateOfBirth must be a valid ISO 8601 date (YYYY-MM-DD).' });
    }
    if (typeof tp['autonomousCommunity'] !== 'string' || !AUTONOMOUS_COMMUNITY_CODES.has(tp['autonomousCommunity'])) {
      errors.push({ field: 'taxpayer.autonomousCommunity', message: 'autonomousCommunity must be a valid two-letter Spanish autonomous community code.' });
    }
    if ('jointFiling' in tp && tp['jointFiling'] !== undefined) {
      if (typeof tp['jointFiling'] !== 'boolean') {
        errors.push({ field: 'taxpayer.jointFiling', message: 'jointFiling must be a boolean when provided.' });
      }
    }
  }

  // --- incomeFromWork ---
  if (!('incomeFromWork' in data) || data['incomeFromWork'] === null || typeof data['incomeFromWork'] !== 'object') {
    errors.push({ field: 'incomeFromWork', message: 'incomeFromWork is required and must be an object.' });
  } else {
    const ifw = data['incomeFromWork'] as Record<string, unknown>;

    if (!('grossSalary' in ifw) || typeof ifw['grossSalary'] !== 'number') {
      errors.push({ field: 'incomeFromWork.grossSalary', message: 'grossSalary is required and must be a number.' });
    } else if (!isNonNegative(ifw['grossSalary'] as number)) {
      errors.push({ field: 'incomeFromWork.grossSalary', message: 'grossSalary must be a non-negative finite number.' });
    }
    for (const field of ['pensionIncome', 'otherWorkIncome'] as const) {
      if (field in ifw && ifw[field] !== undefined) {
        if (typeof ifw[field] !== 'number' || !isNonNegative(ifw[field] as number)) {
          errors.push({ field: `incomeFromWork.${field}`, message: `${field} must be a non-negative finite number when provided.` });
        }
      }
    }
  }

  // --- capitalIncome (optional) ---
  if ('capitalIncome' in data && data['capitalIncome'] !== undefined) {
    if (data['capitalIncome'] === null || typeof data['capitalIncome'] !== 'object') {
      errors.push({ field: 'capitalIncome', message: 'capitalIncome must be an object when provided.' });
    } else {
      const ci = data['capitalIncome'] as Record<string, unknown>;
      for (const field of ['dividends', 'interestIncome', 'investmentGains'] as const) {
        if (field in ci && ci[field] !== undefined) {
          if (typeof ci[field] !== 'number' || !Number.isFinite(ci[field] as number)) {
            errors.push({ field: `capitalIncome.${field}`, message: `${field} must be a finite number when provided.` });
          }
        }
      }
    }
  }

  // --- propertyIncome (optional) ---
  if ('propertyIncome' in data && data['propertyIncome'] !== undefined) {
    if (data['propertyIncome'] === null || typeof data['propertyIncome'] !== 'object') {
      errors.push({ field: 'propertyIncome', message: 'propertyIncome must be an object when provided.' });
    } else {
      const pi = data['propertyIncome'] as Record<string, unknown>;
      for (const field of ['grossRentalIncome', 'rentalDeductibleExpenses', 'imputedPropertyIncome'] as const) {
        if (field in pi && pi[field] !== undefined) {
          if (typeof pi[field] !== 'number' || !isNonNegative(pi[field] as number)) {
            errors.push({ field: `propertyIncome.${field}`, message: `${field} must be a non-negative finite number when provided.` });
          }
        }
      }
      if ('hasHabitualResidenceLetting' in pi && pi['hasHabitualResidenceLetting'] !== undefined) {
        if (typeof pi['hasHabitualResidenceLetting'] !== 'boolean') {
          errors.push({ field: 'propertyIncome.hasHabitualResidenceLetting', message: 'hasHabitualResidenceLetting must be a boolean when provided.' });
        }
      }
    }
  }

  // --- deductions (optional) ---
  if ('deductions' in data && data['deductions'] !== undefined) {
    if (data['deductions'] === null || typeof data['deductions'] !== 'object') {
      errors.push({ field: 'deductions', message: 'deductions must be an object when provided.' });
    } else {
      const ded = data['deductions'] as Record<string, unknown>;
      for (const field of [
        'pensionPlanContributions',
        'unionAndProfessionalFees',
        'habitualResidenceMortgageInterest',
        'donations',
        'otherDeductions',
      ] as const) {
        if (field in ded && ded[field] !== undefined) {
          if (typeof ded[field] !== 'number' || !isNonNegative(ded[field] as number)) {
            errors.push({ field: `deductions.${field}`, message: `${field} must be a non-negative finite number when provided.` });
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an AEATInput and throws if invalid.
 * Use this when the caller wants to fail fast.
 */
export function assertValidAEATInput(input: unknown): asserts input is AEATInput {
  const result = validateAEATInput(input);
  if (!result.valid) {
    const messages = result.errors.map(e => `${e.field}: ${e.message}`).join('\n');
    throw new Error(`Invalid AEAT input:\n${messages}`);
  }
}
