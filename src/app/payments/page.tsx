"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { usePayments } from "@/features/payments/use-payments";
import { filterPayments, sumPayments, type PaymentFilters } from "@/features/payments/logic";
import { IncomeSummary } from "@/features/payments/components/income-summary";
import { PaymentTable } from "@/features/payments/components/payment-table";
import { PaymentDrawer } from "@/features/payments/components/payment-drawer";
import type { Payment } from "@/features/payments/types";

export default function PaymentsPage() {
  const { t, formatMoney } = useTranslation();
  const { data } = useData();
  const { payments, deletePaymentWithUndo } = usePayments();
  const drawer = useDisclosure(false);
  const [editing, setEditing] = useState<Payment | undefined>();
  const [filters, setFilters] = useState<PaymentFilters>({});

  const filtered = useMemo(
    () => filterPayments(payments, data.invoices, filters),
    [payments, data.invoices, filters],
  );
  const hasFilters = Boolean(filters.clientId || (filters.method && filters.method !== "all") || filters.from || filters.to);

  function openCreate() {
    setEditing(undefined);
    drawer.open();
  }

  function openEdit(payment: Payment) {
    setEditing(payment);
    drawer.open();
  }

  return (
    <div>
      <PageHeader
        title={t("payments.title")}
        description={t("payments.description")}
        actions={<Button onClick={openCreate}>{t("payments.createButton")}</Button>}
      />

      <IncomeSummary />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-client-filter" className="text-xs font-medium text-text-muted">
            {t("payments.filterClient")}
          </label>
          <Select
            id="payment-client-filter"
            className="w-44"
            value={filters.clientId ?? ""}
            onChange={(e) => setFilters({ ...filters, clientId: e.target.value || undefined })}
          >
            <option value="">{t("payments.filterAll")}</option>
            {data.clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-method-filter" className="text-xs font-medium text-text-muted">
            {t("payments.filterMethod")}
          </label>
          <Select
            id="payment-method-filter"
            className="w-44"
            value={filters.method ?? "all"}
            onChange={(e) => setFilters({ ...filters, method: e.target.value as PaymentFilters["method"] })}
          >
            <option value="all">{t("payments.filterAll")}</option>
            <option value="transfer">{t("payments.methodTransfer")}</option>
            <option value="card">{t("payments.methodCard")}</option>
            <option value="cash">{t("payments.methodCash")}</option>
            <option value="other">{t("payments.methodOther")}</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-from-filter" className="text-xs font-medium text-text-muted">
            {t("payments.filterFrom")}
          </label>
          <Input
            id="payment-from-filter"
            type="date"
            className="w-44"
            value={filters.from ?? ""}
            onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="payment-to-filter" className="text-xs font-medium text-text-muted">
            {t("payments.filterTo")}
          </label>
          <Input
            id="payment-to-filter"
            type="date"
            className="w-44"
            value={filters.to ?? ""}
            onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
          />
        </div>
        {hasFilters ? (
          <Button variant="secondary" onClick={() => setFilters({})}>
            {t("payments.clearFilters")}
          </Button>
        ) : null}
      </div>

      <Card className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-text-muted">{t("payments.totalCollected")}</span>
        <span className="text-lg font-semibold text-text" aria-live="polite">
          {formatMoney(sumPayments(filtered))}{" "}
          <span className="text-sm font-normal text-text-muted">
            ({t("payments.totalCount", { count: String(filtered.length) })})
          </span>
        </span>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={hasFilters ? t("payments.emptyFilteredTitle") : t("payments.emptyTitle")}
          description={hasFilters ? t("payments.emptyFilteredDescription") : t("payments.emptyDescription")}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={() => setFilters({})}>
                {t("payments.clearFilters")}
              </Button>
            ) : (
              <Button onClick={openCreate}>{t("payments.createButton")}</Button>
            )
          }
        />
      ) : (
        <PaymentTable payments={filtered} onEdit={openEdit} onDelete={deletePaymentWithUndo} />
      )}

      <PaymentDrawer isOpen={drawer.isOpen} onClose={drawer.close} payment={editing} />
    </div>
  );
}
