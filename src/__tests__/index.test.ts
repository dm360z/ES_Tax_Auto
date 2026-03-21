import { processTaxRecord } from "../index";

describe("processTaxRecord", () => {
  it("returns issues when input is invalid", () => {
    const output = processTaxRecord({
      taxpayerId: "",
      fiscalYear: 2024,
      grossIncome: 30000,
      deductions: 0,
    });
    expect(output.issues.length).toBeGreaterThan(0);
    expect(output.taxLiability).toBe(0);
  });

  it("returns a correct output for a valid input", () => {
    const output = processTaxRecord({
      taxpayerId: "12345678A",
      fiscalYear: 2024,
      grossIncome: 30000,
      deductions: 5000,
    });
    expect(output.issues).toEqual([]);
    expect(output.taxableBase).toBe(25000);
    expect(output.taxLiability).toBeGreaterThan(0);
  });
});
