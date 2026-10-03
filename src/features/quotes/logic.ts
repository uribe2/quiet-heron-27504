import { dateOnly, diffInDays } from "@/lib/dates";
import { calculateTotals } from "@/lib/money";
import type { Quote, QuoteHistoryAction, QuoteStatus } from "./types";

export function nextQuoteNumber(quotes: Quote[], year: string): string {
  const prefix = `COT-${year}-`;
  const max = quotes
    .filter((q) => q.number.startsWith(prefix))
    .map((q) => Number(q.number.slice(prefix.length)) || 0)
    .reduce((m, n) => Math.max(m, n), 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export function isQuoteEditable(quote: Quote): boolean {
  return quote.status === "draft" || quote.status === "sent";
}

export function isQuoteLocked(quote: Quote): boolean {
  return quote.status === "accepted" || quote.status === "rejected";
}

export function canDeleteQuote(quote: Quote): boolean {
  return !quote.projectId;
}

export function isQuoteUnanswered(quote: Quote, todayISODate: string): boolean {
  if (quote.status !== "sent") return false;
  const sentEntry = [...quote.history].reverse().find((h) => h.action === "sent");
  if (!sentEntry) return false;
  return diffInDays(todayISODate, dateOnly(sentEntry.at)) > 7;
}

export function appendHistory(
  history: Quote["history"],
  action: QuoteHistoryAction,
  nowISO: string,
  note?: string,
): Quote["history"] {
  return [...history, { at: nowISO, action, note }];
}

export type QuoteSortKey = "number" | "client" | "title" | "total" | "status" | "updatedAt";
export type SortDirection = "asc" | "desc";

export function sortQuotes(
  quotes: Quote[],
  key: QuoteSortKey,
  direction: SortDirection,
  clientNames: Record<string, string>,
): Quote[] {
  const value = (q: Quote): string | number => {
    switch (key) {
      case "client":
        return (clientNames[q.clientId] ?? "").toLowerCase();
      case "title":
        return q.title.toLowerCase();
      case "total":
        return calculateTotals(q.items, q.taxRate).totalCents;
      case "status":
        return q.status;
      case "updatedAt":
        return q.updatedAt;
      default:
        return q.number;
    }
  };
  const factor = direction === "asc" ? 1 : -1;
  return [...quotes].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    return (va < vb ? -1 : va > vb ? 1 : 0) * factor;
  });
}

export interface QuoteFilters {
  search?: string;
  status?: QuoteStatus | "all";
  clientId?: string;
}

export function filterQuotes(quotes: Quote[], filters: QuoteFilters): Quote[] {
  return quotes.filter((q) => {
    if (filters.status && filters.status !== "all" && q.status !== filters.status) return false;
    if (filters.clientId && q.clientId !== filters.clientId) return false;
    if (filters.search) {
      const query = filters.search.trim().toLowerCase();
      if (query && !q.number.toLowerCase().includes(query) && !q.title.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });
}
