"use client";

import { useTranslation } from "@/context/i18n-context";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import type { InvoiceFilters } from "../logic";
import type { Client } from "@/features/clients/types";

export function InvoiceFiltersBar({
  filters,
  clients,
  onChange,
}: {
  filters: InvoiceFilters;
  clients: Client[];
  onChange: (filters: InvoiceFilters) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[240px] flex-1">
        <SearchInput
          id="invoice-search"
          label={t("invoices.searchPlaceholder")}
          value={filters.search ?? ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invoice-status-filter" className="text-xs font-medium text-text-muted">
          {t("invoices.filterStatusLabel")}
        </label>
        <Select
          id="invoice-status-filter"
          value={filters.status ?? "all"}
          onChange={(e) => onChange({ ...filters, status: e.target.value as InvoiceFilters["status"] })}
          className="w-44"
        >
          <option value="all">{t("invoices.filterStatusAll")}</option>
          <option value="draft">{t("invoices.statusDraft")}</option>
          <option value="sent">{t("invoices.statusSent")}</option>
          <option value="overdue">{t("invoices.statusOverdue")}</option>
          <option value="partially_paid">{t("invoices.statusPartiallyPaid")}</option>
          <option value="paid">{t("invoices.statusPaid")}</option>
          <option value="cancelled">{t("invoices.statusCancelled")}</option>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="invoice-client-filter" className="text-xs font-medium text-text-muted">
          {t("invoices.filterClientLabel")}
        </label>
        <Select
          id="invoice-client-filter"
          value={filters.clientId ?? ""}
          onChange={(e) => onChange({ ...filters, clientId: e.target.value || undefined })}
          className="w-44"
        >
          <option value="">{t("invoices.filterClientAll")}</option>
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
