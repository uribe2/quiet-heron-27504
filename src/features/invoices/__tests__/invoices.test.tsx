import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, screen, fireEvent } from "@testing-library/react";
import { useInvoices } from "../use-invoices";
import { useData } from "@/context/data-context";
import { ProvidersWrapper, renderWithProviders } from "@/test/render-with-providers";
import { setMockToday, getToday, addDays } from "@/lib/dates";
import {
  nextInvoiceNumber,
  getInvoiceFinancials,
  getInvoiceKpis,
  filterInvoices,
  getUnbilledEntries,
  canCancelInvoice,
  canDeleteInvoice,
  canEditNotesAndDue,
  isInvoiceFullyEditable,
  isInvoiceReadOnly,
} from "../logic";
import { invoiceFormSchema, type InvoiceFormValues } from "../schema";
import type { Invoice } from "../types";
import type { Payment } from "@/features/payments/types";

afterEach(() => setMockToday(null));

function useTestHooks() {
  return { invoices: useInvoices(), data: useData() };
}

function setup() {
  return renderHook(() => useTestHooks(), { wrapper: ProvidersWrapper });
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: "i-x",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    number: "FAC-0001",
    clientId: "c-acme",
    issueDate: "2026-01-01",
    dueDate: "2026-01-31",
    items: [{ id: "li", description: "Work", quantity: 2, unitPriceCents: 10000 }],
    taxRate: 0,
    status: "sent",
    ...overrides,
  };
}

function makePayment(amountCents: number, invoiceId = "i-x"): Payment {
  return {
    id: `p-${amountCents}`,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    invoiceId,
    amountCents,
    date: "2026-01-10",
    method: "transfer",
  };
}

const manualValues: InvoiceFormValues = {
  clientId: "c-acme",
  issueDate: "2026-03-01",
  dueDate: "2026-03-16",
  items: [{ id: "li-1", description: "Diseño", quantity: 2, unitPriceCents: 5000 }],
  taxRate: 10,
};

describe("HU-08.1 Listar facturas", () => {
  it("getInvoiceFinancials marks a sent invoice past due with balance as overdue", () => {
    const f = getInvoiceFinancials(makeInvoice({ dueDate: "2026-01-31" }), [], "2026-02-01");
    expect(f).toEqual({ totalCents: 20000, paidCents: 0, balanceCents: 20000, displayStatus: "overdue" });
  });

  it("is not overdue on the due date itself and shows partially_paid when 0 < paid < total", () => {
    const inv = makeInvoice();
    expect(getInvoiceFinancials(inv, [], "2026-01-31").displayStatus).toBe("sent");
    const partial = getInvoiceFinancials(inv, [makePayment(5000)], "2026-01-31");
    expect(partial.displayStatus).toBe("partially_paid");
    expect(partial.balanceCents).toBe(15000);
    expect(getInvoiceFinancials(inv, [makePayment(5000)], "2026-02-15").displayStatus).toBe("overdue");
  });

  it("keeps the stored status for paid, draft and cancelled invoices and applies tax", () => {
    const paid = makeInvoice({ status: "paid", taxRate: 10 });
    const f = getInvoiceFinancials(paid, [makePayment(22000)], "2030-01-01");
    expect(f.totalCents).toBe(22000);
    expect(f.balanceCents).toBe(0);
    expect(f.displayStatus).toBe("paid");
    expect(getInvoiceFinancials(makeInvoice({ status: "draft" }), [], "2030-01-01").displayStatus).toBe("draft");
    expect(getInvoiceFinancials(makeInvoice({ status: "cancelled" }), [], "2030-01-01").displayStatus).toBe("cancelled");
  });

  it("computes KPIs for receivable, overdue and collected in the month", () => {
    const sentOverdue = makeInvoice({ id: "a", dueDate: "2026-01-31" });
    const sentOk = makeInvoice({ id: "b", dueDate: "2026-03-30" });
    const draft = makeInvoice({ id: "c", status: "draft" });
    const payments = [makePayment(5000, "a"), { ...makePayment(1000, "b"), id: "p2", date: "2026-02-03" }];
    const k = getInvoiceKpis([sentOverdue, sentOk, draft], payments, "2026-02-15");
    expect(k.receivableCents).toBe(15000 + 20000 - 1000);
    expect(k.overdueCents).toBe(15000);
    expect(k.collectedThisMonthCents).toBe(1000);
  });

  it("filters by status (derived), client and number search", () => {
    const { result } = setup();
    const data = result.current.data.data;
    const invoices = data.invoices;
    const today = getToday();
    const overdue = filterInvoices(invoices, data.payments, { status: "overdue" }, today);
    expect(overdue.map((i) => i.number)).toEqual(["FAC-1042"]);
    const partial = filterInvoices(invoices, data.payments, { status: "partially_paid" }, today);
    expect(partial.map((i) => i.number)).toEqual(["FAC-1045"]);
    expect(filterInvoices(invoices, data.payments, { search: "1043" }, today)).toHaveLength(1);
    expect(filterInvoices(invoices, data.payments, { clientId: "c-wayne" }, today)).toHaveLength(1);
  });
});

