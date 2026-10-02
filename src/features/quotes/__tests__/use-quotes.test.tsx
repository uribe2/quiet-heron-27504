import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useQuotes } from "../use-quotes";
import { useData } from "@/context/data-context";
import { ProvidersWrapper } from "@/test/render-with-providers";
import type { QuoteFormValues } from "../schema";

const baseValues: QuoteFormValues = {
  clientId: "c-acme",
  title: "Nueva propuesta",
  items: [{ id: "li-1", description: "Diseño", quantity: 1, unitPriceCents: 100000 }],
  taxRate: 0,
  paymentTerms: "100% anticipo",
  validUntil: "2026-12-31",
};

function useTestHooks() {
  return { quotes: useQuotes(), data: useData() };
}

describe("HU-07.2 Crear cotización", () => {
  it("creates a draft quote with an auto-assigned number", () => {
    const { result } = renderHook(() => useQuotes(), { wrapper: ProvidersWrapper });

    let created: ReturnType<typeof result.current.createQuote>;
    act(() => {
      created = result.current.createQuote(baseValues);
    });

    expect(created!.status).toBe("draft");
    expect(created!.number).toMatch(/^COT-\d{4}-\d{3}$/);
  });

  it("createQuoteFromOpportunity links the quote and moves the opportunity to 'quote' stage", () => {
    const { result } = renderHook(() => useTestHooks(), { wrapper: ProvidersWrapper });
    const opportunity = result.current.data.data.opportunities.find((o) => o.id === "o-1")!;

    act(() => {
      result.current.quotes.createQuoteFromOpportunity(opportunity, baseValues);
    });

    const updatedOpportunity = result.current.data.data.opportunities.find((o) => o.id === "o-1");
    expect(updatedOpportunity?.stage).toBe("quote");
    expect(updatedOpportunity?.quoteId).toBeDefined();
  });
});

describe("HU-07.3 Editar y gestionar estado", () => {
  it("sendQuote moves a draft to sent and appends history", () => {
    const { result } = renderHook(() => useQuotes(), { wrapper: ProvidersWrapper });
    const draft = result.current.quotes.find((q) => q.id === "q-1")!;

    act(() => {
      result.current.sendQuote(draft);
    });

    const updated = result.current.quotes.find((q) => q.id === "q-1");
    expect(updated?.status).toBe("sent");
    expect(updated?.history.at(-1)?.action).toBe("sent");
  });

  it("duplicateQuote creates a new draft copy with its own number", () => {
    const { result } = renderHook(() => useQuotes(), { wrapper: ProvidersWrapper });
    const original = result.current.quotes.find((q) => q.id === "q-3")!;

    let copy: ReturnType<typeof result.current.duplicateQuote>;
    act(() => {
      copy = result.current.duplicateQuote(original);
    });

    expect(copy!.status).toBe("draft");
    expect(copy!.number).not.toBe(original.number);
    expect(copy!.projectId).toBeUndefined();
  });
});

describe("HU-07.4 Convertir en proyecto y eliminar", () => {
  it("convertToProject creates a project and links it back to the quote", () => {
    const { result } = renderHook(() => useTestHooks(), { wrapper: ProvidersWrapper });
    const quote = result.current.data.data.quotes.find((q) => q.id === "q-1")!;

    act(() => {
      result.current.quotes.markAccepted(quote);
    });
    const accepted = result.current.data.data.quotes.find((q) => q.id === "q-1")!;

    let project: ReturnType<typeof result.current.quotes.convertToProject>;
    act(() => {
      project = result.current.quotes.convertToProject(accepted);
    });

    const updatedQuote = result.current.data.data.quotes.find((q) => q.id === "q-1");
    expect(updatedQuote?.projectId).toBe(project!.id);
    expect(updatedQuote?.history.at(-1)?.action).toBe("converted");
  });

  it("isDeletable is false once a quote has a linked project", () => {
    const { result } = renderHook(() => useQuotes(), { wrapper: ProvidersWrapper });
    const converted = result.current.quotes.find((q) => q.id === "q-3")!;
    expect(result.current.isDeletable(converted)).toBe(false);
  });

  it("deleteQuote removes the quote from the list", () => {
    const { result } = renderHook(() => useQuotes(), { wrapper: ProvidersWrapper });
    const target = result.current.quotes.find((q) => q.id === "q-4")!;

    act(() => {
      result.current.deleteQuote(target);
    });

    expect(result.current.quotes.find((q) => q.id === "q-4")).toBeUndefined();
  });
});
