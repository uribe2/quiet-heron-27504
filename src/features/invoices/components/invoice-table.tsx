"use client";

import Link from "next/link";
import { Ban, Eye, Trash2 } from "lucide-react";
import type { Invoice } from "../types";
import { canCancelInvoice, canDeleteInvoice, getInvoiceFinancials } from "../logic";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import { InvoiceStatusBadge } from "./invoice-status-badge";

const linkClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";

export function InvoiceTable({
  invoices,
  onDelete,
  onCancel,
}: {
  invoices: Invoice[];
  onDelete: (invoice: Invoice) => void;
  onCancel: (invoice: Invoice) => void;
}) {
  const { t, formatMoney, formatDate } = useTranslation();
  const { data } = useData();
  const today = getToday();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("invoices.columnNumber")}</TableHeaderCell>
          <TableHeaderCell>{t("invoices.columnClient")}</TableHeaderCell>
          <TableHeaderCell>{t("invoices.columnAmount")}</TableHeaderCell>
          <TableHeaderCell>{t("invoices.columnIssue")}</TableHeaderCell>
          <TableHeaderCell>{t("invoices.columnDue")}</TableHeaderCell>
          <TableHeaderCell>{t("invoices.columnStatus")}</TableHeaderCell>
          <TableHeaderCell>{t("invoices.columnActions")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invoices.map((invoice) => {
          const client = data.clients.find((c) => c.id === invoice.clientId);
          const f = getInvoiceFinancials(invoice, data.payments, today);
          return (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {invoice.number}
                </Link>
              </TableCell>
              <TableCell>{client?.name ?? "—"}</TableCell>
              <TableCell>{formatMoney(f.totalCents)}</TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell>
                <InvoiceStatusBadge status={f.displayStatus} />
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    aria-label={t("invoices.viewAction", { number: invoice.number })}
                    className={linkClass}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  {canDeleteInvoice(invoice) ? (
                    <IconButton
                      aria-label={t("invoices.deleteActionFor", { number: invoice.number })}
                      onClick={() => onDelete(invoice)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                  ) : null}
                  {canCancelInvoice(invoice) ? (
                    <IconButton
                      aria-label={t("invoices.cancelActionFor", { number: invoice.number })}
                      onClick={() => onCancel(invoice)}
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
