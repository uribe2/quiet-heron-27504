"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useQuotes } from "@/features/quotes/use-quotes";
import { useClients } from "@/features/clients/use-clients";
import { filterQuotes, type QuoteFilters } from "@/features/quotes/logic";
import type { Quote } from "@/features/quotes/types";
import type { QuoteFormValues } from "@/features/quotes/schema";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QuoteFiltersBar } from "@/features/quotes/components/quote-filters-bar";
import { QuoteTable } from "@/features/quotes/components/quote-table";
import { QuoteDrawer } from "@/features/quotes/components/quote-drawer";

export default function QuotesPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const {
    quotes,
    createQuote,
    updateQuote,
    sendQuote,
    markAccepted,
    markRejected,
    revertToDraft,
    duplicateQuote,
    convertToProject,
    isDeletable,
    deleteQuote,
    deleteDraftWithUndo,
  } = useQuotes();
  const { clients } = useClients();
  const drawer = useDisclosure(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>(undefined);
  const [filters, setFilters] = useState<QuoteFilters>({ status: "all" });
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);

  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const filtered = useMemo(() => filterQuotes(quotes, filters), [quotes, filters]);

  function openCreate() {
    setEditingQuote(undefined);
    drawer.open();
  }

  function openQuote(quote: Quote) {
    setEditingQuote(quote);
    drawer.open();
  }

  function handleSubmit(values: QuoteFormValues, intent: "draft" | "send") {
    if (editingQuote) {
      updateQuote(editingQuote.id, values);
      if (intent === "send" && editingQuote.status === "draft") {
        sendQuote(editingQuote);
      }
    } else {
      const created = createQuote(values);
      if (intent === "send") sendQuote(created);
    }
    show({ message: t("quotes.saveSuccess") });
    drawer.close();
  }

  function handleRequestDelete(quote: Quote) {
    if (!isDeletable(quote)) return;
    if (quote.status === "draft") {
      deleteDraftWithUndo(quote);
      drawer.close();
      return;
    }
    setDeleteTarget(quote);
  }

  return (
    <div>
      <PageHeader title={t("quotes.title")} actions={<Button onClick={openCreate}>{t("quotes.createButton")}</Button>} />

      {quotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          title={t("quotes.emptyTitle")}
          description={t("quotes.emptyDescription")}
          action={<Button onClick={openCreate}>{t("quotes.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <QuoteFiltersBar filters={filters} clients={activeClients} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" aria-hidden="true" />}
              title={t("quotes.emptyFilteredTitle")}
              description={t("quotes.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({ status: "all" })}>
                  {t("quotes.clearFilters")}
                </Button>
              }
            />
          ) : (
            <QuoteTable quotes={filtered} onOpen={openQuote} />
          )}
        </div>
      )}

      <QuoteDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        quote={editingQuote}
        clients={activeClients}
        onSubmit={handleSubmit}
        onSend={(q) => {
          sendQuote(q);
          show({ message: t("quotes.sentToast") });
        }}
        onAccept={(q) => {
          markAccepted(q);
          show({ message: t("quotes.acceptedToast") });
        }}
        onReject={(q) => {
          markRejected(q);
          show({ message: t("quotes.rejectedToast") });
        }}
        onRevert={(q) => {
          revertToDraft(q);
          show({ message: t("quotes.revertedToast") });
        }}
        onDuplicate={(q) => {
          const copy = duplicateQuote(q);
          show({ message: t("quotes.duplicatedToast", { number: copy.number }) });
          drawer.close();
        }}
        onConvert={(q) => {
          convertToProject(q);
          show({ message: t("quotes.convertedToast") });
          drawer.close();
        }}
        canDelete={editingQuote ? isDeletable(editingQuote) : false}
        onDeleteRequest={handleRequestDelete}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteQuote(deleteTarget);
          drawer.close();
        }}
        title={t("quotes.deleteConfirmTitle", { number: deleteTarget?.number ?? "" })}
        description={t("quotes.deleteConfirmBody")}
        confirmLabel={t("quotes.deleteConfirmConfirm")}
        cancelLabel={t("quotes.deleteConfirmCancel")}
        destructive
      />
    </div>
  );
}
