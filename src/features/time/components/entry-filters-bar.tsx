"use client";

import { useTranslation } from "@/context/i18n-context";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Project } from "@/features/projects/types";
import type { TimeFilters, TriFilter } from "../logic";

interface EntryFiltersBarProps {
  filters: TimeFilters;
  projects: Project[];
  onChange: (filters: TimeFilters) => void;
}

function Labeled({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export function EntryFiltersBar({ filters, projects, onChange }: EntryFiltersBarProps) {
  const { t } = useTranslation();

  const triOptions = (
    <>
      <option value="all">{t("time.filterAll")}</option>
      <option value="yes">{t("common.yes")}</option>
      <option value="no">{t("common.no")}</option>
    </>
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
      <Labeled id="time-filter-project" label={t("time.filterProject")}>
        <Select
          id="time-filter-project"
          value={filters.projectId ?? ""}
          onChange={(e) => onChange({ ...filters, projectId: e.target.value || undefined })}
          className="w-48"
        >
          <option value="">{t("time.filterAll")}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Labeled>
      <Labeled id="time-filter-billable" label={t("time.filterBillable")}>
        <Select
          id="time-filter-billable"
          value={filters.billable ?? "all"}
          onChange={(e) => onChange({ ...filters, billable: e.target.value as TriFilter })}
          className="w-32"
        >
          {triOptions}
        </Select>
      </Labeled>
      <Labeled id="time-filter-invoiced" label={t("time.filterInvoiced")}>
        <Select
          id="time-filter-invoiced"
          value={filters.invoiced ?? "all"}
          onChange={(e) => onChange({ ...filters, invoiced: e.target.value as TriFilter })}
          className="w-32"
        >
          {triOptions}
        </Select>
      </Labeled>
      <Labeled id="time-filter-from" label={t("time.filterFrom")}>
        <Input
          id="time-filter-from"
          type="date"
          value={filters.from ?? ""}
          onChange={(e) => onChange({ ...filters, from: e.target.value || undefined })}
          className="w-40"
        />
      </Labeled>
      <Labeled id="time-filter-to" label={t("time.filterTo")}>
        <Input
          id="time-filter-to"
          type="date"
          value={filters.to ?? ""}
          onChange={(e) => onChange({ ...filters, to: e.target.value || undefined })}
          className="w-40"
        />
      </Labeled>
    </div>
  );
}
