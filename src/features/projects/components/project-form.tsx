"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { projectFormSchema, type ProjectFormValues } from "../schema";
import type { Project } from "../types";
import type { Client } from "@/features/clients/types";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { amountFromCents, centsFromAmount } from "@/lib/format";

export const PROJECT_FORM_ID = "project-form";

function projectToDefaults(project?: Project, defaultHourlyRateCents?: number): ProjectFormValues {
  return {
    clientId: project?.clientId ?? "",
    name: project?.name ?? "",
    description: project?.description ?? "",
    billingType: project?.billingType ?? "hourly",
    hourlyRateCents: project?.hourlyRateCents ?? defaultHourlyRateCents,
    budgetCents: project?.budgetCents,
    estimatedHours: project?.estimatedHours,
    startDate: project?.startDate ?? "",
    dueDate: project?.dueDate ?? "",
  };
}

interface ProjectFormProps {
  project?: Project;
  clients: Client[];
  onSubmit: (values: ProjectFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function ProjectForm({ project, clients, onSubmit, onDirtyChange }: ProjectFormProps) {
  const { t } = useTranslation();
  const { data } = useData();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: projectToDefaults(project, data.settings.defaultHourlyRateCents),
  });
  const billingType = watch("billingType");

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  return (
    <form id={PROJECT_FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormSection title={t("projects.fieldClient")}>
        <FormField label={t("projects.fieldClient")} required>
          <Select {...register("clientId")}>
            <option value="">—</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("projects.fieldName")} required error={errors.name?.message && t("validation.minLength", { min: 2 })}>
          <Input {...register("name")} />
        </FormField>
        <FormField label={t("projects.fieldDescription")}>
          <Textarea rows={2} {...register("description")} />
        </FormField>
      </FormSection>

      <FormSection title={t("projects.fieldBillingType")}>
        <FormField label={t("projects.fieldBillingType")} required>
          <Select {...register("billingType")}>
            <option value="hourly">{t("projects.billingHourly")}</option>
            <option value="fixed">{t("projects.billingFixed")}</option>
          </Select>
        </FormField>
        {billingType === "hourly" ? (
          <Controller
            control={control}
            name="hourlyRateCents"
            render={({ field }) => (
              <FormField
                label={t("projects.fieldHourlyRate")}
                required
                error={errors.hourlyRateCents?.message && t("validation.required")}
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={field.value != null ? amountFromCents(field.value) : ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : centsFromAmount(Number(e.target.value)))}
                />
              </FormField>
            )}
          />
        ) : (
          <Controller
            control={control}
            name="budgetCents"
            render={({ field }) => (
              <FormField
                label={t("projects.fieldBudget")}
                required
                error={errors.budgetCents?.message && t("validation.required")}
              >
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={field.value != null ? amountFromCents(field.value) : ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : centsFromAmount(Number(e.target.value)))}
                />
              </FormField>
            )}
          />
        )}
        <Controller
          control={control}
          name="estimatedHours"
          render={({ field }) => (
            <FormField label={t("projects.fieldEstimatedHours")}>
              <Input
                type="number"
                min={0}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </FormField>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("projects.fieldStartDate")} required>
            <Input type="date" {...register("startDate")} />
          </FormField>
          <FormField
            label={t("projects.fieldDueDate")}
            required
            error={errors.dueDate?.message && t("validation.endAfterStart")}
          >
            <Input type="date" {...register("dueDate")} />
          </FormField>
        </div>
      </FormSection>
    </form>
  );
}
