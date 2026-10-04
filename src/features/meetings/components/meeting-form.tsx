"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { buildMeetingSchema, MEETING_TITLE_MAX, type MeetingFormValues } from "../schema";
import type { Meeting } from "../types";
import type { Client } from "@/features/clients/types";
import type { Project } from "@/features/projects/types";
import { useTranslation } from "@/context/i18n-context";
import { useMeetings } from "../use-meetings";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string {
  if (!value) return "";
  return new Date(value).toISOString();
}

function meetingToDefaults(meeting?: Meeting): MeetingFormValues {
  return {
    title: meeting?.title ?? "",
    clientId: meeting?.clientId,
    projectId: meeting?.projectId,
    startsAt: meeting ? toDatetimeLocal(meeting.startsAt) : "",
    durationMinutes: meeting?.durationMinutes ?? 30,
    mode: meeting?.mode ?? "video",
    locationOrLink: meeting?.locationOrLink ?? "",
    agenda: meeting?.agenda ?? "",
  };
}

/** Maps a schema error code to its translated message. */
export function meetingErrorKey(code: string): string {
  return code === "durationRange" ? "meetings.errorDuration" : `validation.${code}`;
}

export const MEETING_FORM_ID = "meeting-form";

interface MeetingFormProps {
  meeting?: Meeting;
  clients: Client[];
  projects: Project[];
  onSubmit: (values: MeetingFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function MeetingForm({ meeting, clients, projects, onSubmit, onDirtyChange }: MeetingFormProps) {
  const { t } = useTranslation();
  const { getOverlaps } = useMeetings();
  const schema = useMemo(() => buildMeetingSchema(!meeting || meeting.status === "scheduled"), [meeting]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: meetingToDefaults(meeting),
  });
  const mode = watch("mode");
  const startsAt = watch("startsAt");
  const durationMinutes = watch("durationMinutes");

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const overlaps = startsAt
    ? getOverlaps(fromDatetimeLocal(startsAt), Number(durationMinutes) || 0, meeting?.id)
    : [];

  return (
    <form noValidate
      id={MEETING_FORM_ID}
      onSubmit={handleSubmit((values) => onSubmit({ ...values, startsAt: fromDatetimeLocal(values.startsAt) }))}
      className="flex flex-col gap-6"
    >
      <FormSection title={t("meetings.fieldTitle")}>
        <FormField
          label={t("meetings.fieldTitle")}
          required
          error={errors.title?.message && t(meetingErrorKey(errors.title.message), { max: MEETING_TITLE_MAX })}
        >
          <Input {...register("title")} />
        </FormField>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={t("meetings.fieldClient")}>
            <Select {...register("clientId")}>
              <option value="">—</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label={t("meetings.fieldProject")}>
            <Select {...register("projectId")}>
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </FormSection>

      <FormSection title={t("meetings.fieldStartsAt")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={t("meetings.fieldStartsAt")}
            required
            error={errors.startsAt?.message && t(meetingErrorKey(errors.startsAt.message))}
          >
            <Input type="datetime-local" {...register("startsAt")} />
          </FormField>
          <FormField
            label={t("meetings.fieldDuration")}
            required
            error={errors.durationMinutes?.message && t(meetingErrorKey(errors.durationMinutes.message))}
          >
            <Input type="number" min={15} max={480} step={15} {...register("durationMinutes", { valueAsNumber: true })} />
          </FormField>
        </div>
        {overlaps.length > 0 ? <p role="status" className="flex items-center gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-xs font-medium text-warning"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{t("meetings.overlapWarning")}</p> : null}
        <FormField label={t("meetings.fieldMode")} required>
          <Select {...register("mode")}>
            <option value="in_person">{t("meetings.modeInPerson")}</option>
            <option value="video">{t("meetings.modeVideo")}</option>
            <option value="call">{t("meetings.modeCall")}</option>
          </Select>
        </FormField>
        <FormField
          label={t("meetings.fieldLocationOrLink")}
          required={mode === "video"}
          error={errors.locationOrLink?.message && t(meetingErrorKey(errors.locationOrLink.message))}
        >
          <Input {...register("locationOrLink")} />
        </FormField>
        <FormField label={t("meetings.fieldAgenda")}>
          <Textarea rows={3} {...register("agenda")} />
        </FormField>
      </FormSection>
    </form>
  );
}
