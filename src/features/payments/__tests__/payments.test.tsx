import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, screen, fireEvent } from "@testing-library/react";
import { usePayments } from "../use-payments";
import { useData } from "@/context/data-context";
import { ProvidersWrapper, renderWithProviders } from "@/test/render-with-providers";
import { setMockToday, getToday, addDays } from "@/lib/dates";
import { getInvoiceFinancials } from "@/features/invoices/logic";
import {
  filterPayments,
  getIncomeKpis,
  getMonthlySeries,
  getPayableInvoices,
  maxAllowedAmount,
  nextInvoiceStatus,
  sumPayments,
} from "../logic";
import { buildPaymentSchema, type PaymentFormValues } from "../schema";
import { BarChart } from "@/components/ui/bar-chart";

afterEach(() => setMockToday(null));

function useTestHooks() {
  return { payments: usePayments(), data: useData() };
}

function setup() {
  return renderHook(() => useTestHooks(), { wrapper: ProvidersWrapper });
}

function values(overrides: Partial<PaymentFormValues> = {}): PaymentFormValues {
  return { invoiceId: "inv-1043", amount: 100, date: getToday(), method: "transfer", ...overrides };
}

function invoiceOf(result: ReturnType<typeof setup>["result"], id: string) {
  const invoice = result.current.data.data.invoices.find((i) => i.id === id)!;
  return {
    invoice,
    fin: getInvoiceFinancials(invoice, result.current.data.data.payments, getToday()),
  };
}

describe("HU-09.1 Registrar pago", () => {
  it("lists only sent invoices with balance as payable", () => {
    const { result } = setup();
    const d = result.current.data.data;
    const ids = getPayableInvoices(d.invoices, d.payments, getToday()).map((i) => i.id);
    expect(ids).toContain("inv-1043");
    expect(ids).toContain("inv-1045");
    expect(ids).not.toContain("inv-1041");
  });

  it("creates a partial payment keeping the invoice sent as partially paid", () => {
    const { result } = setup();
    act(() => {
      result.current.payments.createPayment(values({ amount: 100 }));
    });
    const { invoice, fin } = invoiceOf(result, "inv-1043");
    expect(invoice.status).toBe("sent");
    expect(fin.displayStatus).toBe("partially_paid");
    expect(fin.paidCents).toBe(10000);
  });

  it("marks the invoice as paid when the payment covers the balance", () => {
    const { result } = setup();
    const max = result.current.payments.maxFor("inv-1043");
    act(() => {
      result.current.payments.createPayment(values({ amount: max / 100 }));
    });
    expect(invoiceOf(result, "inv-1043").invoice.status).toBe("paid");
  });

  it("rejects amounts above the balance and future dates", () => {
    const { result } = setup();
    const max = result.current.payments.maxFor("inv-1043");
    const before = result.current.data.data.payments.length;
    act(() => {
      result.current.payments.createPayment(values({ amount: max / 100 + 1 }));
      result.current.payments.createPayment(values({ date: addDays(getToday(), 1) }));
    });
    expect(result.current.data.data.payments).toHaveLength(before);
    const schema = buildPaymentSchema(max, getToday());
    expect(schema.safeParse(values({ amount: 0 })).success).toBe(false);
    expect(schema.safeParse(values({ amount: max / 100 + 0.01 })).success).toBe(false);
    expect(schema.safeParse(values({ date: addDays(getToday(), 1) })).success).toBe(false);
    expect(schema.safeParse(values()).success).toBe(true);
  });
});

describe("HU-09.2 Listar pagos", () => {
  it("sorts by date descending", () => {
    const { result } = setup();
    const d = result.current.data.data;
    const dates = filterPayments(d.payments, d.invoices, {}).map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
    expect(dates).toHaveLength(3);
  });

  it("filters by client, method and date range", () => {
    const { result } = setup();
    const d = result.current.data.data;
    expect(filterPayments(d.payments, d.invoices, { clientId: "c-globalretail" })).toHaveLength(2);
    expect(filterPayments(d.payments, d.invoices, { method: "card" }).map((p) => p.id)).toEqual(["pay-3"]);
    const from = addDays(getToday(), -7);
    expect(filterPayments(d.payments, d.invoices, { from }).map((p) => p.id).sort()).toEqual(["pay-2", "pay-3"]);
    expect(filterPayments(d.payments, d.invoices, { to: addDays(getToday(), -20) })).toHaveLength(1);
  });

  it("sums the filtered total", () => {
    const { result } = setup();
    const d = result.current.data.data;
    expect(sumPayments(filterPayments(d.payments, d.invoices, {}))).toBe(660000);
    expect(sumPayments(filterPayments(d.payments, d.invoices, { method: "card" }))).toBe(60000);
  });
});

