"use client";

import { useTranslation } from "@/context/i18n-context";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import type { ClientFilters } from "../logic";

interface ClientFiltersBarProps {
  filters: ClientFilters;
  tags: string[];
  onChange: (filters: ClientFilters) => void;
}

export function ClientFiltersBar({ filters, tags, onChange }: ClientFiltersBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1">
        <SearchInput
          label={t("clients.searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="client-status-filter" className="text-xs font-medium text-text-muted">
          {t("clients.filterStatusLabel")}
        </label>
        <Select
          id="client-status-filter"
          value={filters.status ?? "active"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ClientFilters["status"] })}
          className="w-40"
        >
          <option value="all">{t("clients.filterStatusAll")}</option>
          <option value="active">{t("clients.filterStatusActive")}</option>
          <option value="archived">{t("clients.filterStatusArchived")}</option>
        </Select>
      </div>
      {tags.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="client-tag-filter" className="text-xs font-medium text-text-muted">
            {t("clients.filterTagLabel")}
          </label>
          <Select
            id="client-tag-filter"
            value={filters.tag ?? ""}
            onChange={(e) => onChange({ ...filters, tag: e.target.value || undefined })}
            className="w-40"
          >
            <option value="">{t("clients.filterStatusAll")}</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </Select>
        </div>
      ) : null}
    </div>
  );
}
