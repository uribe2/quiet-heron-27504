"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useData } from "@/context/data-context";
import { useClients } from "@/features/clients/use-clients";
import { useInvoices } from "@/features/invoices/use-invoices";
import { filterInvoices, getInvoiceKpis, type InvoiceFilters } from "@/features/invoices/logic";
import type { Invoice } from "@/features/invoices/types";
import type { InvoiceFormValues } from "@/features/invoices/schema";
import { getToday } from "@/lib/dates";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { KpiCard } from "@/components/ui/kpi-card";
import { InvoiceFiltersBar } from "@/features/invoices/components/invoice-filters-bar";
import { InvoiceTable } from "@/features/invoices/components/invoice-table";
import { InvoiceDrawer } from "@/features/invoices/components/invoice-drawer";

export default function InvoicesPage() {
  const { t, formatMoney } = useTranslation();
  const { show } = useToast();
  const router = useRouter();
  const { data } = useData();
  const { invoices, createInvoice, createFromQuote, createFromTimeEntries, deleteDraftWithUndo, cancelInvoice } =
    useInvoices();
  const { clients } = useClients();
  const drawer = useDisclosure(false);
  const [filters, setFilters] = useState<InvoiceFilters>({ status: "all" });
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);

  const today = getToday();
  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const filtered = useMemo(
    () => filterInvoices(invoices, data.payments, filters, today),
    [invoices, data.payments, filters, today],
  );
  const kpis = useMemo(() => getInvoiceKpis(invoices, data.payments, today), [invoices, data.payments, today]);

  function handleCreated(invoice: Invoice) {
    show({ message: t("invoices.createdToast", { number: invoice.number }) });
    drawer.close();
    router.push(`/invoices/${invoice.id}`);
  }

  function handleSubmit(values: InvoiceFormValues) {
    handleCreated(createInvoice(values));
  }

  return (
    <div>
      <PageHeader
        title={t("invoices.title")}
        actions={<Button onClick={drawer.open}>{t("invoices.createButton")}</Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("invoices.kpiReceivable")} value={formatMoney(kpis.receivableCents)} />
        <KpiCard label={t("invoices.kpiOverdue")} value={formatMoney(kpis.overdueCents)} />
        <KpiCard label={t("invoices.kpiCollected")} value={formatMoney(kpis.collectedThisMonthCents)} />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" aria-hidden="true" />}
          title={t("invoices.emptyTitle")}
          description={t("invoices.emptyDescription")}
          action={<Button onClick={drawer.open}>{t("invoices.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <InvoiceFiltersBar filters={filters} clients={activeClients} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" aria-hidden="true" />}
              title={t("invoices.emptyFilteredTitle")}
              description={t("invoices.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({ status: "all" })}>
                  {t("invoices.clearFilters")}
                </Button>
              }
            />
          ) : (
            <InvoiceTable invoices={filtered} onDelete={deleteDraftWithUndo} onCancel={setCancelTarget} />
          )}
        </div>
      )}

      <InvoiceDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        clients={activeClients}
        onSubmit={handleSubmit}
        onCreateFromQuote={(quote) => handleCreated(createFromQuote(quote))}
        onCreateFromTime={(projectId, entryIds) => {
          const created = createFromTimeEntries(projectId, entryIds);
          if (created) handleCreated(created);
        }}
      />

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            cancelInvoice(cancelTarget);
            show({ message: t("invoices.cancelledToast") });
          }
        }}
        title={t("invoices.cancelConfirmTitle", { number: cancelTarget?.number ?? "" })}
        description={t("invoices.cancelConfirmBody")}
        confirmLabel={t("invoices.cancelConfirmConfirm")}
        cancelLabel={t("invoices.cancelConfirmCancel")}
        destructive
      />
    </div>
  );
}