describe("HU-09.3 Editar y eliminar pago", () => {
  it("allows editing up to balance plus the previous amount", () => {
    const { result } = setup();
    const d = result.current.data.data;
    const inv = d.invoices.find((i) => i.id === "inv-1045")!;
    const balance = getInvoiceFinancials(inv, d.payments, getToday()).balanceCents;
    expect(maxAllowedAmount(inv, d.payments, "pay-2", getToday())).toBe(balance + 100000);
    const max = result.current.payments.maxFor("inv-1045", "pay-2");
    let ok = true;
    act(() => {
      ok = result.current.payments.updatePayment("pay-2", values({ invoiceId: "inv-1045", amount: (max + 1) / 100 }));
    });
    expect(ok).toBe(false);
    act(() => {
      ok = result.current.payments.updatePayment("pay-2", values({ invoiceId: "inv-1045", amount: max / 100 }));
    });
    expect(ok).toBe(true);
  });

  it("recomputes the status back to sent when a payment is edited down or deleted", () => {
    const { result } = setup();
    const max = result.current.payments.maxFor("inv-1043");
    act(() => {
      result.current.payments.createPayment(values({ amount: max / 100 }));
    });
    expect(invoiceOf(result, "inv-1043").invoice.status).toBe("paid");
    const created = result.current.data.data.payments.find((p) => p.invoiceId === "inv-1043")!;
    act(() => {
      result.current.payments.updatePayment(created.id, values({ amount: 50 }));
    });
    expect(invoiceOf(result, "inv-1043").invoice.status).toBe("sent");
    expect(nextInvoiceStatus(invoiceOf(result, "inv-1043").invoice, [])).toBe("sent");
  });

  it("deletes and restores via undo in the same position, recomputing status", () => {
    const { result } = setup();
    const pay1 = result.current.data.data.payments.find((p) => p.id === "pay-1")!;
    expect(invoiceOf(result, "inv-1041").invoice.status).toBe("paid");
    act(() => {
      result.current.payments.deletePaymentWithUndo(pay1);
    });
    expect(result.current.data.data.payments.some((p) => p.id === "pay-1")).toBe(false);
    expect(invoiceOf(result, "inv-1041").invoice.status).toBe("sent");
    fireEvent.click(screen.getByText("Deshacer"));
    expect(result.current.data.data.payments[0].id).toBe("pay-1");
    expect(invoiceOf(result, "inv-1041").invoice.status).toBe("paid");
  });

  it("only touches sent/paid invoices in nextInvoiceStatus", () => {
    const { result } = setup();
    const draft = result.current.data.data.invoices.find((i) => i.status === "draft")!;
    expect(nextInvoiceStatus(draft, [])).toBe("draft");
  });
});

describe("HU-09.4 Ver resumen de ingresos", () => {
  it("computes month, receivable and year KPIs", () => {
    const { result } = setup();
    const d = result.current.data.data;
    const today = "2026-06-15";
    const k = getIncomeKpis(
      [
        { ...d.payments[0], id: "a", date: "2026-06-02", amountCents: 1000 },
        { ...d.payments[0], id: "b", date: "2026-03-02", amountCents: 500 },
        { ...d.payments[0], id: "c", date: "2025-12-02", amountCents: 700 },
      ],
      [],
      today,
    );
    expect(k.monthCents).toBe(1000);
    expect(k.yearCents).toBe(1500);
    const real = getIncomeKpis(d.payments, d.invoices, getToday());
    const sentBalance = d.invoices
      .filter((i) => i.status === "sent")
      .reduce((s, i) => s + getInvoiceFinancials(i, d.payments, getToday()).balanceCents, 0);
    expect(real.receivableCents).toBe(sentBalance);
  });

  it("builds 8 monthly points: 6 past/current and 2 projected", () => {
    const { result } = setup();
    const d = result.current.data.data;
    setMockToday("2026-06-15");
    const series = getMonthlySeries(d.payments, d.invoices, "2026-06-15");
    expect(series.map((s) => s.month)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08",
    ]);
  });

  it("projects sent invoice balances by due month and collected by payment month", () => {
    const { result } = setup();
    const d = result.current.data.data;
    const inv = d.invoices.find((i) => i.id === "inv-1043")!;
    const series = getMonthlySeries(
      [{ ...d.payments[0], id: "x", invoiceId: "inv-1041", date: "2026-05-10", amountCents: 900 }],
      [{ ...inv, dueDate: "2026-07-20" }],
      "2026-06-15",
    );
    expect(series.find((s) => s.month === "2026-05")!.collectedCents).toBe(900);
    expect(series.find((s) => s.month === "2026-07")!.projectedCents).toBeGreaterThan(0);
    expect(series.find((s) => s.month === "2026-06")!.projectedCents).toBe(0);
  });

  it("renders BarChart with legend and a sr-only table", () => {
    renderWithProviders(
      <BarChart
        title="Income"
        categoryHeader="Month"
        series={[
          { key: "a", label: "Collected" },
          { key: "b", label: "Projected", hatched: true },
        ]}
        categories={[{ label: "Jan", values: { a: 1000, b: 500 } }]}
        formatValue={(v) => `$${v}`}
      />,
    );
    expect(screen.getAllByText("Collected").length).toBeGreaterThanOrEqual(2);
    const table = screen.getByRole("table");
    expect(table.className).toContain("sr-only");
    expect(table.textContent).toContain("$1000");
    expect(document.querySelector("pattern")).not.toBeNull();
  });
});
