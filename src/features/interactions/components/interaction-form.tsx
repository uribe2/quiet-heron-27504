"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { interactionFormSchema, type InteractionFormValues } from "../schema";
import type { Interaction } from "../types";
import type { Client } from "@/features/clients/types";
import { useTranslation } from "@/context/i18n-context";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDefaults(interaction: Interaction | undefined, clientId: string | undefined): InteractionFormValues {
  return {
    clientId: interaction?.clientId ?? clientId ?? "",
    channel: interaction?.channel ?? "call",
    occurredAt: toDatetimeLocal(interaction?.occurredAt ?? new Date().toISOString()),
    summary: interaction?.summary ?? "",
    sentiment: interaction?.sentiment ?? "neutral",
    followUpDate: interaction?.followUpDate ?? "",
  };
}

export const INTERACTION_FORM_ID = "interaction-form";

interface InteractionFormProps {
  interaction?: Interaction;
  presetClientId?: string;
  clients: Client[];
  onSubmit: (values: InteractionFormValues) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export function InteractionForm({ interaction, presetClientId, clients, onSubmit, onDirtyChange }: InteractionFormProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: toDefaults(interaction, presetClientId),
  });
  const summary = watch("summary") ?? "";
  const occurredAt = watch("occurredAt");

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  function errorText(message?: string): string | undefined {
    if (!message) return undefined;
    if (message === "followUpBeforeDate") return t("interactions.followUpBeforeDate");
    if (message === "maxLength") return t("validation.maxLength", { max: 500 });
    return t(`validation.${message}`);
  }

  return (
    <form id={INTERACTION_FORM_ID} noValidate onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FormField label={t("interactions.fieldClient")} required error={errorText(errors.clientId?.message)}>
        <Select {...register("clientId")}>
          <option value="">—</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t("interactions.fieldChannel")} required>
          <Select {...register("channel")}>
            <option value="call">{t("interactions.channelCall")}</option>
            <option value="email">{t("interactions.channelEmail")}</option>
            <option value="whatsapp">{t("interactions.channelWhatsapp")}</option>
            <option value="meeting">{t("interactions.channelMeeting")}</option>
            <option value="note">{t("interactions.channelNote")}</option>
          </Select>
        </FormField>
        <FormField label={t("interactions.fieldSentiment")} required>
          <Select {...register("sentiment")}>
            <option value="positive">{t("interactions.sentimentPositive")}</option>
            <option value="neutral">{t("interactions.sentimentNeutral")}</option>
            <option value="negative">{t("interactions.sentimentNegative")}</option>
          </Select>
        </FormField>
      </div>
      <FormField label={t("interactions.fieldOccurredAt")} required error={errorText(errors.occurredAt?.message)}>
        <Input
          type="datetime-local"
          max={toDatetimeLocal(new Date().toISOString())}
          {...register("occurredAt")}
        />
      </FormField>
      <div className="flex flex-col gap-1.5">
        <FormField label={t("interactions.fieldSummary")} required error={errorText(errors.summary?.message)}>
          <Textarea rows={4} {...register("summary")} />
        </FormField>
        <p className={`text-xs ${summary.length > 500 ? "text-danger" : "text-text-muted"}`} aria-live="polite">
          {t("interactions.summaryCounter", { count: summary.length })}
        </p>
      </div>
      <FormField label={t("interactions.fieldFollowUpDate")} error={errorText(errors.followUpDate?.message)}>
        <Input type="date" min={occurredAt ? occurredAt.slice(0, 10) : undefined} {...register("followUpDate")} />
      </FormField>
    </form>
  );
}
