"use client";

import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { generateId } from "@/lib/ids";
import { getNowISO, getToday } from "@/lib/dates";
import { centsFromAmount } from "@/lib/format";
import type { Payment } from "./types";
import type { PaymentFormValues } from "./schema";
import { maxAllowedAmount, nextInvoiceStatus } from "./logic";

export function usePayments() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  /** Flow #5: recompute the invoice status from a given payments list. */
  function syncInvoiceStatus(invoiceId: string, payments: Payment[]) {
    const invoice = data.invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;
    if (invoice.status !== "sent" && invoice.status !== "paid") return;
    // Always dispatch: undo callbacks run with a stale `data`, so the stored status may differ from invoice.status.
    const status = nextInvoiceStatus(invoice, payments);
    dispatch({ type: "UPDATE", collection: "invoices", id: invoiceId, patch: { status, updatedAt: getNowISO() } });
  }

  function maxFor(invoiceId: string, editingPaymentId?: string): number {
    const invoice = data.invoices.find((i) => i.id === invoiceId);
    if (!invoice) return 0;
    return maxAllowedAmount(invoice, data.payments, editingPaymentId, getToday());
  }

  function toFields(values: PaymentFormValues) {
    return {
      amountCents: centsFromAmount(values.amount),
      date: values.date,
      method: values.method,
      reference: values.reference?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    };
  }

  function createPayment(values: PaymentFormValues): Payment | undefined {
    const invoice = data.invoices.find((i) => i.id === values.invoiceId);
    if (!invoice || invoice.status !== "sent") return undefined;
    const fields = toFields(values);
    if (fields.amountCents <= 0 || fields.amountCents > maxFor(invoice.id)) return undefined;
    if (fields.date > getToday()) return undefined;
    const now = getNowISO();
    const payment: Payment = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      invoiceId: invoice.id,
      ...fields,
    };
    dispatch({ type: "ADD", collection: "payments", item: payment });
    syncInvoiceStatus(invoice.id, [...data.payments, payment]);
    return payment;
  }

  function updatePayment(id: string, values: PaymentFormValues): boolean {
    const existing = data.payments.find((p) => p.id === id);
    if (!existing) return false;
    const fields = toFields(values);
    if (fields.amountCents <= 0 || fields.amountCents > maxFor(existing.invoiceId, id)) return false;
    if (fields.date > getToday()) return false;
    const updated: Payment = { ...existing, ...fields, updatedAt: getNowISO() };
    dispatch({ type: "UPDATE", collection: "payments", id, patch: { ...fields, updatedAt: updated.updatedAt } });
    syncInvoiceStatus(
      existing.invoiceId,
      data.payments.map((p) => (p.id === id ? updated : p)),
    );
    return true;
  }

  function deletePaymentWithUndo(payment: Payment) {
    const index = data.payments.findIndex((p) => p.id === payment.id);
    const without = data.payments.filter((p) => p.id !== payment.id);
    const invoiceId = payment.invoiceId;
    deleteWithUndo({
      item: payment,
      message: t("payments.deletedToast"),
      onDelete: (p) => {
        dispatch({ type: "REMOVE", collection: "payments", id: p.id });
        syncInvoiceStatus(invoiceId, without);
      },
      onRestore: (p) => {
        dispatch({ type: "RESTORE", collection: "payments", item: p, index });
        syncInvoiceStatus(invoiceId, [...without.slice(0, index), p, ...without.slice(index)]);
      },
    });
  }

  return {
    payments: data.payments,
    maxFor,
    createPayment,
    updatePayment,
    deletePaymentWithUndo,
  };
}
