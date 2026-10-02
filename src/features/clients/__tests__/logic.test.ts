import { describe, it, expect } from "vitest";
import { filterClients, getPrimaryContact, isClientNameTaken, checkClientDeletion } from "../logic";
import type { Client } from "../types";
import { createSeedData } from "@/lib/seed";

const now = new Date().toISOString();
function client(overrides: Partial<Client>): Client {
  return {
    id: "c-x",
    createdAt: now,
    updatedAt: now,
    name: "Acme",
    type: "company",
    contacts: [],
    tags: [],
    status: "active",
    ...overrides,
  };
}

describe("HU-01.1 Listar y buscar clientes", () => {
  const clients = [
    client({ id: "1", name: "Acme Corp", email: "hi@acme.com", tags: ["branding"] }),
    client({ id: "2", name: "TechCorp", email: "hi@techcorp.io", tags: ["ecommerce"] }),
    client({ id: "3", name: "Globex", status: "archived" }),
  ];

  it("filters by name case-insensitively", () => {
    expect(filterClients(clients, { search: "acme" }).map((c) => c.id)).toEqual(["1"]);
  });

  it("filters by status", () => {
    expect(filterClients(clients, { status: "archived" }).map((c) => c.id)).toEqual(["3"]);
  });

  it("filters by tag", () => {
    expect(filterClients(clients, { tag: "ecommerce" }).map((c) => c.id)).toEqual(["2"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterClients(clients, { search: "nope" })).toHaveLength(0);
  });

  it("getPrimaryContact finds the contact marked primary", () => {
    const withContacts = client({
      contacts: [
        { id: "ct-1", name: "A", isPrimary: false },
        { id: "ct-2", name: "B", isPrimary: true },
      ],
    });
    expect(getPrimaryContact(withContacts)?.id).toBe("ct-2");
  });
});

describe("HU-01.4 Archivar o eliminar cliente", () => {
  it("isClientNameTaken ignores archived clients", () => {
    const clients = [client({ id: "1", name: "Globex", status: "archived" })];
    expect(isClientNameTaken("Globex", clients)).toBe(false);
  });

  it("blocks deletion when the client has projects, quotes or invoices", () => {
    const data = createSeedData();
    const check = checkClientDeletion("c-acme", data);
    expect(check.canDelete).toBe(false);
    expect(check.relatedProjects).toBeGreaterThan(0);
  });

  it("allows deletion when the client has no projects, quotes or invoices", () => {
    const data = createSeedData();
    const check = checkClientDeletion("c-globex", data);
    expect(check.canDelete).toBe(true);
  });
});
