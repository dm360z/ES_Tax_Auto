import { validateAEATInput, assertValidAEATInput } from '../validator';
import { AEATInput } from '../types';

const validBase: AEATInput = {
  taxpayer: {
    taxId: '12345678Z',
    firstName: 'Ana',
    firstSurname: 'García',
    dateOfBirth: '1985-04-20',
    autonomousCommunity: 'MD',
  },
  taxYear: 2024,
  incomeFromWork: {
    grossSalary: 35000,
  },
};

describe('validateAEATInput', () => {
  describe('valid inputs', () => {
    it('accepts a minimal valid payload', () => {
      const result = validateAEATInput(validBase);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts a fully populated valid payload', () => {
      const full: AEATInput = {
        ...validBase,
        taxpayer: {
          ...validBase.taxpayer,
          secondSurname: 'López',
          jointFiling: true,
        },
        incomeFromWork: {
          grossSalary: 40000,
          pensionIncome: 5000,
          otherWorkIncome: 1200,
        },
        capitalIncome: {
          dividends: 800,
          interestIncome: 150,
          investmentGains: 2000,
        },
        propertyIncome: {
          grossRentalIncome: 12000,
          rentalDeductibleExpenses: 3000,
          hasHabitualResidenceLetting: true,
          imputedPropertyIncome: 600,
        },
        deductions: {
          pensionPlanContributions: 1500,
          unionAndProfessionalFees: 200,
          habitualResidenceMortgageInterest: 3000,
          donations: 100,
          otherDeductions: 50,
        },
      };
      const result = validateAEATInput(full);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts NIE as taxId', () => {
      const input = { ...validBase, taxpayer: { ...validBase.taxpayer, taxId: 'X1234567L' } };
      expect(validateAEATInput(input).valid).toBe(true);
    });

    it('accepts investmentGains as a negative number (capital loss)', () => {
      const input: AEATInput = { ...validBase, capitalIncome: { investmentGains: -500 } };
      expect(validateAEATInput(input).valid).toBe(true);
    });
  });

  describe('required field errors', () => {
    it('rejects null input', () => {
      const result = validateAEATInput(null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('root');
    });

    it('rejects non-object input', () => {
      expect(validateAEATInput('string').valid).toBe(false);
    });

    it('rejects missing taxYear', () => {
      const { taxYear: _ty, ...input } = validBase as unknown as Record<string, unknown>;
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxYear')).toBe(true);
    });

    it('rejects missing taxpayer', () => {
      const { taxpayer: _tp, ...input } = validBase as unknown as Record<string, unknown>;
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxpayer')).toBe(true);
    });

    it('rejects missing incomeFromWork', () => {
      const { incomeFromWork: _ifw, ...input } = validBase as unknown as Record<string, unknown>;
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'incomeFromWork')).toBe(true);
    });
  });

  describe('taxYear validation', () => {
    it('rejects a non-integer taxYear', () => {
      const result = validateAEATInput({ ...validBase, taxYear: 2024.5 });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxYear')).toBe(true);
    });

    it('rejects taxYear out of range', () => {
      expect(validateAEATInput({ ...validBase, taxYear: 1900 }).valid).toBe(false);
      expect(validateAEATInput({ ...validBase, taxYear: 2200 }).valid).toBe(false);
    });
  });

  describe('taxpayer validation', () => {
    it('rejects an invalid taxId', () => {
      const input = { ...validBase, taxpayer: { ...validBase.taxpayer, taxId: 'INVALID' } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxpayer.taxId')).toBe(true);
    });

    it('rejects an empty firstName', () => {
      const input = { ...validBase, taxpayer: { ...validBase.taxpayer, firstName: '  ' } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxpayer.firstName')).toBe(true);
    });

    it('rejects an invalid dateOfBirth', () => {
      const input = { ...validBase, taxpayer: { ...validBase.taxpayer, dateOfBirth: '20-04-1985' } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxpayer.dateOfBirth')).toBe(true);
    });

    it('rejects an unknown autonomousCommunity code', () => {
      const input = { ...validBase, taxpayer: { ...validBase.taxpayer, autonomousCommunity: 'XX' } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxpayer.autonomousCommunity')).toBe(true);
    });

    it('rejects a non-boolean jointFiling', () => {
      const input = { ...validBase, taxpayer: { ...validBase.taxpayer, jointFiling: 'yes' } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'taxpayer.jointFiling')).toBe(true);
    });
  });

  describe('incomeFromWork validation', () => {
    it('rejects missing grossSalary', () => {
      const input = { ...validBase, incomeFromWork: {} };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'incomeFromWork.grossSalary')).toBe(true);
    });

    it('rejects negative grossSalary', () => {
      const input = { ...validBase, incomeFromWork: { grossSalary: -100 } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'incomeFromWork.grossSalary')).toBe(true);
    });

    it('rejects negative pensionIncome', () => {
      const input = { ...validBase, incomeFromWork: { grossSalary: 0, pensionIncome: -1 } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'incomeFromWork.pensionIncome')).toBe(true);
    });
  });

  describe('capitalIncome validation', () => {
    it('rejects non-finite dividends', () => {
      const input = { ...validBase, capitalIncome: { dividends: Infinity } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'capitalIncome.dividends')).toBe(true);
    });
  });

  describe('propertyIncome validation', () => {
    it('rejects negative grossRentalIncome', () => {
      const input = { ...validBase, propertyIncome: { grossRentalIncome: -500 } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'propertyIncome.grossRentalIncome')).toBe(true);
    });

    it('rejects non-boolean hasHabitualResidenceLetting', () => {
      const input = { ...validBase, propertyIncome: { hasHabitualResidenceLetting: 1 } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'propertyIncome.hasHabitualResidenceLetting')).toBe(true);
    });
  });

  describe('deductions validation', () => {
    it('rejects negative pensionPlanContributions', () => {
      const input = { ...validBase, deductions: { pensionPlanContributions: -100 } };
      const result = validateAEATInput(input);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'deductions.pensionPlanContributions')).toBe(true);
    });
  });
});

describe('assertValidAEATInput', () => {
  it('does not throw for a valid payload', () => {
    expect(() => assertValidAEATInput(validBase)).not.toThrow();
  });

  it('throws with a descriptive message for an invalid payload', () => {
    expect(() => assertValidAEATInput({})).toThrow(/Invalid AEAT input/);
  });
});
