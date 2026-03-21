import { validateTaxInput } from "../validator";
import { TaxInput } from "../types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear().toString();

const validBase: TaxInput = {
  taxYear: currentYear,
  taxpayerName: "Ana García López",
  taxpayerNIF: "12345678Z",
  fiscalResidency: "Madrid",
};

function withOverrides(overrides: Partial<TaxInput>): TaxInput {
  return { ...validBase, ...overrides };
}

// ── Valid input ───────────────────────────────────────────────────────────────

describe("validateTaxInput – valid input", () => {
  it("accepts a minimal valid input (required fields only)", () => {
    const result = validateTaxInput(validBase);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts a fully-populated valid input", () => {
    const result = validateTaxInput({
      taxYear: "2023",
      taxpayerName: "Juan Martínez Ruiz",
      taxpayerNIF: "X1234567L",
      fiscalResidency: "Cataluña",
      dateOfBirth: "1985-06-15",
      incomeFromWork: 35000,
      selfEmploymentIncome: -1500,
      rentalIncome: 6000,
      capitalGains: -200,
      investmentIncome: 800,
      socialSecurityContributions: 2100,
      dependentChildren: 2,
      dependentRelatives: 1,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts zero-value numeric fields", () => {
    const result = validateTaxInput(
      withOverrides({ incomeFromWork: 0, investmentIncome: 0, dependentChildren: 0 })
    );
    expect(result.valid).toBe(true);
  });

  it("accepts an NIE starting with Y", () => {
    const result = validateTaxInput(withOverrides({ taxpayerNIF: "Y1234567X" }));
    expect(result.valid).toBe(true);
  });

  it("accepts a valid taxYear at the minimum boundary (2000)", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "2000" }));
    expect(result.valid).toBe(true);
  });

  it("accepts taxYear equal to the current year", () => {
    const result = validateTaxInput(withOverrides({ taxYear: currentYear }));
    expect(result.valid).toBe(true);
  });
});

// ── Required fields ───────────────────────────────────────────────────────────

describe("validateTaxInput – required fields", () => {
  const requiredFields: Array<keyof TaxInput> = [
    "taxYear",
    "taxpayerName",
    "taxpayerNIF",
    "fiscalResidency",
  ];

  for (const field of requiredFields) {
    it(`rejects input when '${field}' is missing`, () => {
      const input = { ...validBase } as Partial<TaxInput>;
      delete input[field];
      const result = validateTaxInput(input as TaxInput);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects input when '${field}' is an empty string`, () => {
      const result = validateTaxInput(withOverrides({ [field]: "" } as Partial<TaxInput>));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects input when '${field}' is whitespace only`, () => {
      const result = validateTaxInput(withOverrides({ [field]: "   " } as Partial<TaxInput>));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });
  }
});

// ── Tax year ──────────────────────────────────────────────────────────────────

describe("validateTaxInput – taxYear format and range", () => {
  it("rejects a non-numeric year string", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "abcd" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxYear")).toBe(true);
  });

  it("rejects a year with fewer than 4 digits", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "202" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxYear")).toBe(true);
  });

  it("rejects a year with more than 4 digits", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "20240" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxYear")).toBe(true);
  });

  it("rejects a year before 2000", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "1999" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxYear")).toBe(true);
  });

  it("rejects a year in the future", () => {
    const futureYear = (new Date().getFullYear() + 1).toString();
    const result = validateTaxInput(withOverrides({ taxYear: futureYear }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxYear")).toBe(true);
  });
});

// ── NIF / NIE ─────────────────────────────────────────────────────────────────

describe("validateTaxInput – taxpayerNIF format", () => {
  it("rejects a NIF with wrong length", () => {
    const result = validateTaxInput(withOverrides({ taxpayerNIF: "1234567" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxpayerNIF")).toBe(true);
  });

  it("rejects a NIF that ends with a digit instead of a letter", () => {
    const result = validateTaxInput(withOverrides({ taxpayerNIF: "123456789" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxpayerNIF")).toBe(true);
  });

  it("rejects a NIF with special characters", () => {
    const result = validateTaxInput(withOverrides({ taxpayerNIF: "1234-678Z" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxpayerNIF")).toBe(true);
  });

  it("rejects an NIE starting with an invalid letter (e.g. A)", () => {
    const result = validateTaxInput(withOverrides({ taxpayerNIF: "A1234567L" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "taxpayerNIF")).toBe(true);
  });
});

// ── Non-negative monetary fields ─────────────────────────────────────────────

describe("validateTaxInput – non-negative numeric fields", () => {
  const fields = ["incomeFromWork", "investmentIncome", "socialSecurityContributions"] as const;

  for (const field of fields) {
    it(`rejects negative value for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: -1 }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects Infinity for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: Infinity }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects NaN for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: NaN }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });
  }
});

// ── Numeric-only fields (may be negative) ────────────────────────────────────

describe("validateTaxInput – finite numeric fields (sign-unrestricted)", () => {
  const fields = ["selfEmploymentIncome", "rentalIncome", "capitalGains"] as const;

  for (const field of fields) {
    it(`accepts negative value for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: -5000 }));
      expect(result.valid).toBe(true);
    });

    it(`rejects Infinity for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: Infinity }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects NaN for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: NaN }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });
  }
});

// ── Non-negative integer fields ───────────────────────────────────────────────

describe("validateTaxInput – non-negative integer fields", () => {
  const fields = ["dependentChildren", "dependentRelatives"] as const;

  for (const field of fields) {
    it(`rejects a negative integer for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: -1 }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects a floating-point value for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: 1.5 }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects NaN for '${field}'`, () => {
      const result = validateTaxInput(withOverrides({ [field]: NaN }));
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });
  }
});

// ── Date of birth ─────────────────────────────────────────────────────────────

describe("validateTaxInput – dateOfBirth", () => {
  it("accepts a valid dateOfBirth well before the tax year", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "2023", dateOfBirth: "1980-03-20" }));
    expect(result.valid).toBe(true);
  });

  it("rejects a date in wrong format (DD/MM/YYYY)", () => {
    const result = validateTaxInput(withOverrides({ dateOfBirth: "15/06/1985" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "dateOfBirth")).toBe(true);
  });

  it("rejects an invalid calendar date", () => {
    const result = validateTaxInput(withOverrides({ dateOfBirth: "1990-13-01" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "dateOfBirth")).toBe(true);
  });

  it("rejects a dateOfBirth equal to the last day of the tax year", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "2023", dateOfBirth: "2023-12-31" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "dateOfBirth")).toBe(true);
  });

  it("rejects a dateOfBirth after the tax year ends", () => {
    const result = validateTaxInput(withOverrides({ taxYear: "2023", dateOfBirth: "2024-01-01" }));
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "dateOfBirth")).toBe(true);
  });
});

// ── Structured errors ─────────────────────────────────────────────────────────

describe("validateTaxInput – structured error format", () => {
  it("returns multiple errors when multiple fields are invalid", () => {
    const result = validateTaxInput({
      taxYear: "badYear",
      taxpayerName: "",
      taxpayerNIF: "INVALID",
      fiscalResidency: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("each error has a non-empty 'field' and 'message'", () => {
    const result = validateTaxInput({
      taxYear: "",
      taxpayerName: "",
      taxpayerNIF: "",
      fiscalResidency: "",
    });
    for (const error of result.errors) {
      expect(typeof error.field).toBe("string");
      expect(error.field.length).toBeGreaterThan(0);
      expect(typeof error.message).toBe("string");
      expect(error.message.length).toBeGreaterThan(0);
    }
  });
});
