"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { quoteFormSchema, type QuoteFormValues } from "../schema";
import type { Quote } from "../types";
import type { Client } from "@/features/clients/types";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { calculateTotals } from "@/lib/money";
import { generateId } from "@/lib/ids";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";

function quoteToDefaults(
  quote: Quote | undefined,
  defaultTaxRate: number,
  initialValues?: Partial<QuoteFormValues>,
): QuoteFormValues {
  return {
    clientId: quote?.clientId ?? "",
    opportunityId: quote?.opportunityId,
    title: quote?.title ?? "",
    items: quote?.items ?? [{ id: generateId(), description: "", quantity: 1, unitPriceCents: 0 }],
    taxRate: quote?.taxRate ?? defaultTaxRate,
    paymentTerms: quote?.paymentTerms ?? "",
    validUntil: quote?.validUntil ?? "",
    scope: quote?.scope ?? "",
    ...(quote ? {} : initialValues),
  };
}

interface QuoteFormProps {
  quote?: Quote;
  clients: Client[];
  readOnly?: boolean;
  initialValues?: Partial<QuoteFormValues>;
  onSubmit: (values: QuoteFormValues, intent: "draft" | "send") => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function QuoteForm({ quote, clients, readOnly = false, initialValues, onSubmit, onDirtyChange }: QuoteFormProps) {
  const { t, formatMoney } = useTranslation();
  const { data } = useData();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: quoteToDefaults(quote, data.settings.defaultTaxRate, initialValues),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const items = watch("items");
  const taxRate = watch("taxRate");

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const totals = useMemo(() => calculateTotals(items, taxRate || 0), [items, taxRate]);
  const itemsError = (errors.items as { message?: string } | undefined)?.message;
  const titleError = errors.title
    ? errors.title.type === "too_big"
      ? t("validation.maxLength", { max: 150 })
      : errors.title.type === "too_small" && (watch("title") ?? "").trim().length > 0
        ? t("validation.minLength", { min: 2 })
        : t("validation.required")
    : undefined;
  const showSend = !readOnly && quote?.status !== "sent";

  return (
    <form noValidate className="flex flex-col gap-6">
      <FormSection title={t("quotes.sectionClient")}>
        <FormField label={t("quotes.fieldClient")} required error={errors.clientId ? t("validation.required") : undefined}>
          <Select {...register("clientId")} disabled={readOnly}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("quotes.fieldTitle")} required error={titleError}>
          <Input {...register("title")} disabled={readOnly} />
        </FormField>
      </FormSection>

      <FormSection title={t("quotes.sectionItems")}>
        {itemsError ? (
          <p role="alert" className="text-xs text-danger">
            {t("quotes.errorNoItems")}
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_80px_120px_44px] items-end gap-2">
              <FormField
                label={t("quotes.itemDescription")}
                error={errors.items?.[index]?.description ? t("validation.required") : undefined}
              >
                <Input {...register(`items.${index}.description`)} disabled={readOnly} />
              </FormField>
              <FormField
                label={t("quotes.itemQuantity")}
                error={errors.items?.[index]?.quantity ? t("validation.mustBePositive") : undefined}
              >
                <Input
                  type="number"
                  min={0.01}
                  step="0.01"
                  disabled={readOnly}
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                />
              </FormField>
              <Controller
                control={control}
                name={`items.${index}.unitPriceCents`}
                render={({ field: priceField }) => (
                  <FormField
                    label={t("quotes.itemUnitPrice")}
                    error={errors.items?.[index]?.unitPriceCents ? t("validation.mustBeNonNegative") : undefined}
                  >
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      disabled={readOnly}
                      value={priceField.value / 100}
                      onChange={(e) => priceField.onChange(Math.round(Number(e.target.value) * 100))}
                    />
                  </FormField>
                )}
              />
              {!readOnly ? (
                <IconButton aria-label={t("quotes.removeItem")} onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>
        {!readOnly ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() => append({ id: generateId(), description: "", quantity: 1, unitPriceCents: 0 })}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("quotes.addItem")}
          </Button>
        ) : null}
      </FormSection>

      <FormSection title={t("quotes.sectionTerms")}>
        <FormField label={t("quotes.fieldPaymentTerms")} required error={errors.paymentTerms ? t("validation.required") : undefined}>
          <Input {...register("paymentTerms")} disabled={readOnly} />
        </FormField>
        <FormField label={t("quotes.fieldValidUntil")} required error={errors.validUntil ? t("validation.required") : undefined}>
          <Input type="date" {...register("validUntil")} disabled={readOnly} />
        </FormField>
        <FormField label={t("quotes.fieldScope")}>
          <Textarea rows={3} {...register("scope")} disabled={readOnly} />
        </FormField>
      </FormSection>

      <div
        data-testid="quote-sticky-footer"
        className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 bg-surface px-1 pb-1 pt-3 shadow-[0_-8px_8px_-8px_rgba(15,23,42,0.15)]"
      >
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted p-4 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-text-muted">{t("quotes.subtotal")}</span>
              <span>{formatMoney(totals.subtotalCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{t("quotes.tax")}</span>
              <Input
                type="number"
                min={0}
                max={100}
                step="0.1"
                className="h-8 w-20 text-right"
                disabled={readOnly}
                aria-label={t("quotes.tax")}
                aria-invalid={Boolean(errors.taxRate)}
                {...register("taxRate", { valueAsNumber: true })}
              />
            </div>
            {errors.taxRate ? (
              <p role="alert" className="text-right text-xs text-danger">
                {t("quotes.errorTaxRate")}
              </p>
            ) : null}
            <div className="flex justify-between font-semibold text-text">
              <span>{t("quotes.total")}</span>
              <span>{formatMoney(totals.totalCents)}</span>
            </div>
          </div>
        {!readOnly ? (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleSubmit((values) => onSubmit(values, "draft"))}>
              {t("quotes.saveDraft")}
            </Button>
            {showSend ? (
              <Button type="button" onClick={handleSubmit((values) => onSubmit(values, "send"))}>
                {t("quotes.saveAndSend")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