describe("HU-08.2 Crear factura", () => {
  it("nextInvoiceNumber is sequential FAC-{seq:4}", () => {
    expect(nextInvoiceNumber([])).toBe("FAC-0001");
    expect(nextInvoiceNumber([makeInvoice({ number: "FAC-0009" }), makeInvoice({ number: "FAC-0003" })])).toBe("FAC-0010");
    const { result } = setup();
    expect(nextInvoiceNumber(result.current.data.data.invoices)).toBe("FAC-1046");
  });

  it("creates a manual draft invoice with an auto number", () => {
    const { result } = setup();
    let created!: Invoice;
    act(() => {
      created = result.current.invoices.createInvoice(manualValues);
    });
    expect(created.number).toBe("FAC-1046");
    expect(created.status).toBe("draft");
    expect(result.current.data.data.invoices.some((i) => i.id === created.id)).toBe(true);
  });

  it("validates due date >= issue date", () => {
    expect(invoiceFormSchema.safeParse(manualValues).success).toBe(true);
    const bad = invoiceFormSchema.safeParse({ ...manualValues, dueDate: "2026-02-01" });
    expect(bad.success).toBe(false);
    expect(invoiceFormSchema.safeParse({ ...manualValues, items: [] }).success).toBe(false);
  });

  it("createFromQuote copies items and sets quoteId with default due date", () => {
    const { result } = setup();
    const quote = result.current.data.data.quotes.find((q) => q.id === "q-3")!;
    let created!: Invoice;
    act(() => {
      created = result.current.invoices.createFromQuote(quote);
    });
    expect(created.quoteId).toBe("q-3");
    expect(created.items.map((i) => i.description)).toEqual(quote.items.map((i) => i.description));
    expect(created.items[0].id).not.toBe(quote.items[0].id);
    const terms = result.current.data.data.settings.defaultPaymentTermsDays;
    expect(created.dueDate).toBe(addDays(created.issueDate, terms));
  });

  it("createFromTimeEntries makes one line per entry and marks entries as invoiced", () => {
    const { result } = setup();
    const unbilled = getUnbilledEntries(result.current.data.data.timeEntries, "p-2");
    expect(unbilled.length).toBeGreaterThanOrEqual(2);
    const picked = unbilled.slice(0, 2).map((e) => e.id);
    let created: Invoice | undefined;
    act(() => {
      created = result.current.invoices.createFromTimeEntries("p-2", picked);
    });
    expect(created!.items).toHaveLength(2);
    expect(created!.items[0].unitPriceCents).toBe(8500);
    expect(created!.items.flatMap((i) => i.timeEntryIds)).toEqual(picked);
    for (const id of picked) {
      expect(result.current.data.data.timeEntries.find((e) => e.id === id)!.invoiceId).toBe(created!.id);
    }
    expect(getUnbilledEntries(result.current.data.data.timeEntries, "p-2").map((e) => e.id)).not.toContain(picked[0]);
  });

  it("ignores already invoiced or empty selections", () => {
    const { result } = setup();
    let created: Invoice | undefined;
    act(() => {
      created = result.current.invoices.createFromTimeEntries("p-2", ["t-1"]);
    });
    expect(created).toBeUndefined();
  });
});

