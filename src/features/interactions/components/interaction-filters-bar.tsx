"use client";

import { useTranslation } from "@/context/i18n-context";
import { Select } from "@/components/ui/select";
import type { InteractionFilters } from "../logic";
import type { Client } from "@/features/clients/types";
import type { InteractionChannel, Sentiment } from "../types";

const CHANNELS: InteractionChannel[] = ["call", "email", "whatsapp", "meeting", "note"];
const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];

export function channelKey(c: InteractionChannel): string {
  return `interactions.channel${c.charAt(0).toUpperCase()}${c.slice(1)}`;
}
export function sentimentKey(s: Sentiment): string {
  return `interactions.sentiment${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

export function InteractionFiltersBar({
  filters,
  clients,
  onChange,
}: {
  filters: InteractionFilters;
  clients: Client[];
  onChange: (filters: InteractionFilters) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="interaction-client-filter" className="text-xs font-medium text-text-muted">
          {t("interactions.filterClientLabel")}
        </label>
        <Select
          id="interaction-client-filter"
          value={filters.clientId ?? ""}
          onChange={(e) => onChange({ ...filters, clientId: e.target.value || undefined })}
          className="w-44"
        >
          <option value="">{t("interactions.filterClientAll")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="interaction-channel-filter" className="text-xs font-medium text-text-muted">
          {t("interactions.filterChannelLabel")}
        </label>
        <Select
          id="interaction-channel-filter"
          value={filters.channel ?? ""}
          onChange={(e) => onChange({ ...filters, channel: (e.target.value || undefined) as InteractionChannel | undefined })}
          className="w-44"
        >
          <option value="">{t("interactions.filterChannelAll")}</option>
          {CHANNELS.map((c) => (
            <option key={c} value={c}>
              {t(channelKey(c))}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="interaction-sentiment-filter" className="text-xs font-medium text-text-muted">
          {t("interactions.filterSentimentLabel")}
        </label>
        <Select
          id="interaction-sentiment-filter"
          value={filters.sentiment ?? ""}
          onChange={(e) => onChange({ ...filters, sentiment: (e.target.value || undefined) as Sentiment | undefined })}
          className="w-44"
        >
          <option value="">{t("interactions.filterSentimentAll")}</option>
          {SENTIMENTS.map((s) => (
            <option key={s} value={s}>
              {t(sentimentKey(s))}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
