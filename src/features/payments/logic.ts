import { calculateTotals } from "@/lib/money";
import type { ISODate } from "@/lib/types";
import type { Invoice, InvoiceStatus } from "@/features/invoices/types";
import { getInvoiceFinancials } from "@/features/invoices/logic";
import type { Payment, PaymentMethod } from "./types";

/** Invoices that can receive a new payment: sent with balance > 0. */
export function getPayableInvoices(invoices: Invoice[], payments: Payment[], today: ISODate): Invoice[] {
  return invoices.filter(
    (inv) => inv.status === "sent" && getInvoiceFinancials(inv, payments, today).balanceCents > 0,
  );
}

/**
 * Max amount for a payment. When editing, the payment's previous amount is
 * added back to the balance.
 */
export function maxAllowedAmount(
  invoice: Invoice,
  payments: Payment[],
  editingPaymentId?: string,
  today: ISODate = "9999-12-31",
): number {
  const { balanceCents } = getInvoiceFinancials(invoice, payments, today);
  const previous = editingPaymentId
    ? (payments.find((p) => p.id === editingPaymentId && p.invoiceId === invoice.id)?.amountCents ?? 0)
    : 0;
  return balanceCents + previous;
}

/** Pure rule for flow #5: sent/paid invoices follow their payments. */
export function nextInvoiceStatus(invoice: Invoice, payments: Payment[]): InvoiceStatus {
  if (invoice.status !== "sent" && invoice.status !== "paid") return invoice.status;
  const { totalCents } = calculateTotals(invoice.items, invoice.taxRate);
  const paid = payments
    .filter((p) => p.invoiceId === invoice.id)
    .reduce((sum, p) => sum + p.amountCents, 0);
  return totalCents > 0 && paid >= totalCents ? "paid" : "sent";
}

export interface PaymentFilters {
  clientId?: string;
  method?: PaymentMethod | "all";
  from?: ISODate;
  to?: ISODate;
}

/** Filters (client resolved through the invoice) and sorts by date desc. */
export function filterPayments(payments: Payment[], invoices: Invoice[], filters: PaymentFilters): Payment[] {
  const byId = new Map(invoices.map((i) => [i.id, i]));
  return payments
    .filter((p) => {
      if (filters.clientId && byId.get(p.invoiceId)?.clientId !== filters.clientId) return false;
      if (filters.method && filters.method !== "all" && p.method !== filters.method) return false;
      if (filters.from && p.date < filters.from) return false;
      if (filters.to && p.date > filters.to) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

export function sumPayments(payments: Payment[]): number {
  return payments.reduce((sum, p) => sum + p.amountCents, 0);
}

export interface IncomeKpis {
  monthCents: number;
  receivableCents: number;
  yearCents: number;
}

export function getIncomeKpis(payments: Payment[], invoices: Invoice[], today: ISODate): IncomeKpis {
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const receivableCents = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + getInvoiceFinancials(i, payments, today).balanceCents, 0);
  return {
    monthCents: sumPayments(payments.filter((p) => p.date.startsWith(month))),
    receivableCents,
    yearCents: sumPayments(payments.filter((p) => p.date.startsWith(year))),
  };
}

export interface MonthlyPoint {
  month: string; // 'YYYY-MM'
  collectedCents: number;
  projectedCents: number;
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Last `past` months + current + next `future` months. Collected = payments by
 * date month; projected = balances of sent invoices by due month (overdue
 * balances are projected into the current month).
 */
export function getMonthlySeries(
  payments: Payment[],
  invoices: Invoice[],
  today: ISODate,
  past = 5,
  future = 2,
): MonthlyPoint[] {
  const current = today.slice(0, 7);
  const months: string[] = [];
  for (let d = -past; d <= future; d++) months.push(shiftMonth(current, d));
  const points = new Map<string, MonthlyPoint>(
    months.map((month) => [month, { month, collectedCents: 0, projectedCents: 0 }]),
  );
  for (const p of payments) {
    const point = points.get(p.date.slice(0, 7));
    if (point) point.collectedCents += p.amountCents;
  }
  for (const inv of invoices) {
    if (inv.status !== "sent") continue;
    const { balanceCents } = getInvoiceFinancials(inv, payments, today);
    if (balanceCents <= 0) continue;
    const dueMonth = inv.dueDate.slice(0, 7);
    const point = points.get(dueMonth < current ? current : dueMonth);
    if (point) point.projectedCents += balanceCents;
  }
  return months.map((m) => points.get(m)!);
}
