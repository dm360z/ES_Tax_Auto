import { calculate } from "../calculator";

describe("calculate", () => {
  it("returns zero taxLiability for zero grossIncome", () => {
    const result = calculate({ taxpayerId: "X", fiscalYear: 2024, grossIncome: 0, deductions: 0 });
    expect(result.taxableBase).toBe(0);
    expect(result.taxLiability).toBe(0);
  });

  it("applies the first bracket for income within 12 450 €", () => {
    const result = calculate({ taxpayerId: "X", fiscalYear: 2024, grossIncome: 12450, deductions: 0 });
    expect(result.taxableBase).toBe(12450);
    expect(result.taxLiability).toBeCloseTo(12450 * 0.19, 2);
  });

  it("correctly handles deductions reducing the taxable base", () => {
    const result = calculate({ taxpayerId: "X", fiscalYear: 2024, grossIncome: 10000, deductions: 4000 });
    expect(result.taxableBase).toBe(6000);
    expect(result.taxLiability).toBeCloseTo(6000 * 0.19, 2);
  });

  it("applies progressive brackets for income above first bracket", () => {
    // 12 450 @ 19% + (20 200 - 12 450) @ 24%
    const result = calculate({ taxpayerId: "X", fiscalYear: 2024, grossIncome: 20200, deductions: 0 });
    const expected = 12450 * 0.19 + (20200 - 12450) * 0.24;
    expect(result.taxLiability).toBeCloseTo(expected, 2);
  });
});
