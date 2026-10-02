"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "@/context/i18n-context";
import { getToday } from "@/lib/dates";
import type { Project } from "@/features/projects/types";
import type { Deliverable } from "@/features/deliverables/types";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { timeEntrySchema, type TimeEntryFormValues } from "../schema";
import { durationMinutes, entryDate, formatDuration, combineDateTime, toTimeInput } from "../logic";
import type { TimeEntry } from "../types";

export const TIME_FORM_ID = "time-entry-form";

function toDefaults(entry?: TimeEntry): TimeEntryFormValues {
  return {
    projectId: entry?.projectId ?? "",
    deliverableId: entry?.deliverableId ?? "",
    date: entry ? entryDate(entry) : getToday(),
    startTime: entry ? toTimeInput(entry.startedAt) : "",
    endTime: entry ? toTimeInput(entry.endedAt) : "",
    description: entry?.description ?? "",
    billable: entry?.billable ?? true,
  };
}

interface EntryFormProps {
  entry?: TimeEntry;
  projects: Project[];
  deliverables: Deliverable[];
  onSubmit: (values: TimeEntryFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function EntryForm({ entry, projects, deliverables, onSubmit, onDirtyChange }: EntryFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: toDefaults(entry),
  });
  const projectId = watch("projectId");
  const date = watch("date");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const projectDeliverables = deliverables.filter((d) => d.projectId === projectId);
  const minutes =
    date && startTime && endTime
      ? durationMinutes(combineDateTime(date, startTime), combineDateTime(date, endTime))
      : 0;

  function errorText(message?: string): string | undefined {
    if (!message) return undefined;
    return message === "maxDuration" ? t("time.errorMaxDuration") : t(`validation.${message}`, { max: 300 });
  }

  return (
    <form id={TIME_FORM_ID} onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      <FormSection title={t("time.sectionWork")}>
        <FormField label={t("time.fieldProject")} required error={errorText(errors.projectId?.message)}>
          <Select {...register("projectId")}>
            <option value="">—</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("time.fieldDeliverable")}>
          <Select {...register("deliverableId")} disabled={!projectId}>
            <option value="">{t("time.noDeliverable")}</option>
            {projectDeliverables.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label={t("time.fieldDescription")} required error={errorText(errors.description?.message)}>
          <Textarea rows={3} {...register("description")} />
        </FormField>
      </FormSection>

      <FormSection title={t("time.sectionTime")}>
        <FormField label={t("time.fieldDate")} required error={errorText(errors.date?.message)}>
          <Input type="date" max={getToday()} {...register("date")} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t("time.fieldStart")} required error={errorText(errors.startTime?.message)}>
            <Input type="time" {...register("startTime")} />
          </FormField>
          <FormField label={t("time.fieldEnd")} required error={errorText(errors.endTime?.message)}>
            <Input type="time" {...register("endTime")} />
          </FormField>
        </div>
        {minutes > 0 ? (
          <p className="text-sm text-text-muted">{t("time.durationHint", { duration: formatDuration(minutes) })}</p>
        ) : null}
        <Checkbox label={t("time.fieldBillable")} {...register("billable")} />
      </FormSection>
    </form>
  );
}
