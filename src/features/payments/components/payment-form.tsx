"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { getToday } from "@/lib/dates";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Invoice } from "@/features/invoices/types";
import type { Payment } from "../types";
import { buildPaymentSchema, type PaymentFormValues } from "../schema";
import { maxAllowedAmount } from "../logic";

interface PaymentFormProps {
  /** Payment being edited (invoice is then fixed). */
  payment?: Payment;
  /** Invoices selectable when creating. */
  invoices: Invoice[];
  defaultInvoiceId?: string;
  onSubmit: (values: PaymentFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function PaymentForm({ payment, invoices, defaultInvoiceId, onSubmit, onDirtyChange }: PaymentFormProps) {
  const { t, formatMoney } = useTranslation();
  const { data } = useData();
  const today = getToday();
  const initialInvoiceId = payment?.invoiceId ?? defaultInvoiceId ?? "";

  function balanceFor(invoiceId: string): number {
    const invoice = data.invoices.find((i) => i.id === invoiceId);
    return invoice ? maxAllowedAmount(invoice, data.payments, payment?.id, today) : 0;
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PaymentFormValues>({
    resolver: (values, ctx, options) =>
      zodResolver(buildPaymentSchema(balanceFor(values.invoiceId), today))(values, ctx, options),
    defaultValues: {
      invoiceId: initialInvoiceId,
      amount: payment ? payment.amountCents / 100 : initialInvoiceId ? balanceFor(initialInvoiceId) / 100 : 0,
      date: payment?.date ?? today,
      method: payment?.method ?? "transfer",
      reference: payment?.reference ?? "",
      notes: payment?.notes ?? "",
    },
  });
  const invoiceId = watch("invoiceId");
  const maxCents = balanceFor(invoiceId);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const amountError = errors.amount
    ? errors.amount.message === "exceedsBalance"
      ? t("payments.errorExceeds", { max: formatMoney(maxCents) })
      : t("validation.mustBePositive")
    : undefined;

  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <FormField label={t("payments.fieldInvoice")} required error={errors.invoiceId ? t("validation.required") : undefined}>
        <Select
          disabled={Boolean(payment) || Boolean(defaultInvoiceId)}
          {...register("invoiceId", {
            onChange: (e) => {
              if (!payment) setValue("amount", balanceFor(e.target.value) / 100);
            },
          })}
        >
          <option value="">{t("payments.fieldInvoiceNone")}</option>
          {invoices.map((inv) => {
            const client = data.clients.find((c) => c.id === inv.clientId);
            return (
              <option key={inv.id} value={inv.id}>
                {inv.number} — {client?.name ?? ""}
              </option>
            );
          })}
        </Select>
      </FormField>
      {invoices.length === 0 && !payment ? (
        <p className="text-sm text-text-muted">{t("payments.noPayableInvoices")}</p>
      ) : null}
      <FormField
        label={t("payments.fieldAmount")}
        required
        error={amountError}
        hint={invoiceId ? t("payments.amountHint", { amount: formatMoney(maxCents) }) : undefined}
      >
        <Input type="number" min={0.01} step="0.01" {...register("amount", { valueAsNumber: true })} />
      </FormField>
      <FormField
        label={t("payments.fieldDate")}
        required
        error={errors.date ? (errors.date.message === "dateNotFuture" ? t("validation.dateNotFuture") : t("validation.required")) : undefined}
      >
        <Input type="date" max={today} {...register("date")} />
      </FormField>
      <FormField label={t("payments.fieldMethod")} required>
        <Select {...register("method")}>
          <option value="transfer">{t("payments.methodTransfer")}</option>
          <option value="card">{t("payments.methodCard")}</option>
          <option value="cash">{t("payments.methodCash")}</option>
          <option value="other">{t("payments.methodOther")}</option>
        </Select>
      </FormField>
      <FormField label={t("payments.fieldReference")}>
        <Input {...register("reference")} />
      </FormField>
      <FormField label={t("payments.fieldNotes")}>
        <Textarea rows={3} {...register("notes")} />
      </FormField>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit(onSubmit)}>
          {payment ? t("payments.saveChanges") : t("payments.save")}
        </Button>
      </div>
    </form>
  );
}
