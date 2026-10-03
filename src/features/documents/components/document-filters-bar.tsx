"use client";

import { useTranslation } from "@/context/i18n-context";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import type { DocumentFilters } from "../logic";
import type { DocumentKind } from "../types";
import { DOCUMENT_KINDS, kindLabelKey } from "./kind-meta";
import type { Client } from "@/features/clients/types";
import type { Project } from "@/features/projects/types";

interface Props {
  filters: DocumentFilters;
  clients: Client[];
  projects: Project[];
  tags: string[];
  onChange: (filters: DocumentFilters) => void;
}

const labelClass = "label-eyebrow";

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Select id={id} className="w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </Select>
    </div>
  );
}

export function DocumentFiltersBar({ filters, clients, projects, tags, onChange }: Props) {
  const { t } = useTranslation();
  const all = <option value="">{t("documents.filterAll")}</option>;

  return (
    <div className="grid w-full grid-cols-1 items-end gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="min-w-0">
        <SearchInput
          id="document-search"
          label={t("documents.searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <FilterSelect
        id="document-kind-filter"
        label={t("documents.filterKindLabel")}
        value={filters.kind ?? ""}
        onChange={(v) => onChange({ ...filters, kind: (v || undefined) as DocumentKind | undefined })}
      >
        {all}
        {DOCUMENT_KINDS.map((k) => (
          <option key={k} value={k}>
            {t(kindLabelKey(k))}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="document-client-filter"
        label={t("documents.filterClientLabel")}
        value={filters.clientId ?? ""}
        onChange={(v) => onChange({ ...filters, clientId: v || undefined })}
      >
        {all}
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="document-project-filter"
        label={t("documents.filterProjectLabel")}
        value={filters.projectId ?? ""}
        onChange={(v) => onChange({ ...filters, projectId: v || undefined })}
      >
        {all}
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect
        id="document-tag-filter"
        label={t("documents.filterTagLabel")}
        value={filters.tag ?? ""}
        onChange={(v) => onChange({ ...filters, tag: v || undefined })}
      >
        {all}
        {tags.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}
