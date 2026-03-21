import { calculateTax } from "../calculator";
import type { TaxInput } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function singleInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    taxYear: 2024,
    filingStatus: "single",
    grossWages: 60000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Output shape
// ---------------------------------------------------------------------------

describe("calculateTax – output shape", () => {
  it("returns all required fields", () => {
    const result = calculateTax(singleInput());
    expect(result).toHaveProperty("taxYear");
    expect(result).toHaveProperty("filingStatus");
    expect(result).toHaveProperty("grossIncome");
    expect(result).toHaveProperty("adjustedGrossIncome");
    expect(result).toHaveProperty("deductionUsed");
    expect(result).toHaveProperty("standardDeductionUsed");
    expect(result).toHaveProperty("taxableIncome");
    expect(result).toHaveProperty("bracketBreakdown");
    expect(result).toHaveProperty("federalTaxLiability");
    expect(result).toHaveProperty("effectiveTaxRate");
    expect(result).toHaveProperty("marginalRate");
  });

  it("echoes taxYear and filingStatus", () => {
    const input = singleInput({ filingStatus: "married_filing_jointly" });
    const result = calculateTax(input);
    expect(result.taxYear).toBe(2024);
    expect(result.filingStatus).toBe("married_filing_jointly");
  });
});

// ---------------------------------------------------------------------------
// Standard deduction
// ---------------------------------------------------------------------------

describe("calculateTax – standard deduction", () => {
  it("applies the standard deduction when no itemized deductions are given", () => {
    const result = calculateTax(singleInput());
    // 2024 standard deduction for single filer = $14,600
    expect(result.deductionUsed).toBe(14600);
    expect(result.standardDeductionUsed).toBe(true);
  });

  it("applies the standard deduction when itemized amount is smaller", () => {
    const result = calculateTax(singleInput({ itemizedDeductions: 5000 }));
    expect(result.deductionUsed).toBe(14600);
    expect(result.standardDeductionUsed).toBe(true);
  });

  it("uses itemized deductions when they exceed the standard deduction", () => {
    const result = calculateTax(singleInput({ itemizedDeductions: 30000 }));
    expect(result.deductionUsed).toBe(30000);
    expect(result.standardDeductionUsed).toBe(false);
  });

  it("uses married_filing_jointly standard deduction of $29,200", () => {
    const result = calculateTax(
      singleInput({ filingStatus: "married_filing_jointly", grossWages: 100000 })
    );
    expect(result.deductionUsed).toBe(29200);
  });

  it("uses head_of_household standard deduction of $21,900", () => {
    const result = calculateTax(
      singleInput({ filingStatus: "head_of_household" })
    );
    expect(result.deductionUsed).toBe(21900);
  });
});

// ---------------------------------------------------------------------------
// Gross income & AGI
// ---------------------------------------------------------------------------

