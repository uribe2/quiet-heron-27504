"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsFormSchema, type SettingsFormValues } from "../schema";
import type { Settings } from "../types";
import { useTranslation } from "@/context/i18n-context";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { amountFromCents, centsFromAmount } from "@/lib/format";

interface SettingsFormProps {
  settings: Settings;
  onSubmit: (values: SettingsFormValues) => void;
}

function parseNumber(raw: unknown): number {
  return typeof raw === "string" && raw.trim() === ""
    ? Number.NaN
    : Number(raw);
}

export function SettingsForm({ settings, onSubmit }: SettingsFormProps) {
  const { t, lang, setLang } = useTranslation();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      userName: settings.userName,
      businessName: settings.businessName,
      currency: settings.currency,
      defaultHourlyRateCents: settings.defaultHourlyRateCents,
      defaultTaxRate: settings.defaultTaxRate,
      defaultPaymentTermsDays: settings.defaultPaymentTermsDays,
    },
  });
  const err = (message?: string) =>
    message ? t(message, { min: 2, max: 100 }) : undefined;

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-8"
      >
        <div className="rounded-xl border border-border bg-surface p-6">
          <FormSection title={t("settings.sectionProfile")}>
            <FormField
              label={t("settings.fieldUserName")}
              required
              error={err(errors.userName?.message)}
            >
              <Input {...register("userName")} />
            </FormField>
            <FormField
              label={t("settings.fieldBusinessName")}
              required
              error={err(errors.businessName?.message)}
            >
              <Input {...register("businessName")} />
            </FormField>
          </FormSection>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <FormSection title={t("settings.sectionBilling")}>
            <FormField label={t("settings.fieldCurrency")} required>
              <Select {...register("currency")}>
                <option value="USD">USD</option>
                <option value="COP">COP</option>
              </Select>
            </FormField>
            <Controller
              control={control}
              name="defaultHourlyRateCents"
              render={({ field }) => (
                <FormField
                  label={t("settings.fieldHourlyRate")}
                  required
                  hint={t("settings.fieldHourlyRateHint")}
                  error={err(errors.defaultHourlyRateCents?.message)}
                >
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={
                      Number.isFinite(field.value)
                        ? amountFromCents(field.value)
                        : ""
                    }
                    onBlur={field.onBlur}
                    onChange={(e) => {
                      const n = parseNumber(e.target.value);
                      field.onChange(Number.isNaN(n) ? n : centsFromAmount(n));
                    }}
                  />
                </FormField>
              )}
            />
            <FormField
              label={t("settings.fieldTaxRate")}
              required
              hint={t("settings.fieldTaxRateHint")}
              error={err(errors.defaultTaxRate?.message)}
            >
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("defaultTaxRate", { setValueAs: parseNumber })}
              />
            </FormField>
            <FormField
              label={t("settings.fieldPaymentTerms")}
              required
              hint={t("settings.fieldPaymentTermsHint")}
              error={err(errors.defaultPaymentTermsDays?.message)}
            >
              <Input
                type="number"
                step="1"
                inputMode="numeric"
                {...register("defaultPaymentTermsDays", {
                  setValueAs: parseNumber,
                })}
              />
            </FormField>
          </FormSection>
        </div>

        <div>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-surface p-6">
        <FormSection title={t("settings.sectionLanguage")}>
          <FormField label={t("settings.fieldLanguage")}>
            <Select
              value={lang}
              onChange={(e) => setLang(e.target.value as "es" | "en")}
            >
              <option value="es">{t("settings.langEs")}</option>
              <option value="en">{t("settings.langEn")}</option>
            </Select>
          </FormField>
        </FormSection>
      </div>
    </div>
  );
}
