import { describe, it, expect } from "vitest";
import { projectFormSchema } from "../schema";

const base = {
  clientId: "c-1",
  name: "New Project",
  description: "",
  startDate: "2026-01-01",
  dueDate: "2026-02-01",
};

describe("HU-04.2 Crear proyecto", () => {
  it("requires hourlyRateCents when billingType is hourly", () => {
    const result = projectFormSchema.safeParse({ ...base, billingType: "hourly" });
    expect(result.success).toBe(false);
  });

  it("requires budgetCents when billingType is fixed", () => {
    const result = projectFormSchema.safeParse({ ...base, billingType: "fixed" });
    expect(result.success).toBe(false);
  });

  it("accepts an hourly project with a positive rate", () => {
    const result = projectFormSchema.safeParse({ ...base, billingType: "hourly", hourlyRateCents: 8500 });
    expect(result.success).toBe(true);
  });

  it("rejects a due date before the start date", () => {
    const result = projectFormSchema.safeParse({
      ...base,
      billingType: "fixed",
      budgetCents: 100000,
      dueDate: "2025-12-01",
    });
    expect(result.success).toBe(false);
  });
});
