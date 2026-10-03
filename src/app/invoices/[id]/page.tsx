"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useData } from "@/context/data-context";
import { useClients } from "@/features/clients/use-clients";
import { useInvoice, useInvoices } from "@/features/invoices/use-invoices";
import {
  canCancelInvoice,
  canDeleteInvoice,
  canEditNotesAndDue,
  canMarkSent,
  isInvoiceFullyEditable,
} from "@/features/invoices/logic";
import { calculateTotals } from "@/lib/money";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { InvoiceDrawer } from "@/features/invoices/components/invoice-drawer";
import { PaymentDrawer } from "@/features/payments/components/payment-drawer";
import { usePayments } from "@/features/payments/use-payments";
import type { Payment } from "@/features/payments/types";
import { IconButton } from "@/components/ui/icon-button";
import { Pencil, Trash2 } from "lucide-react";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import type { InvoiceFormValues } from "@/features/invoices/schema";
import type { Invoice } from "@/features/invoices/types";

const methodKeys = {
  transfer: "invoices.methodTransfer",
  card: "invoices.methodCard",
  cash: "invoices.methodCash",
  other: "invoices.methodOther",
} as const;

function NotesDueForm({ invoice, onSave }: { invoice: Invoice; onSave: (v: { dueDate: string; notes: string }) => void }) {
  const { t } = useTranslation();
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  const [notes, setNotes] = useState(invoice.notes ?? "");
  const invalid = !dueDate || dueDate < invoice.issueDate;
  return (
    <Card className="mb-6">
      <p className="mb-3 text-sm text-text-muted">{t("invoices.limitedNotice")}</p>
      <div className="flex flex-col gap-4">
        <FormField
          label={t("invoices.fieldDueDate")}
          error={invalid ? t("invoices.errorDueBeforeIssue") : undefined}
        >
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </FormField>
        <FormField label={t("invoices.fieldNotes")}>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <div className="flex justify-end">
          <Button disabled={invalid} onClick={() => onSave({ dueDate, notes })}>
            {t("invoices.saveChanges")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, formatMoney, formatDate } = useTranslation();
  const { show } = useToast();
  const { data } = useData();
  const invoice = useInvoice(id);
  const { updateDraft, updateNotesAndDue, markSent, cancelInvoice, deleteDraftWithUndo, getFinancials } = useInvoices();
  const { clients } = useClients();
  const drawer = useDisclosure(false);
  const paymentDrawer = useDisclosure(false);
  const { deletePaymentWithUndo } = usePayments();
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>();
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!invoice) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-text">{t("invoices.notFoundTitle")}</h1>
        <p className="text-sm text-text-muted">{t("invoices.notFoundBody")}</p>
        <Link
          href="/invoices"
          className="text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          {t("invoices.backToList")}
        </Link>
      </div>
    );
  }

  const current = invoice;
  const client = data.clients.find((c) => c.id === current.clientId);
  const project = data.projects.find((p) => p.id === current.projectId);
  const payments = data.payments
    .filter((p) => p.invoiceId === current.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const totals = calculateTotals(current.items, current.taxRate);
  const financials = getFinancials(current);
  const editable = isInvoiceFullyEditable(current);
  const activeClients = clients.filter((c) => c.status === "active" || c.id === current.clientId);

  function handleSubmit(values: InvoiceFormValues) {
    updateDraft(current.id, values);
    show({ message: t("invoices.savedToast") });
    drawer.close();
  }

  function handleDelete() {
    if (deleteDraftWithUndo(current)) router.push("/invoices");
  }

  return (
    <div>
      <PageHeader
        title={current.number}
        breadcrumbs={[{ label: t("invoices.title"), href: "/invoices" }, { label: current.number }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {editable ? (
              <Button variant="secondary" onClick={drawer.open}>
                {t("invoices.editAction")}
              </Button>
            ) : null}
            {canMarkSent(current) ? (
              <Button
                onClick={() => {
                  markSent(current);
                  show({ message: t("invoices.sentToast") });
                }}
              >
                {t("invoices.markSentAction")}
              </Button>
            ) : null}
            {current.status === "sent" && financials.balanceCents > 0 ? (
              <Button
                onClick={() => {
                  setEditingPayment(undefined);
                  paymentDrawer.open();
                }}
              >
                {t("payments.registerAction")}
              </Button>
            ) : null}
            {canCancelInvoice(current) ? (
              <Button variant="destructive" onClick={() => setConfirmCancel(true)}>
                {t("invoices.cancelAction")}
              </Button>
            ) : null}
            {canDeleteInvoice(current) ? (
              <Button variant="destructive" onClick={handleDelete}>
                {t("invoices.deleteAction")}
              </Button>
            ) : null}
          </div>
        }
      />

      <Card className="mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
          <div>
            <p className="label-eyebrow mb-1 text-text-muted">{t("invoices.columnStatus")}</p>
            <InvoiceStatusBadge status={financials.displayStatus} />
          </div>
          <div>
            <p className="label-eyebrow mb-1 text-text-muted">{t("invoices.fieldClient")}</p>
            <p className="font-medium text-text">{client?.name ?? "—"}</p>
          </div>
          <div>
            <p className="label-eyebrow mb-1 text-text-muted">{t("invoices.fieldProject")}</p>
            <p className="font-medium text-text">{project?.name ?? "—"}</p>
          </div>
          <div>
            <p className="label-eyebrow mb-1 text-text-muted">{t("invoices.columnIssue")}</p>
            <p className="font-medium text-text">{formatDate(current.issueDate)}</p>
          </div>
          <div>
            <p className="label-eyebrow mb-1 text-text-muted">{t("invoices.columnDue")}</p>
            <p className="font-medium text-text">{formatDate(current.dueDate)}</p>
          </div>
        </div>
        {financials.totalCents > 0 ? (
          <div className="mt-5 rounded-lg bg-surface-muted p-4">
            <ProgressBar
              percent={(financials.paidCents / financials.totalCents) * 100}
              label={`${t("invoices.paidLabel")}: ${formatMoney(financials.paidCents)} / ${formatMoney(financials.totalCents)}`}
              tone="success"
            />
          </div>
        ) : null}
        {current.notes ? <p className="mt-4 text-sm text-text-muted">{current.notes}</p> : null}
        {!canEditNotesAndDue(current) ? (
          <p className="mt-4 text-xs text-text-muted">{t("invoices.readOnlyNotice")}</p>
        ) : null}
        {current.status === "sent" ? (
          <p className="mt-2 text-xs text-text-muted">{t("invoices.cancelExplain")}</p>
        ) : null}
      </Card>

      {current.status === "sent" ? (
        <NotesDueForm
          key={`${current.dueDate}|${current.notes ?? ""}`}
          invoice={current}
          onSave={(v) => {
            updateNotesAndDue(current.id, v);
            show({ message: t("invoices.savedToast") });
          }}
        />
      ) : null}

      <h2 className="mb-3 text-xl font-semibold tracking-tight text-text">{t("invoices.sectionItems")}</h2>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{t("invoices.itemDescription")}</TableHeaderCell>
            <TableHeaderCell className="text-right">{t("invoices.itemQuantity")}</TableHeaderCell>
            <TableHeaderCell className="text-right">{t("invoices.itemUnitPrice")}</TableHeaderCell>
            <TableHeaderCell className="text-right">{t("invoices.total")}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {current.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMoney(item.unitPriceCents)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatMoney(Math.round(item.quantity * item.unitPriceCents))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 ml-auto flex max-w-sm flex-col gap-2 rounded-xl border border-border bg-surface p-5 text-sm tabular-nums">
        <div className="flex justify-between">
          <span className="text-text-muted">{t("invoices.subtotal")}</span>
          <span>{formatMoney(totals.subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">
            {t("invoices.tax")} {current.taxRate}
          </span>
          <span>{formatMoney(totals.taxCents)}</span>
        </div>
        <div className="flex justify-between font-semibold text-text">
          <span>{t("invoices.total")}</span>
          <span>{formatMoney(totals.totalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">{t("invoices.paidLabel")}</span>
          <span>{formatMoney(financials.paidCents)}</span>
        </div>
        <div
          className={`-mx-2 mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-base font-semibold ${
            financials.balanceCents > 0 ? "bg-warning-soft text-warning" : "bg-success-soft text-success"
          }`}
        >
          <span>{t("invoices.balanceLabel")}</span>
          <span>{formatMoney(financials.balanceCents)}</span>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-semibold tracking-tight text-text">{t("invoices.paymentsTitle")}</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-text-muted">{t("invoices.noPayments")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {payments.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3 pl-4 text-sm">
              <span>
                {formatDate(p.date)} — {t(methodKeys[p.method])}
                {p.reference ? ` (${t("invoices.paymentReference", { reference: p.reference })})` : ""}
              </span>
              <span className="flex items-center gap-1">
                <span className="font-medium tabular-nums text-success">{formatMoney(p.amountCents)}</span>
                {current.status === "sent" || current.status === "paid" ? (
                  <>
                    <IconButton
                      aria-label={t("payments.editActionFor", { number: current.number })}
                      onClick={() => {
                        setEditingPayment(p);
                        paymentDrawer.open();
                      }}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      aria-label={t("payments.deleteActionFor", { number: current.number })}
                      onClick={() => deletePaymentWithUndo(p)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </IconButton>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <InvoiceDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        clients={activeClients}
        invoice={current}
        onSubmit={handleSubmit}
      />

      <PaymentDrawer
        isOpen={paymentDrawer.isOpen}
        onClose={paymentDrawer.close}
        payment={editingPayment}
        invoiceId={current.id}
      />

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => {
          cancelInvoice(current);
          show({ message: t("invoices.cancelledToast") });
        }}
        title={t("invoices.cancelConfirmTitle", { number: current.number })}
        description={t("invoices.cancelConfirmBody")}
        confirmLabel={t("invoices.cancelConfirmConfirm")}
        cancelLabel={t("invoices.cancelConfirmCancel")}
        destructive
      />
    </div>
  );
}
