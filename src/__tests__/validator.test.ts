import { validate } from "../validator";

describe("validate", () => {
  const validInput = {
    taxpayerId: "12345678A",
    fiscalYear: 2024,
    grossIncome: 30000,
    deductions: 5000,
  };

  it("returns no issues for a valid input", () => {
    expect(validate(validInput)).toEqual([]);
  });

  it("flags a missing taxpayerId", () => {
    const issues = validate({ ...validInput, taxpayerId: "" });
    expect(issues).toContain("taxpayerId is required");
  });

  it("flags a negative grossIncome", () => {
    const issues = validate({ ...validInput, grossIncome: -1 });
    expect(issues).toContain("grossIncome must be a non-negative number");
  });

  it("flags deductions exceeding grossIncome", () => {
    const issues = validate({ ...validInput, deductions: 40000 });
    expect(issues).toContain("deductions cannot exceed grossIncome");
  });

  it("flags an invalid fiscalYear", () => {
    const issues = validate({ ...validInput, fiscalYear: 1800 });
    expect(issues).toContain("fiscalYear must be a valid year");
  });
});
