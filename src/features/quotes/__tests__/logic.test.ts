import { describe, it, expect } from "vitest";
import { nextQuoteNumber, isQuoteEditable, isQuoteLocked, canDeleteQuote, isQuoteUnanswered, filterQuotes } from "../logic";
import type { Quote } from "../types";

const now = new Date().toISOString();
function quote(overrides: Partial<Quote>): Quote {
  return {
    id: "q-x",
    createdAt: now,
    updatedAt: now,
    number: "COT-2026-001",
    clientId: "c-1",
    title: "Quote",
    items: [{ id: "li-1", description: "Item", quantity: 1, unitPriceCents: 1000 }],
    taxRate: 0,
    paymentTerms: "100%",
    validUntil: "2026-12-31",
    status: "draft",
    history: [],
    ...overrides,
  };
}

describe("HU-07.1 Listar cotizaciones", () => {
  it("nextQuoteNumber increments sequentially per year", () => {
    const quotes = [quote({ number: "COT-2026-001" }), quote({ number: "COT-2026-002" })];
    expect(nextQuoteNumber(quotes, "2026")).toBe("COT-2026-003");
  });

  it("nextQuoteNumber starts at 001 for a new year", () => {
    expect(nextQuoteNumber([], "2027")).toBe("COT-2027-001");
  });

  it("filterQuotes matches by number or title", () => {
    const quotes = [quote({ id: "1", number: "COT-2026-001", title: "Sitio web" }), quote({ id: "2", number: "COT-2026-002", title: "SEO" })];
    expect(filterQuotes(quotes, { search: "seo" }).map((q) => q.id)).toEqual(["2"]);
  });

  it("isQuoteUnanswered flags quotes sent more than 7 days ago", () => {
    const sentNine = quote({ status: "sent", history: [{ at: "2026-01-01T00:00:00.000Z", action: "sent" }] });
    expect(isQuoteUnanswered(sentNine, "2026-01-11")).toBe(true);
    expect(isQuoteUnanswered(sentNine, "2026-01-05")).toBe(false);
  });
});

describe("HU-07.3 Editar y gestionar estado", () => {
  it("draft and sent quotes are editable", () => {
    expect(isQuoteEditable(quote({ status: "draft" }))).toBe(true);
    expect(isQuoteEditable(quote({ status: "sent" }))).toBe(true);
  });

  it("accepted and rejected quotes are locked", () => {
    expect(isQuoteLocked(quote({ status: "accepted" }))).toBe(true);
    expect(isQuoteLocked(quote({ status: "rejected" }))).toBe(true);
    expect(isQuoteLocked(quote({ status: "draft" }))).toBe(false);
  });
});

describe("HU-07.4 Convertir en proyecto y eliminar", () => {
  it("canDeleteQuote is false once converted into a project", () => {
    expect(canDeleteQuote(quote({ projectId: "p-1" }))).toBe(false);
    expect(canDeleteQuote(quote({}))).toBe(true);
  });
});
