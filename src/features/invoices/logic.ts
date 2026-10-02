import { calculateTotals } from "@/lib/money";
import type { ISODate } from "@/lib/types";
import type { Payment } from "@/features/payments/types";
import type { TimeEntry } from "@/features/time/types";
import type { Invoice, InvoiceDisplayStatus, InvoiceFinancials, InvoiceStatus } from "./types";

export function nextInvoiceNumber(invoices: Invoice[]): string {
  const max = invoices
    .map((i) => /^FAC-(\d+)$/.exec(i.number))
    .reduce((m, match) => (match ? Math.max(m, Number(match[1])) : m), 0);
  return `FAC-${String(max + 1).padStart(4, "0")}`;
}

export function getInvoiceFinancials(
  invoice: Invoice,
  payments: Payment[],
  today: ISODate,
): InvoiceFinancials {
  const { totalCents } = calculateTotals(invoice.items, invoice.taxRate);
  const paidCents = payments
    .filter((p) => p.invoiceId === invoice.id)
    .reduce((sum, p) => sum + p.amountCents, 0);
  const balanceCents = Math.max(0, totalCents - paidCents);
  let displayStatus: InvoiceDisplayStatus = invoice.status;
  if (invoice.status === "sent" && balanceCents > 0 && invoice.dueDate < today) {
    displayStatus = "overdue";
  } else if (invoice.status === "sent" && paidCents > 0 && paidCents < totalCents) {
    displayStatus = "partially_paid";
  }
  return { totalCents, paidCents, balanceCents, displayStatus };
}

export interface InvoiceKpis {
  receivableCents: number;
  overdueCents: number;
  collectedThisMonthCents: number;
}

export function getInvoiceKpis(invoices: Invoice[], payments: Payment[], today: ISODate): InvoiceKpis {
  let receivableCents = 0;
  let overdueCents = 0;
  for (const invoice of invoices) {
    if (invoice.status !== "sent") continue;
    const f = getInvoiceFinancials(invoice, payments, today);
    receivableCents += f.balanceCents;
    if (f.displayStatus === "overdue") overdueCents += f.balanceCents;
  }
  const month = today.slice(0, 7);
  const collectedThisMonthCents = payments
    .filter((p) => p.date.startsWith(month))
    .reduce((sum, p) => sum + p.amountCents, 0);
  return { receivableCents, overdueCents, collectedThisMonthCents };
}

export function isInvoiceFullyEditable(invoice: Invoice): boolean {
  return invoice.status === "draft";
}

export function canEditNotesAndDue(invoice: Invoice): boolean {
  return invoice.status === "draft" || invoice.status === "sent";
}

export function isInvoiceReadOnly(invoice: Invoice): boolean {
  return invoice.status === "paid" || invoice.status === "cancelled";
}

export function canMarkSent(invoice: Invoice): boolean {
  return invoice.status === "draft";
}

export function canCancelInvoice(invoice: Invoice): boolean {
  return invoice.status === "sent";
}

export function canDeleteInvoice(invoice: Invoice): boolean {
  return invoice.status === "draft";
}

export function getTimeEntryIds(invoice: Invoice): string[] {
  return invoice.items.flatMap((item) => item.timeEntryIds ?? []);
}

/** Billable, not-yet-invoiced entries of a project. */
export function getUnbilledEntries(timeEntries: TimeEntry[], projectId: string): TimeEntry[] {
  return timeEntries.filter((e) => e.projectId === projectId && e.billable && !e.invoiceId);
}

export function hoursFromMinutes(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100;
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus | "overdue" | "partially_paid" | "all";
  clientId?: string;
}

export function filterInvoices(
  invoices: Invoice[],
  payments: Payment[],
  filters: InvoiceFilters,
  today: ISODate,
): Invoice[] {
  const query = filters.search?.trim().toLowerCase();
  return invoices.filter((inv) => {
    if (filters.clientId && inv.clientId !== filters.clientId) return false;
    if (query && !inv.number.toLowerCase().includes(query)) return false;
    if (filters.status && filters.status !== "all") {
      if (getInvoiceFinancials(inv, payments, today).displayStatus !== filters.status) return false;
    }
    return true;
  });
}
