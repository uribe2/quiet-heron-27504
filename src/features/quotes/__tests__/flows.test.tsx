import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInvoices } from "@/features/invoices/use-invoices";
import { getUnbilledEntries } from "@/features/invoices/logic";
import { useData } from "@/context/data-context";
import { ProvidersWrapper } from "@/test/render-with-providers";

function useHooks() {
  return { invoices: useInvoices(), data: useData().data };
}

describe("HU-08.2 Crear factura (desde cotización y horas)", () => {
  it("createFromQuote copies the items and links the quoteId", () => {
    const { result } = renderHook(() => useHooks(), { wrapper: ProvidersWrapper });
    const quote = result.current.data.quotes.find((q) => q.status === "accepted")!;

    let created!: ReturnType<typeof result.current.invoices.createFromQuote>;
    act(() => {
      created = result.current.invoices.createFromQuote(quote);
    });

    expect(created.quoteId).toBe(quote.id);
    expect(created.clientId).toBe(quote.clientId);
    expect(created.status).toBe("draft");
    expect(created.items.map((i) => i.description)).toEqual(quote.items.map((i) => i.description));
    expect(created.items.map((i) => i.unitPriceCents)).toEqual(quote.items.map((i) => i.unitPriceCents));
    expect(result.current.data.invoices.some((i) => i.quoteId === quote.id)).toBe(true);
  });

  it("an accepted quote with an existing invoice is detectable so the button can be hidden", () => {
    const { result } = renderHook(() => useHooks(), { wrapper: ProvidersWrapper });
    const quote = result.current.data.quotes.find((q) => q.status === "accepted")!;
    expect(result.current.data.invoices.some((i) => i.quoteId === quote.id)).toBe(false);

    act(() => {
      result.current.invoices.createFromQuote(quote);
    });

    expect(result.current.data.invoices.some((i) => i.quoteId === quote.id)).toBe(true);
  });

  it("createFromTimeEntries marks the selected entries as invoiced, one line per entry", () => {
    const { result } = renderHook(() => useHooks(), { wrapper: ProvidersWrapper });
    const unbilled = getUnbilledEntries(result.current.data.timeEntries, "p-4");
    expect(unbilled.length).toBeGreaterThan(1);
    const picked = unbilled.slice(0, 2).map((e) => e.id);

    let created: ReturnType<typeof result.current.invoices.createFromTimeEntries>;
    act(() => {
      created = result.current.invoices.createFromTimeEntries("p-4", picked);
    });

    expect(created!.items).toHaveLength(2);
    for (const id of picked) {
      expect(result.current.data.timeEntries.find((e) => e.id === id)!.invoiceId).toBe(created!.id);
    }
    expect(getUnbilledEntries(result.current.data.timeEntries, "p-4")).toHaveLength(unbilled.length - 2);
  });

  it("does not bill entries that were not selected", () => {
    const { result } = renderHook(() => useHooks(), { wrapper: ProvidersWrapper });
    const unbilled = getUnbilledEntries(result.current.data.timeEntries, "p-4");
    const left = unbilled[unbilled.length - 1].id;

    act(() => {
      result.current.invoices.createFromTimeEntries("p-4", [unbilled[0].id]);
    });

    expect(result.current.data.timeEntries.find((e) => e.id === left)!.invoiceId).toBeUndefined();
  });
});
