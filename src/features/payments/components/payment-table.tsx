"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { IconButton } from "@/components/ui/icon-button";
import type { Payment } from "../types";

const methodKeys = {
  transfer: "payments.methodTransfer",
  card: "payments.methodCard",
  cash: "payments.methodCash",
  other: "payments.methodOther",
} as const;

export function PaymentTable({
  payments,
  onEdit,
  onDelete,
}: {
  payments: Payment[];
  onEdit: (payment: Payment) => void;
  onDelete: (payment: Payment) => void;
}) {
  const { t, formatMoney, formatDate } = useTranslation();
  const { data } = useData();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("payments.columnDate")}</TableHeaderCell>
          <TableHeaderCell>{t("payments.columnInvoice")}</TableHeaderCell>
          <TableHeaderCell>{t("payments.columnClient")}</TableHeaderCell>
          <TableHeaderCell>{t("payments.columnAmount")}</TableHeaderCell>
          <TableHeaderCell>{t("payments.columnMethod")}</TableHeaderCell>
          <TableHeaderCell>{t("payments.columnActions")}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {payments.map((p) => {
          const invoice = data.invoices.find((i) => i.id === p.invoiceId);
          const client = data.clients.find((c) => c.id === invoice?.clientId);
          const number = invoice?.number ?? "—";
          return (
            <TableRow key={p.id}>
              <TableCell>{formatDate(p.date)}</TableCell>
              <TableCell>
                {invoice ? (
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {number}
                  </Link>
                ) : (
                  number
                )}
              </TableCell>
              <TableCell>{client?.name ?? "—"}</TableCell>
              <TableCell>{formatMoney(p.amountCents)}</TableCell>
              <TableCell>{t(methodKeys[p.method])}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <IconButton aria-label={t("payments.editActionFor", { number })} onClick={() => onEdit(p)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton aria-label={t("payments.deleteActionFor", { number })} onClick={() => onDelete(p)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
