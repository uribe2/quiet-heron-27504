"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { deliverableSchema, type DeliverableFormValues } from "../schema";
import type { Deliverable } from "../types";
import type { Project } from "@/features/projects/types";
import { isDueAfterProject } from "../logic";
import { useTranslation } from "@/context/i18n-context";
import { getToday } from "@/lib/dates";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const DELIVERABLE_FORM_ID = "deliverable-form";

interface DeliverableFormProps {
  deliverable?: Deliverable;
  defaultProjectId?: string;
  projects: Project[];
  onSubmit: (values: DeliverableFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function DeliverableForm({ deliverable, defaultProjectId, projects, onSubmit, onDirtyChange }: DeliverableFormProps) {
  const { t, formatDate } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<DeliverableFormValues>({
    resolver: zodResolver(deliverableSchema),
    defaultValues: {
      projectId: deliverable?.projectId ?? defaultProjectId ?? "",
      title: deliverable?.title ?? "",
      dueDate: deliverable?.dueDate ?? getToday(),
      description: deliverable?.description ?? "",
      externalUrl: deliverable?.externalUrl ?? "",
    },
  });
  const projectId = watch("projectId");
  const dueDate = watch("dueDate");
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function err(message?: string) {
    return message ? t(`validation.${message}`, { min: "1", max: "150" }) : undefined;
  }

  return (
    <form id={DELIVERABLE_FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <FormSection title={t("deliverables.drawerCreateTitle")}>
        <FormField label={t("deliverables.fieldProject")} required error={err(errors.projectId?.message)}>
          <Select {...register("projectId")}>
            <option value="">{t("deliverables.selectProject")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("deliverables.fieldTitle")} required error={err(errors.title?.message)}>
          <Input {...register("title")} />
        </FormField>
        <FormField label={t("deliverables.fieldDueDate")} required error={err(errors.dueDate?.message)}>
          <Input type="date" {...register("dueDate")} />
        </FormField>
        {project && isDueAfterProject(dueDate, project) ? (
          <p role="status" className="text-sm text-warning">
            {t("deliverables.dueAfterProjectWarning", { date: formatDate(project.dueDate) })}
          </p>
        ) : null}
        <FormField label={t("deliverables.fieldDescription")}>
          <Textarea rows={3} {...register("description")} />
        </FormField>
        <FormField label={t("deliverables.fieldExternalUrl")} error={err(errors.externalUrl?.message)}>
          <Input type="url" inputMode="url" placeholder="https://" {...register("externalUrl")} />
        </FormField>
      </FormSection>
    </form>
  );
}