describe("calculateTax – gross income and AGI", () => {
  it("sums all income streams for grossIncome", () => {
    const result = calculateTax(
      singleInput({
        grossWages: 60000,
        ordinaryInterest: 1000,
        ordinaryDividends: 500,
        shortTermCapitalGains: 2000,
        longTermCapitalGains: 1500,
      })
    );
    expect(result.grossIncome).toBe(65000);
  });

  it("reduces AGI by above-the-line adjustments", () => {
    const result = calculateTax(singleInput({ adjustments: 5000 }));
    expect(result.adjustedGrossIncome).toBe(55000);
  });

  it("AGI cannot be negative", () => {
    const result = calculateTax(
      singleInput({ grossWages: 0, adjustments: 99999 })
    );
    expect(result.adjustedGrossIncome).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Capital-loss cap (ASSUMPTION D)
// ---------------------------------------------------------------------------

describe("calculateTax – capital-loss deduction cap", () => {
  it("caps capital losses at $3,000 when computing AGI", () => {
    // grossWages=50000, net capital loss=-10000 → capped at -3000
    const result = calculateTax(
      singleInput({
        grossWages: 50000,
        shortTermCapitalGains: -10000,
      })
    );
    // AGI should be 50000 - 3000 = 47000
    expect(result.adjustedGrossIncome).toBe(47000);
  });

  it("does not cap losses that are within the $3,000 limit", () => {
    const result = calculateTax(
      singleInput({
        grossWages: 50000,
        shortTermCapitalGains: -1500,
      })
    );
    // AGI should be 50000 - 1500 = 48500
    expect(result.adjustedGrossIncome).toBe(48500);
  });

  it("does not modify positive capital gains", () => {
    const result = calculateTax(
      singleInput({ grossWages: 50000, longTermCapitalGains: 5000 })
    );
    // AGI = 50000 + 5000 = 55000
    expect(result.adjustedGrossIncome).toBe(55000);
  });
});

// ---------------------------------------------------------------------------
// Tax liability – known values
// ---------------------------------------------------------------------------

describe("calculateTax – federal tax liability", () => {
  it("computes correct tax for income fully within the 10% bracket", () => {
    // grossWages = 5000, taxable = 5000 − 14600 = 0 (can't go below 0)
    const result = calculateTax(singleInput({ grossWages: 5000 }));
    expect(result.taxableIncome).toBe(0);
    expect(result.federalTaxLiability).toBe(0);
  });

  it("computes correct tax for a low-income single filer", () => {
    // grossWages = 20000, standard deduction = 14600
    // taxable = 5400, all in 10% bracket → tax = 540
    const result = calculateTax(singleInput({ grossWages: 20000 }));
    expect(result.taxableIncome).toBe(5400);
    expect(result.federalTaxLiability).toBe(540);
    expect(result.marginalRate).toBe(0.10);
  });

  it("computes correct tax spanning two brackets (10% and 12%)", () => {
    // grossWages = 30000
    // taxable = 30000 − 14600 = 15400
    // 10% on first 11600 = 1160
    // 12% on next 3800 = 456
    // total = 1616
    const result = calculateTax(singleInput({ grossWages: 30000 }));
    expect(result.taxableIncome).toBe(15400);
    expect(result.federalTaxLiability).toBe(1616);
    expect(result.marginalRate).toBe(0.12);
  });

  it("computes correct tax for a 22% bracket filer", () => {
    // grossWages = 70000, taxable = 55400
    // 10% on 11600 = 1160
    // 12% on 35550 = 4266
    // 22% on 8250 = 1815
    // total = 7241
    const result = calculateTax(singleInput({ grossWages: 70000 }));
    expect(result.taxableIncome).toBe(55400);
    expect(result.federalTaxLiability).toBeCloseTo(7241, 1);
    expect(result.marginalRate).toBe(0.22);
  });

  it("returns zero liability when taxable income is zero", () => {
    const result = calculateTax(singleInput({ grossWages: 0 }));
    expect(result.federalTaxLiability).toBe(0);
    expect(result.effectiveTaxRate).toBe(0);
  });

  it("effective tax rate is between 0 and marginal rate", () => {
    const result = calculateTax(singleInput({ grossWages: 100000 }));
    expect(result.effectiveTaxRate).toBeGreaterThan(0);
    expect(result.effectiveTaxRate).toBeLessThan(result.marginalRate);
  });
});

// ---------------------------------------------------------------------------
// Bracket breakdown
// ---------------------------------------------------------------------------

describe("calculateTax – bracket breakdown", () => {
  it("bracket breakdown taxOwed sums to federalTaxLiability", () => {
    const result = calculateTax(singleInput({ grossWages: 150000 }));
    const sumFromBreakdown = result.bracketBreakdown.reduce(
      (acc, b) => acc + b.taxOwed,
      0
    );
    expect(sumFromBreakdown).toBeCloseTo(result.federalTaxLiability, 1);
  });

  it("bracket breakdown taxableIncome sums to total taxableIncome", () => {
    const result = calculateTax(singleInput({ grossWages: 150000 }));
    const sumFromBreakdown = result.bracketBreakdown.reduce(
      (acc, b) => acc + b.taxableIncome,
      0
    );
    expect(sumFromBreakdown).toBeCloseTo(result.taxableIncome, 1);
  });

  it("each bracket entry has rate, from, to, taxableIncome, taxOwed", () => {
    const result = calculateTax(singleInput({ grossWages: 60000 }));
    for (const bracket of result.bracketBreakdown) {
      expect(bracket).toHaveProperty("rate");
      expect(bracket).toHaveProperty("from");
      expect(bracket).toHaveProperty("to");
      expect(bracket).toHaveProperty("taxableIncome");
      expect(bracket).toHaveProperty("taxOwed");
    }
  });
});

// ---------------------------------------------------------------------------
// Filing status variants
// ---------------------------------------------------------------------------

describe("calculateTax – filing status variants", () => {
  it("married_filing_jointly has lower tax than single at same income", () => {
    const single = calculateTax(singleInput({ grossWages: 100000 }));
    const mfj = calculateTax(
      singleInput({
        grossWages: 100000,
        filingStatus: "married_filing_jointly",
      })
    );
    expect(mfj.federalTaxLiability).toBeLessThan(single.federalTaxLiability);
  });

  it("head_of_household produces a valid result", () => {
    const result = calculateTax(
      singleInput({ filingStatus: "head_of_household", grossWages: 60000 })
    );
    expect(result.federalTaxLiability).toBeGreaterThan(0);
  });

  it("married_filing_separately produces a valid result", () => {
    const result = calculateTax(
      singleInput({
        filingStatus: "married_filing_separately",
        grossWages: 60000,
      })
    );
    expect(result.federalTaxLiability).toBeGreaterThan(0);
  });
});
