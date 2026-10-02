"use client";

import { useTranslation } from "@/context/i18n-context";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import type { QuoteFilters } from "../logic";
import type { Client } from "@/features/clients/types";

export function QuoteFiltersBar({
  filters,
  clients,
  onChange,
}: {
  filters: QuoteFilters;
  clients: Client[];
  onChange: (filters: QuoteFilters) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1">
        <SearchInput
          label={t("quotes.searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quote-status-filter" className="text-xs font-medium text-text-muted">
          {t("quotes.filterStatusLabel")}
        </label>
        <Select
          id="quote-status-filter"
          value={filters.status ?? "all"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as QuoteFilters["status"] })}
          className="w-40"
        >
          <option value="all">{t("quotes.filterStatusAll")}</option>
          <option value="draft">{t("quotes.statusDraft")}</option>
          <option value="sent">{t("quotes.statusSent")}</option>
          <option value="accepted">{t("quotes.statusAccepted")}</option>
          <option value="rejected">{t("quotes.statusRejected")}</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="quote-client-filter" className="text-xs font-medium text-text-muted">
          {t("quotes.filterClientLabel")}
        </label>
        <Select
          id="quote-client-filter"
          value={filters.clientId ?? ""}
          onChange={(e) => onChange({ ...filters, clientId: e.target.value || undefined })}
          className="w-40"
        >
          <option value="">{t("quotes.filterClientAll")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
