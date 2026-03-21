# Product definition

## Purpose
Automate data intake, calculations, checks, and generation of outputs for ES tax workflows.

## Initial scope
1. Accept structured input data
2. Run tax-related calculations
3. Validate data and flag issues
4. Generate structured outputs for downstream use

## AEAT input schema

The input payload is defined in `src/types.ts` as the `AEATInput` interface.

### Required fields

| Field | Type | Description |
|---|---|---|
| `taxpayer` | `TaxpayerInfo` | Taxpayer identification details |
| `taxpayer.taxId` | `string` | NIF (DNI) or NIE |
| `taxpayer.firstName` | `string` | Given name |
| `taxpayer.firstSurname` | `string` | First surname |
| `taxpayer.dateOfBirth` | `string` | Date of birth (ISO 8601, YYYY-MM-DD) |
| `taxpayer.autonomousCommunity` | `string` | Two-letter autonomous community code |
| `taxYear` | `number` | Fiscal year (integer, 1990–2100) |
| `incomeFromWork` | `IncomeFromWork` | Employment and pension income |
| `incomeFromWork.grossSalary` | `number` | Gross salary (non-negative) |

### Optional fields

| Field | Type | Description |
|---|---|---|
| `taxpayer.secondSurname` | `string` | Second surname |
| `taxpayer.jointFiling` | `boolean` | Joint declaration (defaults to false) |
| `incomeFromWork.pensionIncome` | `number` | Pension income (non-negative) |
| `incomeFromWork.otherWorkIncome` | `number` | Other employment income (non-negative) |
| `capitalIncome` | `CapitalIncome` | Savings / investment income |
| `capitalIncome.dividends` | `number` | Dividend income |
| `capitalIncome.interestIncome` | `number` | Interest income |
| `capitalIncome.investmentGains` | `number` | Capital gains or losses (may be negative) |
| `propertyIncome` | `PropertyIncome` | Real-estate income |
| `propertyIncome.grossRentalIncome` | `number` | Gross rental receipts (non-negative) |
| `propertyIncome.rentalDeductibleExpenses` | `number` | Deductible rental expenses (non-negative) |
| `propertyIncome.hasHabitualResidenceLetting` | `boolean` | 60 % reduction applies (Art. 23.2 LIRPF) |
| `propertyIncome.imputedPropertyIncome` | `number` | Imputed income from urban properties (non-negative) |
| `deductions` | `Deductions` | Personal and family deductions |
| `deductions.pensionPlanContributions` | `number` | Pension-plan contributions (non-negative) |
| `deductions.unionAndProfessionalFees` | `number` | Union / professional body fees (non-negative) |
| `deductions.habitualResidenceMortgageInterest` | `number` | Mortgage interest — pre-2013 transitional deduction (non-negative) |
| `deductions.donations` | `number` | Qualifying charitable donations (non-negative) |
| `deductions.otherDeductions` | `number` | Other state-level deductions (non-negative) |

### Validation

`validateAEATInput(input: unknown): ValidationResult` returns a list of structured errors.
`assertValidAEATInput(input: unknown): asserts input is AEATInput` throws on invalid input.

Both are exported from `src/validator.ts` and re-exported from `src/index.ts`.

