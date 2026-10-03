"use client";

import { useTranslation } from "@/context/i18n-context";
import { Select } from "@/components/ui/select";
import type { DeliverableFilters } from "../logic";
import type { Project } from "@/features/projects/types";

export function DeliverableFiltersBar({
  filters,
  projects,
  onChange,
}: {
  filters: DeliverableFilters;
  projects: Project[];
  onChange: (filters: DeliverableFilters) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="deliverable-project-filter" className="text-xs font-medium text-text-muted">
          {t("deliverables.filterProjectLabel")}
        </label>
        <Select
          id="deliverable-project-filter"
          value={filters.projectId ?? ""}
          onChange={(e) => onChange({ ...filters, projectId: e.target.value || undefined })}
          className="w-56"
        >
          <option value="">{t("deliverables.filterProjectAll")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="deliverable-status-filter" className="text-xs font-medium text-text-muted">
          {t("deliverables.filterStatusLabel")}
        </label>
        <Select
          id="deliverable-status-filter"
          value={filters.status ?? "active"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as DeliverableFilters["status"] })}
          className="w-56"
        >
          <option value="active">{t("deliverables.filterStatusActive")}</option>
          <option value="all">{t("deliverables.filterStatusAll")}</option>
          <option value="pending">{t("deliverables.statusPending")}</option>
          <option value="in_progress">{t("deliverables.statusInProgress")}</option>
          <option value="delivered">{t("deliverables.statusDelivered")}</option>
        </Select>
      </div>
    </div>
  );
}
