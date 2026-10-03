"use client";

import { useMemo, useState } from "react";
import { KanbanSquare } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useClients } from "@/features/clients/use-clients";
import { useQuotes } from "@/features/quotes/use-quotes";
import { usePipeline } from "@/features/pipeline/use-pipeline";
import { getColumns } from "@/features/pipeline/logic";
import type { Opportunity } from "@/features/pipeline/types";
import type { OpportunityFormValues } from "@/features/pipeline/schema";
import type { QuoteFormValues } from "@/features/quotes/schema";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { OpportunityDrawer } from "@/features/pipeline/components/opportunity-drawer";
import { LostReasonDialog } from "@/features/pipeline/components/lost-reason-dialog";
import { QuoteDrawer } from "@/features/quotes/components/quote-drawer";

export default function PipelinePage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const { clients } = useClients();
  const { createQuoteFromOpportunity, sendQuote } = useQuotes();
  const pipeline = usePipeline();
  const drawer = useDisclosure(false);
  const quoteDrawer = useDisclosure(false);
  const [editing, setEditing] = useState<Opportunity | undefined>(undefined);
  const [quoteFor, setQuoteFor] = useState<Opportunity | undefined>(undefined);
  const [losing, setLosing] = useState<Opportunity | undefined>(undefined);
  const [clientId, setClientId] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const clientNames = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);
  const columns = useMemo(
    () => getColumns(pipeline.opportunities, { clientId: clientId || undefined, showClosed }),
    [pipeline.opportunities, clientId, showClosed],
  );
  const visibleCount = Object.values(columns).reduce((sum, col) => sum + col.length, 0);
  const hasFilters = Boolean(clientId) || showClosed;

  function openCreate() {
    setEditing(undefined);
    drawer.open();
  }

  function openEdit(opportunity: Opportunity) {
    setEditing(opportunity);
    drawer.open();
  }

  function handleSubmit(values: OpportunityFormValues) {
    if (editing) {
      pipeline.updateOpportunity(editing.id, values);
    } else {
      pipeline.createOpportunity(values);
    }
    show({ message: t("pipeline.saveSuccess") });
    drawer.close();
  }

  function openQuote(opportunity: Opportunity) {
    setQuoteFor(opportunity);
    quoteDrawer.open();
  }

  function handleQuoteSubmit(values: QuoteFormValues, intent: "draft" | "send") {
    const target = quoteFor;
    if (!target) return;
    const quote = createQuoteFromOpportunity(target, values);
    if (intent === "send") sendQuote(quote);
    show({ message: t("pipeline.quoteSaveSuccess") });
    quoteDrawer.close();
  }

  return (
    <div>
      <PageHeader title={t("pipeline.title")} description={t("pipeline.subtitle")} actions={<Button onClick={openCreate}>{t("pipeline.createButton")}</Button>} />

      {pipeline.opportunities.length === 0 ? (
        <EmptyState
          icon={<KanbanSquare className="h-8 w-8" aria-hidden="true" />}
          title={t("pipeline.emptyTitle")}
          description={t("pipeline.emptyDescription")}
          action={<Button onClick={openCreate}>{t("pipeline.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pipeline-client-filter" className="label-eyebrow">
                {t("pipeline.filterClientLabel")}
              </label>
              <Select
                id="pipeline-client-filter"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full sm:w-56"
              >
                <option value="">{t("pipeline.filterClientAll")}</option>
                {activeClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <Checkbox
              label={t("pipeline.showClosed")}
              checked={showClosed}
              onChange={(e) => setShowClosed(e.target.checked)}
            />
          </div>
          {visibleCount === 0 && hasFilters ? (
            <EmptyState
              icon={<KanbanSquare className="h-8 w-8" aria-hidden="true" />}
              title={t("pipeline.emptyFilteredTitle")}
              description={t("pipeline.emptyFilteredDescription")}
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setClientId("");
                    setShowClosed(false);
                  }}
                >
                  {t("pipeline.clearFilters")}
                </Button>
              }
            />
          ) : (
            <PipelineBoard
              columns={columns}
              clientNames={clientNames}
              onMove={pipeline.moveOpportunity}
              onEdit={openEdit}
              onCreateQuote={openQuote}
              onWon={pipeline.markWon}
              onLost={setLosing}
              onReopen={pipeline.reopen}
              onDelete={pipeline.deleteOpportunity}
            />
          )}
        </div>
      )}

      <OpportunityDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        opportunity={editing}
        clients={activeClients}
        onSubmit={handleSubmit}
      />
      <QuoteDrawer
        isOpen={quoteDrawer.isOpen}
        onClose={quoteDrawer.close}
        clients={activeClients}
        initialValues={quoteFor ? { clientId: quoteFor.clientId, title: quoteFor.title } : undefined}
        onSubmit={handleQuoteSubmit}
      />
      <LostReasonDialog
        isOpen={Boolean(losing)}
        onClose={() => setLosing(undefined)}
        onConfirm={(reason) => {
          if (losing) pipeline.markLost(losing, reason);
        }}
      />
    </div>
  );
}
