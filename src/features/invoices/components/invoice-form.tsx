"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { invoiceFormSchema, type InvoiceFormValues } from "../schema";
import type { Invoice } from "../types";
import type { Client } from "@/features/clients/types";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { calculateTotals } from "@/lib/money";
import { generateId } from "@/lib/ids";
import { addDays, getToday } from "@/lib/dates";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";

function toDefaults(invoice: Invoice | undefined, terms: number, taxRate: number): InvoiceFormValues {
  const issue = getToday();
  return {
    clientId: invoice?.clientId ?? "",
    projectId: invoice?.projectId,
    quoteId: invoice?.quoteId,
    issueDate: invoice?.issueDate ?? issue,
    dueDate: invoice?.dueDate ?? addDays(issue, terms),
    items: invoice?.items ?? [{ id: generateId(), description: "", quantity: 1, unitPriceCents: 0 }],
    taxRate: invoice?.taxRate ?? taxRate,
    notes: invoice?.notes ?? "",
  };
}

interface InvoiceFormProps {
  invoice?: Invoice;
  clients: Client[];
  onSubmit: (values: InvoiceFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function InvoiceForm({ invoice, clients, onSubmit, onDirtyChange }: InvoiceFormProps) {
  const { t, formatMoney } = useTranslation();
  const { data } = useData();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: toDefaults(invoice, data.settings.defaultPaymentTermsDays, data.settings.defaultTaxRate),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const taxRate = watch("taxRate");

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const totals = useMemo(() => calculateTotals(items, taxRate || 0), [items, taxRate]);
  const itemsError = (errors.items as { message?: string } | undefined)?.message;
  const dueError = errors.dueDate ? t("invoices.errorDueBeforeIssue") : undefined;

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
      <FormSection title={t("invoices.sectionGeneral")}>
        <FormField label={t("invoices.fieldClient")} required error={errors.clientId ? t("validation.required") : undefined}>
          <Select {...register("clientId")}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("invoices.fieldProject")}>
          <Select {...register("projectId", { setValueAs: (v: string) => v || undefined })}>
            <option value="">—</option>
            {data.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label={t("invoices.fieldIssueDate")} required error={errors.issueDate ? t("validation.required") : undefined}>
            <Input type="date" {...register("issueDate")} />
          </FormField>
          <FormField label={t("invoices.fieldDueDate")} required error={dueError}>
            <Input type="date" {...register("dueDate")} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title={t("invoices.sectionItems")}>
        {itemsError ? <p className="text-xs text-danger">{t("validation.required")}</p> : null}
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_80px_120px_44px] items-end gap-2">
              <FormField
                label={t("invoices.itemDescription")}
                error={errors.items?.[index]?.description ? t("validation.required") : undefined}
              >
                <Input {...register(`items.${index}.description`)} />
              </FormField>
              <FormField
                label={t("invoices.itemQuantity")}
                error={errors.items?.[index]?.quantity ? t("validation.mustBePositive") : undefined}
              >
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                 
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                />
              </FormField>
              <Controller
                control={control}
                name={`items.${index}.unitPriceCents`}
                render={({ field: priceField }) => (
                  <FormField label={t("invoices.itemUnitPrice")}>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                     
                      value={priceField.value / 100}
                      onChange={(e) => priceField.onChange(Math.round(Number(e.target.value) * 100))}
                    />
                  </FormField>
                )}
              />
              <IconButton aria-label={t("invoices.removeItem")} onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => append({ id: generateId(), description: "", quantity: 1, unitPriceCents: 0 })}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("invoices.addItem")}
        </Button>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted p-4 text-sm tabular-nums">
          <div className="flex justify-between">
            <span className="text-text-muted">{t("invoices.subtotal")}</span>
            <span>{formatMoney(totals.subtotalCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="invoice-tax-rate" className="text-text-muted">
              {t("invoices.tax")}
            </label>
            <Input
              id="invoice-tax-rate"
              type="number"
              min={0}
              max={100}
              step="0.1"
              className="h-9 w-20 text-right"
             
              {...register("taxRate", { valueAsNumber: true })}
            />
          </div>
          <div className="flex justify-between font-semibold text-text">
            <span>{t("invoices.total")}</span>
            <span>{formatMoney(totals.totalCents)}</span>
          </div>
        </div>
      </FormSection>

      <FormSection title={t("invoices.sectionNotes")}>
        <FormField label={t("invoices.fieldNotes")}>
          <Textarea rows={3} {...register("notes")} />
        </FormField>
      </FormSection>

      <div className="flex justify-end gap-3">
        <Button type="button" onClick={handleSubmit(onSubmit)}>
          {invoice ? t("invoices.saveChanges") : t("invoices.saveDraft")}
        </Button>
      </div>
    </form>
  );
}
