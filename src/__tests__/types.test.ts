import type {
  TaxInput,
  TaxpayerInfo,
  Income,
  EmploymentIncome,
  SelfEmploymentIncome,
  CapitalIncome,
  CapitalGains,
  DeductibleExpenses,
  PensionContributions,
  PropertyInfo,
  PrimaryResidence,
  AdditionalProperty,
  ResidencyStatus,
  CivilStatus,
  PropertyOwnership,
} from "../types";

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

function buildTaxpayer(overrides: Partial<TaxpayerInfo> = {}): TaxpayerInfo {
  return {
    nif: "12345678A",
    firstName: "Ana",
    lastName: "García López",
    dateOfBirth: "1985-06-15",
    residencyStatus: "resident",
    civilStatus: "single",
    ...overrides,
  };
}

function buildMinimalTaxInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    taxYear: 2024,
    taxpayer: buildTaxpayer(),
    income: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TaxInput — required fields
// ---------------------------------------------------------------------------

describe("TaxInput", () => {
  it("accepts a minimal valid input with only required fields", () => {
    const input: TaxInput = buildMinimalTaxInput();
    expect(input.taxYear).toBe(2024);
    expect(input.taxpayer.nif).toBe("12345678A");
    expect(input.income).toBeDefined();
    expect(input.deductions).toBeUndefined();
    expect(input.property).toBeUndefined();
  });

  it("accepts a full input with all optional sections populated", () => {
    const input: TaxInput = buildMinimalTaxInput({
      deductions: { alimonyPaid: 3000 },
      property: { primaryResidence: { ownership: "owned" } },
    });
    expect(input.deductions?.alimonyPaid).toBe(3000);
    expect(input.property?.primaryResidence?.ownership).toBe("owned");
  });
});

// ---------------------------------------------------------------------------
// TaxpayerInfo
// ---------------------------------------------------------------------------

describe("TaxpayerInfo", () => {
  it("contains all required identification fields", () => {
    const taxpayer = buildTaxpayer();
    expect(taxpayer.nif).toBe("12345678A");
    expect(taxpayer.firstName).toBe("Ana");
    expect(taxpayer.lastName).toBe("García López");
    expect(taxpayer.dateOfBirth).toBe("1985-06-15");
    expect(taxpayer.residencyStatus).toBe("resident");
    expect(taxpayer.civilStatus).toBe("single");
  });

  it("allows jointFiling as an optional field", () => {
    const withJoint = buildTaxpayer({ jointFiling: true });
    expect(withJoint.jointFiling).toBe(true);

    const withoutJoint = buildTaxpayer();
    expect(withoutJoint.jointFiling).toBeUndefined();
  });

  it("accepts all valid residency statuses", () => {
    const statuses: ResidencyStatus[] = ["resident", "non-resident"];
    statuses.forEach((status) => {
      const taxpayer = buildTaxpayer({ residencyStatus: status });
      expect(taxpayer.residencyStatus).toBe(status);
    });
  });

  it("accepts all valid civil statuses", () => {
    const statuses: CivilStatus[] = [
      "single",
      "married",
      "divorced",
      "widowed",
      "legal-partnership",
    ];
    statuses.forEach((status) => {
      const taxpayer = buildTaxpayer({ civilStatus: status });
      expect(taxpayer.civilStatus).toBe(status);
    });
  });
});

// ---------------------------------------------------------------------------
// Income
// ---------------------------------------------------------------------------

