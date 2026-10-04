"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { buildOpportunitySchema, type OpportunityFormValues } from "../schema";
import { OPPORTUNITY_STAGES, type Opportunity } from "../types";
import { stageLabelKey } from "../logic";
import type { Client } from "@/features/clients/types";
import { useTranslation } from "@/context/i18n-context";
import { amountFromCents } from "@/lib/format";
import { getToday } from "@/lib/dates";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const OPPORTUNITY_FORM_ID = "opportunity-form";

function toDefaults(opportunity?: Opportunity): OpportunityFormValues {
  return {
    clientId: opportunity?.clientId ?? "",
    title: opportunity?.title ?? "",
    value: opportunity ? amountFromCents(opportunity.estimatedValueCents) : 0,
    stage: opportunity?.stage ?? "contact",
    expectedCloseDate: opportunity?.expectedCloseDate ?? "",
    notes: opportunity?.notes ?? "",
  };
}

interface OpportunityFormProps {
  opportunity?: Opportunity;
  clients: Client[];
  onSubmit: (values: OpportunityFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function OpportunityForm({ opportunity, clients, onSubmit, onDirtyChange }: OpportunityFormProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => buildOpportunitySchema(!opportunity), [opportunity]);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<OpportunityFormValues>({ resolver: zodResolver(schema), defaultValues: toDefaults(opportunity) });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const err = (message?: string) => {
    if (!message) return undefined;
    if (message === "minLength") return t("validation.minLength", { min: 2 });
    if (message === "maxLength") return t("validation.maxLength", { max: 150 });
    return t(`validation.${message}`);
  };

  return (
    <form id={OPPORTUNITY_FORM_ID} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection title={t("pipeline.sectionGeneral")}>
        <FormField label={t("pipeline.fieldClient")} required error={err(errors.clientId?.message)}>
          <Select {...register("clientId")}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("pipeline.fieldTitle")} required error={err(errors.title?.message)}>
          <Input {...register("title")} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("pipeline.fieldValue")} required error={err(errors.value?.message)}>
            <Input type="number" min={0} step="0.01" {...register("value", { valueAsNumber: true })} />
          </FormField>
          <FormField label={t("pipeline.fieldStage")} required>
            <Select {...register("stage")}>
              {OPPORTUNITY_STAGES.map((s) => (
                <option key={s} value={s}>
                  {t(stageLabelKey(s))}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label={t("pipeline.fieldExpectedClose")} error={err(errors.expectedCloseDate?.message)}>
          <Input type="date" min={opportunity ? undefined : getToday()} {...register("expectedCloseDate")} />
        </FormField>
        <FormField label={t("pipeline.fieldNotes")}>
          <Textarea rows={3} {...register("notes")} />
        </FormField>
      </FormSection>
    </form>
  );
}
