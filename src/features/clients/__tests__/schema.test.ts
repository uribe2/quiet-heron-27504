import { describe, it, expect } from "vitest";
import { buildClientSchema } from "../schema";
import type { Client } from "../types";

const now = new Date().toISOString();
const existing: Client[] = [
  { id: "c-1", createdAt: now, updatedAt: now, name: "Acme Corp", type: "company", contacts: [], tags: [], status: "active" },
];

const validInput = {
  name: "New Client",
  type: "company" as const,
  email: "",
  phone: "",
  website: "",
  taxId: "",
  city: "",
  country: "",
  contacts: [],
  tags: [],
  source: undefined,
  notes: "",
};

describe("HU-01.2 Crear cliente", () => {
  it("accepts a valid client with a unique name", () => {
    const result = buildClientSchema(existing).safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a name that matches an active client case-insensitively", () => {
    const result = buildClientSchema(existing).safeParse({ ...validInput, name: "acme corp" });
    expect(result.success).toBe(false);
  });

  it("requires the name to be 2-100 characters", () => {
    const tooShort = buildClientSchema(existing).safeParse({ ...validInput, name: "A" });
    expect(tooShort.success).toBe(false);
  });

  it("rejects an invalid email when provided", () => {
    const result = buildClientSchema(existing).safeParse({ ...validInput, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("HU-01.3 Ver detalle y editar cliente", () => {
  it("allows editing a client to keep its own name (excludeId)", () => {
    const result = buildClientSchema(existing, "c-1").safeParse({ ...validInput, name: "Acme Corp" });
    expect(result.success).toBe(true);
  });

  it("requires exactly one primary contact when contacts exist", () => {
    const noPrimary = buildClientSchema(existing).safeParse({
      ...validInput,
      contacts: [{ id: "ct-1", name: "Jane", isPrimary: false, role: "", email: "", phone: "" }],
    });
    expect(noPrimary.success).toBe(false);

    const onePrimary = buildClientSchema(existing).safeParse({
      ...validInput,
      contacts: [{ id: "ct-1", name: "Jane", isPrimary: true, role: "", email: "", phone: "" }],
    });
    expect(onePrimary.success).toBe(true);
  });

  it("rejects more than one primary contact", () => {
    const result = buildClientSchema(existing).safeParse({
      ...validInput,
      contacts: [
        { id: "ct-1", name: "Jane", isPrimary: true, role: "", email: "", phone: "" },
        { id: "ct-2", name: "John", isPrimary: true, role: "", email: "", phone: "" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
