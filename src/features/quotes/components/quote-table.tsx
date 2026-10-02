"use client";

import type { Quote } from "../types";
import { isQuoteUnanswered } from "../logic";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { calculateTotals } from "@/lib/money";
import { getToday } from "@/lib/dates";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

const statusTone = { draft: "neutral", sent: "accent", accepted: "success", rejected: "danger" } as const;

export function QuoteTable({ quotes, onOpen }: { quotes: Quote[]; onOpen: (quote: Quote) => void }) {
  const { t, formatMoney, formatDate } = useTranslation();
  const { data } = useData();
  const today = getToday();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("quotes.columnNumber")}</TableHeaderCell>
          <TableHeaderCell>{t("quotes.columnClient")}</TableHeaderCell>
          <TableHeaderCell>{t("quotes.columnTitle")}</TableHeaderCell>
          <TableHeaderCell>{t("quotes.columnTotal")}</TableHeaderCell>
          <TableHeaderCell>{t("quotes.columnStatus")}</TableHeaderCell>
          <TableHeaderCell>{t("quotes.columnUpdated")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {quotes.map((quote) => {
          const client = data.clients.find((c) => c.id === quote.clientId);
          const totals = calculateTotals(quote.items, quote.taxRate);
          const unanswered = isQuoteUnanswered(quote, today);
          return (
            <TableRow key={quote.id}>
              <TableCell>
                <button
                  type="button"
                  onClick={() => onOpen(quote)}
                  className="font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {quote.number}
                </button>
              </TableCell>
              <TableCell>{client?.name ?? "—"}</TableCell>
              <TableCell>{quote.title}</TableCell>
              <TableCell>{formatMoney(totals.totalCents)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <StatusBadge label={t(`quotes.status${capitalize(quote.status)}`)} tone={statusTone[quote.status]} />
                  {unanswered ? <StatusBadge label={t("quotes.unansweredLabel")} tone="warning" /> : null}
                </div>
              </TableCell>
              <TableCell>{formatDate(quote.updatedAt)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
