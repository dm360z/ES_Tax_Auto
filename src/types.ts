/**
 * AEAT (Agencia Estatal de Administración Tributaria) tax workflow input schema.
 * Covers the Spanish personal income tax return (Modelo 100 / IRPF).
 */

/** Spanish tax identification number (NIF/NIE/CIF). */
export type TaxId = string;

/** Four-digit fiscal year, e.g. 2024. */
export type TaxYear = number;

/** Taxpayer identification details. */
export interface TaxpayerInfo {
  /** NIF (DNI), NIE, or CIF — required. */
  taxId: TaxId;
  /** First surname — required. */
  firstSurname: string;
  /** Second surname — optional. */
  secondSurname?: string;
  /** Given name — required. */
  firstName: string;
  /** Date of birth (ISO 8601, YYYY-MM-DD) — required. */
  dateOfBirth: string;
  /** Spanish autonomous community of residence (two-letter code) — required. */
  autonomousCommunity: string;
  /** Whether the taxpayer files jointly (declaración conjunta) — optional, defaults to false. */
  jointFiling?: boolean;
}

/** Employment and pension income. */
export interface IncomeFromWork {
  /** Gross salary from employment contracts (rendimientos del trabajo). */
  grossSalary: number;
  /** Pension income received (pensiones). */
  pensionIncome?: number;
  /** Other work-related income not captured above. */
  otherWorkIncome?: number;
}

/** Capital income (savings income). */
export interface CapitalIncome {
  /** Dividends and other returns on equity (rendimientos del capital mobiliario). */
  dividends?: number;
  /** Interest income from bank accounts and fixed-income securities. */
  interestIncome?: number;
  /** Net gains from investment funds or transfers of financial assets. */
  investmentGains?: number;
}

/** Real-estate / property income. */
export interface PropertyIncome {
  /**
   * Gross rental income from properties let at market rate
   * (rendimientos del capital inmobiliario).
   */
  grossRentalIncome?: number;
  /**
   * Deductible expenses directly linked to rental activity
   * (e.g. mortgage interest, repairs, IBI, community fees).
   */
  rentalDeductibleExpenses?: number;
  /**
   * Whether any property is let as habitual residence (vivienda habitual)
   * — affects the 60 % net rental income reduction (Art. 23.2 LIRPF).
   */
  hasHabitualResidenceLetting?: boolean;
  /**
   * Imputed income from urban properties not let and not the taxpayer's
   * habitual residence (imputación de rentas inmobiliarias).
   */
  imputedPropertyIncome?: number;
}

/** Personal and family deductions. */
export interface Deductions {
  /** Contributions to pension plans (planes de pensiones). */
  pensionPlanContributions?: number;
  /** Union fees and compulsory professional-body fees. */
  unionAndProfessionalFees?: number;
  /** Mortgage interest on habitual residence acquired before 2013 (deducción por vivienda habitual — transitional). */
  habitualResidenceMortgageInterest?: number;
  /** Donations to qualifying NGOs / foundations under Ley 49/2002. */
  donations?: number;
  /** Other state-level personal deductions not listed above. */
  otherDeductions?: number;
}

/**
 * Full input payload for the AEAT tax workflow.
 *
 * Required top-level fields: `taxpayer`, `taxYear`, `incomeFromWork`.
 * All other top-level fields are optional but recommended when applicable.
 */
export interface AEATInput {
  /** Taxpayer identification — required. */
  taxpayer: TaxpayerInfo;
  /** Fiscal year being declared — required. */
  taxYear: TaxYear;
  /** Income from employment and pensions — required. */
  incomeFromWork: IncomeFromWork;
  /** Capital / savings income — optional. */
  capitalIncome?: CapitalIncome;
  /** Property / real-estate income — optional. */
  propertyIncome?: PropertyIncome;
  /** Applicable deductions — optional. */
  deductions?: Deductions;
}
