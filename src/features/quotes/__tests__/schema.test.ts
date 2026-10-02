import { describe, it, expect } from "vitest";
import { quoteFormSchema } from "../schema";

const base = {
  clientId: "c-1",
  title: "Nueva cotización",
  taxRate: 0,
  paymentTerms: "100% anticipo",
  validUntil: "2026-12-31",
};

describe("HU-07.2 Crear cotización", () => {
  it("requires at least one item", () => {
    const result = quoteFormSchema.safeParse({ ...base, items: [] });
    expect(result.success).toBe(false);
  });

  it("requires item quantity greater than 0", () => {
    const result = quoteFormSchema.safeParse({
      ...base,
      items: [{ id: "1", description: "Item", quantity: 0, unitPriceCents: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("requires item description", () => {
    const result = quoteFormSchema.safeParse({
      ...base,
      items: [{ id: "1", description: "", quantity: 1, unitPriceCents: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid quote with at least one item", () => {
    const result = quoteFormSchema.safeParse({
      ...base,
      items: [{ id: "1", description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });
    expect(result.success).toBe(true);
  });
});