describe("HU-08.3 Ver, editar y cambiar estado de factura", () => {
  it("exposes edit permissions per status", () => {
    const draft = makeInvoice({ status: "draft" });
    const sent = makeInvoice({ status: "sent" });
    const paid = makeInvoice({ status: "paid" });
    const cancelled = makeInvoice({ status: "cancelled" });
    expect(isInvoiceFullyEditable(draft)).toBe(true);
    expect(isInvoiceFullyEditable(sent)).toBe(false);
    expect(canEditNotesAndDue(sent)).toBe(true);
    expect(canEditNotesAndDue(paid)).toBe(false);
    expect(isInvoiceReadOnly(paid) && isInvoiceReadOnly(cancelled)).toBe(true);
    expect(canCancelInvoice(sent)).toBe(true);
    expect(canCancelInvoice(draft)).toBe(false);
  });

  it("updateDraft edits a draft but a sent invoice only accepts notes and due date", () => {
    const { result } = setup();
    act(() => {
      result.current.invoices.updateDraft("inv-1044", { ...manualValues, clientId: "c-nova", taxRate: 5 });
    });
    expect(result.current.data.data.invoices.find((i) => i.id === "inv-1044")!.taxRate).toBe(5);
    act(() => {
      result.current.invoices.updateDraft("inv-1043", { ...manualValues, taxRate: 5 });
    });
    expect(result.current.data.data.invoices.find((i) => i.id === "inv-1043")!.taxRate).toBe(0);
    const sent = result.current.data.data.invoices.find((i) => i.id === "inv-1043")!;
    act(() => {
      result.current.invoices.updateNotesAndDue("inv-1043", { dueDate: addDays(sent.issueDate, 30), notes: " hola " });
    });
    const after = result.current.data.data.invoices.find((i) => i.id === "inv-1043")!;
    expect(after.notes).toBe("hola");
    expect(after.dueDate).toBe(addDays(sent.issueDate, 30));
    act(() => {
      result.current.invoices.updateNotesAndDue("inv-1043", { dueDate: "2000-01-01" });
    });
    expect(result.current.data.data.invoices.find((i) => i.id === "inv-1043")!.dueDate).toBe(after.dueDate);
  });

  it("updateNotesAndDue does nothing for paid invoices", () => {
    const { result } = setup();
    const before = result.current.data.data.invoices.find((i) => i.id === "inv-1041")!;
    act(() => {
      result.current.invoices.updateNotesAndDue("inv-1041", { dueDate: "2099-01-01", notes: "x" });
    });
    expect(result.current.data.data.invoices.find((i) => i.id === "inv-1041")!.dueDate).toBe(before.dueDate);
  });

  it("marks a draft as sent", () => {
    const { result } = setup();
    const draft = result.current.data.data.invoices.find((i) => i.id === "inv-1044")!;
    act(() => {
      result.current.invoices.markSent(draft);
    });
    expect(result.current.data.data.invoices.find((i) => i.id === "inv-1044")!.status).toBe("sent");
  });

  it("cancelling a sent invoice releases its time entries", () => {
    const { result } = setup();
    const unbilled = getUnbilledEntries(result.current.data.data.timeEntries, "p-2").slice(0, 1).map((e) => e.id);
    let created!: Invoice;
    act(() => {
      created = result.current.invoices.createFromTimeEntries("p-2", unbilled)!;
    });
    act(() => {
      result.current.invoices.markSent(created);
    });
    const sent = result.current.data.data.invoices.find((i) => i.id === created.id)!;
    act(() => {
      result.current.invoices.cancelInvoice(sent);
    });
    expect(result.current.data.data.invoices.find((i) => i.id === created.id)!.status).toBe("cancelled");
    expect(result.current.data.data.timeEntries.find((e) => e.id === unbilled[0])!.invoiceId).toBeUndefined();
  });
});

describe("HU-08.4 Eliminar factura en borrador", () => {
  it("only drafts can be deleted", () => {
    expect(canDeleteInvoice(makeInvoice({ status: "draft" }))).toBe(true);
    expect(canDeleteInvoice(makeInvoice({ status: "sent" }))).toBe(false);
    const { result } = setup();
    const sent = result.current.data.data.invoices.find((i) => i.id === "inv-1043")!;
    let ok = true;
    act(() => {
      ok = result.current.invoices.deleteDraftWithUndo(sent);
    });
    expect(ok).toBe(false);
    expect(result.current.data.data.invoices.some((i) => i.id === "inv-1043")).toBe(true);
  });

  it("deleting a draft removes it and releases its time entries", () => {
    const { result } = setup();
    const picked = getUnbilledEntries(result.current.data.data.timeEntries, "p-2").slice(0, 2).map((e) => e.id);
    let created!: Invoice;
    act(() => {
      created = result.current.invoices.createFromTimeEntries("p-2", picked)!;
    });
    act(() => {
      result.current.invoices.deleteDraftWithUndo(created);
    });
    expect(result.current.data.data.invoices.some((i) => i.id === created.id)).toBe(false);
    for (const id of picked) {
      expect(result.current.data.data.timeEntries.find((e) => e.id === id)!.invoiceId).toBeUndefined();
    }
  });

  it("deleting a seeded draft removes it from the list", () => {
    const { result } = setup();
    const draft = result.current.data.data.invoices.find((i) => i.id === "inv-1044")!;
    act(() => {
      result.current.invoices.deleteDraftWithUndo(draft);
    });
    expect(result.current.data.data.invoices.some((i) => i.id === "inv-1044")).toBe(false);
  });

  it("Deshacer restores the invoice at its original index and relinks time entries", () => {
    let snapshot: ReturnType<typeof useTestHooks> | undefined;
    function Probe() {
      const hooks = useTestHooks();
      snapshot = hooks;
      return (
        <button
          type="button"
          onClick={() => {
            const entries = getUnbilledEntries(hooks.data.data.timeEntries, "p-2");
            hooks.invoices.createFromTimeEntries("p-2", [entries[0].id]);
          }}
        >
          create
        </button>
      );
    }
    renderWithProviders(<Probe />);
    fireEvent.click(screen.getByText("create"));
    const created = snapshot!.data.data.invoices.find((i) => i.number === "FAC-1046")!;
    const entryId = created.items[0].timeEntryIds![0];
    const index = snapshot!.data.data.invoices.indexOf(created);
    act(() => {
      snapshot!.invoices.deleteDraftWithUndo(created);
    });
    expect(snapshot!.data.data.invoices.some((i) => i.id === created.id)).toBe(false);
    fireEvent.click(screen.getByText("Deshacer"));
    expect(snapshot!.data.data.invoices.indexOf(snapshot!.data.data.invoices.find((i) => i.id === created.id)!)).toBe(index);
    expect(snapshot!.data.data.timeEntries.find((e) => e.id === entryId)!.invoiceId).toBe(created.id);
  });
});
