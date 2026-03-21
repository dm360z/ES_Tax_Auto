/**
 * Structured input schema for the ES (Spain) tax processing pipeline.
 *
 * This module defines all TypeScript interfaces representing the full
 * input object for a Spanish income tax (IRPF) calculation workflow.
 * It is the foundation for validation and calculation stages.
 */

// ---------------------------------------------------------------------------
// Taxpayer identification
// ---------------------------------------------------------------------------

/** Residency status for tax purposes within Spain */
export type ResidencyStatus = "resident" | "non-resident";

/** Civil/marital status affecting joint filing eligibility */
export type CivilStatus = "single" | "married" | "divorced" | "widowed" | "legal-partnership";

/** Taxpayer identification and personal data */
export interface TaxpayerInfo {
  /** Spanish tax identification number (NIF/NIE) */
  nif: string;
  /** Full legal first name */
  firstName: string;
  /** Full legal surname(s) */
  lastName: string;
  /** Date of birth in ISO 8601 format (YYYY-MM-DD) */
  dateOfBirth: string;
  /** Residency status for the tax year */
  residencyStatus: ResidencyStatus;
  /** Civil/marital status at end of the tax year */
  civilStatus: CivilStatus;
  /** Whether the taxpayer opts for joint filing (declaración conjunta) */
  jointFiling?: boolean;
}

// ---------------------------------------------------------------------------
// Income
// ---------------------------------------------------------------------------

/** Employment income details (rendimientos del trabajo) */
export interface EmploymentIncome {
  /** Gross salary received from employer(s) */
  grossSalary: number;
  /** Employer social security contributions withheld (retenciones SS) */
  socialSecurityContributions: number;
  /** Income tax withheld at source (retenciones IRPF) */
  withholdingTax: number;
  /** Non-monetary benefits in kind, if any */
  benefitsInKind?: number;
}

/** Self-employment / professional activity income (rendimientos de actividades económicas) */
export interface SelfEmploymentIncome {
  /** Gross revenue from professional or business activities */
  grossRevenue: number;
  /** Business-related deductible expenses */
  businessExpenses: number;
  /** Social security contributions paid as self-employed (autónomo) */
  autonomoContributions: number;
  /** Income tax prepayments made (pagos fraccionados) */
  prepayments?: number;
}

/** Capital income (rendimientos del capital) */
export interface CapitalIncome {
  /** Dividends received from shares */
  dividends?: number;
  /** Interest from bank accounts or bonds */
  bankInterest?: number;
  /** Net rental income from real-estate letting (after allowable expenses) */
  rentalIncome?: number;
}

/** Capital gains or losses (ganancias y pérdidas patrimoniales) */
export interface CapitalGains {
  /** Proceeds from sale of shares or funds */
  sharesProceeds?: number;
  /** Acquisition cost of sold shares or funds */
  sharesCost?: number;
  /** Proceeds from sale of real estate */
  realEstateProceeds?: number;
  /** Acquisition cost of sold real estate */
  realEstateCost?: number;
  /** Any other capital gains not classified above */
  otherGains?: number;
  /** Any other capital losses not classified above */
  otherLosses?: number;
}

/** All income sources for the tax year */
export interface Income {
  employment?: EmploymentIncome;
  selfEmployment?: SelfEmploymentIncome;
  capital?: CapitalIncome;
  capitalGains?: CapitalGains;
}

// ---------------------------------------------------------------------------
// Deductible expenses
// ---------------------------------------------------------------------------

/** Pension and retirement savings contributions (planes de pensiones) */
export interface PensionContributions {
  /** Contributions to private pension plans */
  privatePensionPlan?: number;
  /** Contributions to employer-sponsored pension plans */
  employerPensionPlan?: number;
}

/** Deductible personal and family expenses */
export interface DeductibleExpenses {
  pension?: PensionContributions;
  /** Alimony paid under a court ruling (pensión compensatoria) */
  alimonyPaid?: number;
  /** Donations to qualifying non-profit organisations */
  donations?: number;
  /** Union membership fees */
  unionFees?: number;
  /** Professional association fees legally required for the job */
  professionalFees?: number;
  /** Legal defence costs directly related to employment disputes */
  legalDefenseCosts?: number;
}

// ---------------------------------------------------------------------------
// Property
// ---------------------------------------------------------------------------

/** Type of real-estate ownership */
export type PropertyOwnership = "owned" | "rented" | "free-use";

/** Primary habitual residence details (vivienda habitual) */
export interface PrimaryResidence {
  /** Type of tenure for the primary residence */
  ownership: PropertyOwnership;
  /** Cadastral reference of the property (referencia catastral) */
  cadastralReference?: string;
  /** Cadastral value of the property (valor catastral) */
  cadastralValue?: number;
  /** Annual rent paid if the taxpayer is renting their primary residence */
  annualRentPaid?: number;
  /** Mortgage capital repaid during the tax year (for pre-2013 deduction) */
  mortgagePrincipalRepaid?: number;
  /** Mortgage interest paid during the tax year (for pre-2013 deduction) */
  mortgageInterestPaid?: number;
  /**
   * Whether the mortgage was taken out before 1 January 2013,
   * qualifying for the transitional investment-in-habitual-residence deduction.
   */
  mortgagePre2013?: boolean;
}

/** Additional (non-primary) real-estate property owned */
export interface AdditionalProperty {
  /** Cadastral reference of the property */
  cadastralReference: string;
  /** Cadastral value of the property */
  cadastralValue: number;
  /** Whether the property is let to tenants */
  isRented: boolean;
  /** Annual rental income received (gross) */
  rentalIncomeGross?: number;
  /** Deductible expenses related to this rental property */
  rentalExpenses?: number;
}

/** All property-related data for the tax year */
export interface PropertyInfo {
  primaryResidence?: PrimaryResidence;
  additionalProperties?: AdditionalProperty[];
}

// ---------------------------------------------------------------------------
// Root input schema
// ---------------------------------------------------------------------------

/**
 * Full structured input for a Spanish IRPF tax calculation.
 *
 * This is the primary entry-point type consumed by the validation
 * and calculation stages of the pipeline.
 */
export interface TaxInput {
  /** The fiscal year being declared (e.g. 2024) */
  taxYear: number;
  /** Taxpayer personal and identification details */
  taxpayer: TaxpayerInfo;
  /** All income sources for the tax year */
  income: Income;
  /** Deductible expenses and reductions */
  deductions?: DeductibleExpenses;
  /** Real-estate and property information */
  property?: PropertyInfo;
}
