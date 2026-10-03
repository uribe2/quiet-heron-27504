"use client";

import { useTranslation } from "@/context/i18n-context";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import type { ProjectFilters } from "../logic";
import type { Client } from "@/features/clients/types";

interface ProjectFiltersBarProps {
  filters: ProjectFilters;
  clients: Client[];
  onChange: (filters: ProjectFilters) => void;
}

export function ProjectFiltersBar({ filters, clients, onChange }: ProjectFiltersBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="min-w-[240px] flex-1">
        <SearchInput
          label={t("projects.searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="project-status-filter" className="text-xs font-medium text-text-muted">
          {t("projects.filterStatusLabel")}
        </label>
        <Select
          id="project-status-filter"
          value={filters.status ?? "active"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ProjectFilters["status"] })}
          className="w-40"
        >
          <option value="all">{t("projects.filterStatusAll")}</option>
          <option value="active">{t("projects.statusActive")}</option>
          <option value="paused">{t("projects.statusPaused")}</option>
          <option value="completed">{t("projects.statusCompleted")}</option>
          <option value="cancelled">{t("projects.statusCancelled")}</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="project-client-filter" className="text-xs font-medium text-text-muted">
          {t("projects.filterClientLabel")}
        </label>
        <Select
          id="project-client-filter"
          value={filters.clientId ?? ""}
          onChange={(e) => onChange({ ...filters, clientId: e.target.value || undefined })}
          className="w-40"
        >
          <option value="">{t("projects.filterClientAll")}</option>
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
