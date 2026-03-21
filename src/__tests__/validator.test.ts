import { validateTaxInput } from "../validator";

describe("validateTaxInput", () => {
  const validBase = {
    taxYear: 2024,
    filingStatus: "single",
    grossWages: 80000,
  };

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it("passes for a minimal valid input", () => {
    const result = validateTaxInput(validBase);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("passes for a fully-populated valid input", () => {
    const result = validateTaxInput({
      taxYear: 2024,
      filingStatus: "married_filing_jointly",
      grossWages: 120000,
      ordinaryInterest: 500,
      ordinaryDividends: 1000,
      shortTermCapitalGains: -2000,
      longTermCapitalGains: 5000,
      adjustments: 3000,
      itemizedDeductions: 25000,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("passes for each supported filing status", () => {
    const statuses = [
      "single",
      "married_filing_jointly",
      "married_filing_separately",
      "head_of_household",
    ];
    for (const filingStatus of statuses) {
      const result = validateTaxInput({ ...validBase, filingStatus });
      expect(result.valid).toBe(true);
    }
  });

  // -------------------------------------------------------------------------
  // Type guard
  // -------------------------------------------------------------------------

  it("fails for non-object input", () => {
    expect(validateTaxInput(null).valid).toBe(false);
    expect(validateTaxInput(42).valid).toBe(false);
    expect(validateTaxInput("string").valid).toBe(false);
  });

  // -------------------------------------------------------------------------
  // taxYear
  // -------------------------------------------------------------------------

  it("fails when taxYear is missing", () => {
    const { taxYear: _omitted, ...rest } = validBase;
    const result = validateTaxInput(rest);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxYear")).toBe(true);
  });

  it("fails when taxYear is out of range", () => {
    const result = validateTaxInput({ ...validBase, taxYear: 2019 });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("taxYear");
  });

  it("fails when taxYear is a float", () => {
    const result = validateTaxInput({ ...validBase, taxYear: 2024.5 });
    expect(result.valid).toBe(false);
  });

  // -------------------------------------------------------------------------
  // filingStatus
  // -------------------------------------------------------------------------

  it("fails for an unknown filing status", () => {
    const result = validateTaxInput({ ...validBase, filingStatus: "unknown" });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("filingStatus");
  });

  // -------------------------------------------------------------------------
  // grossWages
  // -------------------------------------------------------------------------

  it("fails when grossWages is negative", () => {
    const result = validateTaxInput({ ...validBase, grossWages: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("grossWages");
  });

  it("fails when grossWages is Infinity", () => {
    const result = validateTaxInput({ ...validBase, grossWages: Infinity });
    expect(result.valid).toBe(false);
  });

  it("passes when grossWages is 0", () => {
    const result = validateTaxInput({ ...validBase, grossWages: 0 });
    expect(result.valid).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Optional numeric fields
  // -------------------------------------------------------------------------

  it("fails when ordinaryInterest is negative", () => {
    const result = validateTaxInput({ ...validBase, ordinaryInterest: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors[0].field).toBe("ordinaryInterest");
  });

  it("fails when ordinaryDividends is not a number", () => {
    const result = validateTaxInput({
      ...validBase,
      ordinaryDividends: "five hundred" as unknown as number,
    });
    expect(result.valid).toBe(false);
  });

  it("fails when adjustments is Infinity", () => {
    const result = validateTaxInput({ ...validBase, adjustments: Infinity });
    expect(result.valid).toBe(false);
  });

  it("fails when itemizedDeductions is negative", () => {
    const result = validateTaxInput({ ...validBase, itemizedDeductions: -100 });
    expect(result.valid).toBe(false);
  });

  it("fails when shortTermCapitalGains is Infinity", () => {
    const result = validateTaxInput({
      ...validBase,
      shortTermCapitalGains: Infinity,
    });
    expect(result.valid).toBe(false);
  });

  it("allows negative capital gains (losses)", () => {
    const result = validateTaxInput({
      ...validBase,
      shortTermCapitalGains: -500,
      longTermCapitalGains: -1000,
    });
    expect(result.valid).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Multiple errors
  // -------------------------------------------------------------------------

  it("collects multiple errors at once", () => {
    const result = validateTaxInput({
      taxYear: 1900,
      filingStatus: "invalid",
      grossWages: -5000,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