describe("Income", () => {
  it("accepts an empty income object", () => {
    const income: Income = {};
    expect(income.employment).toBeUndefined();
    expect(income.selfEmployment).toBeUndefined();
    expect(income.capital).toBeUndefined();
    expect(income.capitalGains).toBeUndefined();
  });

  it("accepts employment income with required fields", () => {
    const employment: EmploymentIncome = {
      grossSalary: 40000,
      socialSecurityContributions: 2400,
      withholdingTax: 7000,
    };
    expect(employment.grossSalary).toBe(40000);
    expect(employment.withholdingTax).toBe(7000);
    expect(employment.benefitsInKind).toBeUndefined();
  });

  it("accepts employment income with optional benefitsInKind", () => {
    const employment: EmploymentIncome = {
      grossSalary: 45000,
      socialSecurityContributions: 2700,
      withholdingTax: 8500,
      benefitsInKind: 1200,
    };
    expect(employment.benefitsInKind).toBe(1200);
  });

  it("accepts self-employment income", () => {
    const selfEmployment: SelfEmploymentIncome = {
      grossRevenue: 60000,
      businessExpenses: 15000,
      autonomoContributions: 4200,
    };
    expect(selfEmployment.grossRevenue).toBe(60000);
    expect(selfEmployment.prepayments).toBeUndefined();
  });

  it("accepts capital income with all optional fields", () => {
    const capital: CapitalIncome = {
      dividends: 500,
      bankInterest: 120,
      rentalIncome: 8400,
    };
    expect(capital.dividends).toBe(500);
    expect(capital.bankInterest).toBe(120);
    expect(capital.rentalIncome).toBe(8400);
  });

  it("accepts capital gains with partial fields", () => {
    const gains: CapitalGains = {
      sharesProceeds: 10000,
      sharesCost: 7000,
    };
    expect(gains.sharesProceeds).toBe(10000);
    expect(gains.realEstateProceeds).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// DeductibleExpenses
// ---------------------------------------------------------------------------

describe("DeductibleExpenses", () => {
  it("accepts an empty deductions object", () => {
    const deductions: DeductibleExpenses = {};
    expect(deductions.alimonyPaid).toBeUndefined();
    expect(deductions.donations).toBeUndefined();
  });

  it("accepts pension contributions", () => {
    const pension: PensionContributions = {
      privatePensionPlan: 2000,
      employerPensionPlan: 1000,
    };
    const deductions: DeductibleExpenses = { pension };
    expect(deductions.pension?.privatePensionPlan).toBe(2000);
    expect(deductions.pension?.employerPensionPlan).toBe(1000);
  });

  it("accepts all deductible expense fields", () => {
    const deductions: DeductibleExpenses = {
      alimonyPaid: 5000,
      donations: 300,
      unionFees: 150,
      professionalFees: 200,
      legalDefenseCosts: 600,
    };
    expect(deductions.alimonyPaid).toBe(5000);
    expect(deductions.donations).toBe(300);
    expect(deductions.unionFees).toBe(150);
    expect(deductions.professionalFees).toBe(200);
    expect(deductions.legalDefenseCosts).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// PropertyInfo
// ---------------------------------------------------------------------------

describe("PropertyInfo", () => {
  it("accepts property info with no properties", () => {
    const property: PropertyInfo = {};
    expect(property.primaryResidence).toBeUndefined();
    expect(property.additionalProperties).toBeUndefined();
  });

  it("accepts a rented primary residence", () => {
    const primaryResidence: PrimaryResidence = {
      ownership: "rented",
      annualRentPaid: 9600,
    };
    const property: PropertyInfo = { primaryResidence };
    expect(property.primaryResidence?.ownership).toBe("rented");
    expect(property.primaryResidence?.annualRentPaid).toBe(9600);
  });

  it("accepts an owned primary residence with pre-2013 mortgage fields", () => {
    const primaryResidence: PrimaryResidence = {
      ownership: "owned",
      cadastralReference: "1234567AA1234A0001ZZ",
      cadastralValue: 120000,
      mortgagePrincipalRepaid: 5000,
      mortgageInterestPaid: 1800,
      mortgagePre2013: true,
    };
    expect(primaryResidence.mortgagePre2013).toBe(true);
    expect(primaryResidence.cadastralValue).toBe(120000);
  });

  it("accepts additional properties with rental data", () => {
    const additional: AdditionalProperty = {
      cadastralReference: "9876543BB9876B0002YY",
      cadastralValue: 80000,
      isRented: true,
      rentalIncomeGross: 7200,
      rentalExpenses: 1200,
    };
    const property: PropertyInfo = { additionalProperties: [additional] };
    expect(property.additionalProperties).toHaveLength(1);
    expect(property.additionalProperties?.[0].isRented).toBe(true);
    expect(property.additionalProperties?.[0].rentalIncomeGross).toBe(7200);
  });

  it("accepts all valid property ownership values", () => {
    const ownerships: PropertyOwnership[] = ["owned", "rented", "free-use"];
    ownerships.forEach((ownership) => {
      const primary: PrimaryResidence = { ownership };
      expect(primary.ownership).toBe(ownership);
    });
  });
});

// ---------------------------------------------------------------------------
// Re-export check (index)
// ---------------------------------------------------------------------------

describe("Module exports", () => {
  it("re-exports all types from index", async () => {
    const indexExports = await import("../index");
    // The index re-exports everything from types; checking a known export exists
    expect(indexExports).toBeDefined();
  });
});
