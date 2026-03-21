# Agent operating instructions

## Mission
Build a structured, reliable tax-processing pipeline for ES tax workflows.

The system must:
- accept structured inputs
- validate inputs
- perform calculations
- produce structured outputs

Do NOT drift into generic app building.

---

## Source of truth (strict order)
1. GitHub Issue (task definition)
2. docs/product.md
3. Existing repository structure
4. copilot-instructions.md

If unclear → choose the narrowest valid implementation.

---

## Working style
- Work on ONE issue only
- Keep changes minimal and focused
- Do not refactor unrelated code
- Do not introduce unnecessary abstractions
- Prefer simple, explicit logic

---

## Architecture rules
This is a processing system, NOT a UI-heavy app.

Prioritise:
- data models
- validation
- calculation logic
- modular functions

Avoid:
- UI unless explicitly required
- frameworks not already present
- unnecessary services or layers

---

## Boundaries (hard rules)
Do NOT:
- introduce authentication systems
- introduce billing systems
- redesign architecture
- add external APIs unless required
- add databases unless required
- generate PDFs yet

---

## Data rules
- All inputs must be structured
- Use clear TypeScript types/interfaces
- Separate input, validation, and output layers
- No implicit assumptions in calculations

---

## Validation rules
- Validate required fields
- Validate numeric ranges
- Return structured error objects
- Do not silently fail

---

## Calculation rules
- Keep calculations modular
- No hardcoded "magic numbers" without comments
- Clearly document assumptions
- Return structured outputs

---

## Testing (minimum expectation)
- Add unit tests for:
  - validation logic
  - calculation logic
- Do not skip tests for core logic

---

## Definition of done
A task is complete ONLY if:
1. Acceptance criteria are met
2. Code is clean and minimal
3. Validation is handled properly
4. Tests exist where appropriate
5. No unnecessary features were added

---

## When uncertain
DO NOT expand scope.

Choose the smallest implementation that satisfies the issue.