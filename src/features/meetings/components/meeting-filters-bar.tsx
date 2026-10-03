"use client";

import { useTranslation } from "@/context/i18n-context";
import { Select } from "@/components/ui/select";
import type { MeetingFilters } from "../logic";
import type { Client } from "@/features/clients/types";

export function MeetingFiltersBar({
  filters,
  clients,
  onChange,
}: {
  filters: MeetingFilters;
  clients: Client[];
  onChange: (filters: MeetingFilters) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface-muted p-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="meeting-client-filter" className="label-eyebrow">
          {t("meetings.filterClientLabel")}
        </label>
        <Select
          id="meeting-client-filter"
          value={filters.clientId ?? ""}
          onChange={(e) => onChange({ ...filters, clientId: e.target.value || undefined })}
          className="w-full sm:w-48"
        >
          <option value="">{t("meetings.filterClientAll")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="meeting-status-filter" className="label-eyebrow">
          {t("meetings.filterStatusLabel")}
        </label>
        <Select
          id="meeting-status-filter"
          value={filters.status ?? "all"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as MeetingFilters["status"] })}
          className="w-full sm:w-48"
        >
          <option value="all">{t("meetings.filterStatusAll")}</option>
          <option value="scheduled">{t("meetings.statusScheduled")}</option>
          <option value="done">{t("meetings.statusDone")}</option>
          <option value="cancelled">{t("meetings.statusCancelled")}</option>
        </Select>
      </div>
    </div>
  );
}
