"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CircleCheck, CircleX, Clock, Pencil, Send } from "lucide-react";
import type { Quote } from "../types";
import { isQuoteUnanswered, sortQuotes, type QuoteSortKey, type SortDirection } from "../logic";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { calculateTotals } from "@/lib/money";
import { getToday } from "@/lib/dates";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

const statusTone = { draft: "neutral", sent: "accent", accepted: "success", rejected: "danger" } as const;

const statusIcon = {
  draft: <Pencil className="h-3.5 w-3.5" aria-hidden="true" />,
  sent: <Send className="h-3.5 w-3.5" aria-hidden="true" />,
  accepted: <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />,
  rejected: <CircleX className="h-3.5 w-3.5" aria-hidden="true" />,
};

const columns: { key: QuoteSortKey; labelKey: string }[] = [
  { key: "number", labelKey: "quotes.columnNumber" },
  { key: "client", labelKey: "quotes.columnClient" },
  { key: "title", labelKey: "quotes.columnTitle" },
  { key: "total", labelKey: "quotes.columnTotal" },
  { key: "status", labelKey: "quotes.columnStatus" },
  { key: "updatedAt", labelKey: "quotes.columnUpdated" },
];

export function QuoteTable({ quotes, onOpen }: { quotes: Quote[]; onOpen: (quote: Quote) => void }) {
  const { t, formatMoney, formatDate } = useTranslation();
  const { data } = useData();
  const today = getToday();
  const [sortKey, setSortKey] = useState<QuoteSortKey>("updatedAt");
  const [direction, setDirection] = useState<SortDirection>("desc");

  const clientNames = useMemo(() => Object.fromEntries(data.clients.map((c) => [c.id, c.name])), [data.clients]);
  const sorted = useMemo(
    () => sortQuotes(quotes, sortKey, direction, clientNames),
    [quotes, sortKey, direction, clientNames],
  );

  function toggleSort(key: QuoteSortKey) {
    if (key === sortKey) {
      setDirection(direction === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setDirection("asc");
    }
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          {columns.map((col) => {
            const active = col.key === sortKey;
            const Icon = direction === "asc" ? ArrowUp : ArrowDown;
            return (
              <TableHeaderCell
                key={col.key}
                className={col.key === "total" ? "text-right" : ""}
                aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
              >
                <button
                  type="button"
                  onClick={() => toggleSort(col.key)}
                  className="inline-flex min-h-11 items-center gap-1 rounded uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {t(col.labelKey)}
                  {active ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                  <span className="sr-only">{t("quotes.sortHint")}</span>
                </button>
              </TableHeaderCell>
            );
          })}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((quote) => {
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
              <TableCell>{clientNames[quote.clientId] ?? "—"}</TableCell>
              <TableCell>{quote.title}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatMoney(totals.totalCents)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <StatusBadge
                    label={t(`quotes.status${capitalize(quote.status)}`)}
                    tone={statusTone[quote.status]}
                    icon={statusIcon[quote.status]}
                  />
                  {unanswered ? (
                    <StatusBadge
                      label={t("quotes.unansweredLabel")}
                      tone="warning"
                      icon={<Clock className="h-3.5 w-3.5" aria-hidden="true" />}
                    />
                  ) : null}
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
