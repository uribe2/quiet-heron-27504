"use client";

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/context/i18n-context";
import { QuoteForm } from "./quote-form";
import type { Quote } from "../types";
import type { QuoteFormValues } from "../schema";
import type { Client } from "@/features/clients/types";
import { isQuoteLocked } from "../logic";

const linkClass = "text-link underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
const statusTone = { draft: "neutral", sent: "accent", accepted: "success", rejected: "danger" } as const;

interface QuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quote?: Quote;
  initialValues?: Partial<QuoteFormValues>;
  clients: Client[];
  onSubmit: (values: QuoteFormValues, intent: "draft" | "send") => void;
  onSend?: (quote: Quote) => void;
  onAccept?: (quote: Quote) => void;
  onReject?: (quote: Quote) => void;
  onRevert?: (quote: Quote) => void;
  onDuplicate?: (quote: Quote) => void;
  onConvert?: (quote: Quote) => void;
  onCreateInvoice?: (quote: Quote) => void;
  /** Invoice number + id already created from this quote (hides "Crear factura"). */
  linkedInvoice?: { id: string; number: string };
  canDelete?: boolean;
  onDeleteRequest?: (quote: Quote) => void;
}

export function QuoteDrawer({
  isOpen,
  onClose,
  quote,
  initialValues,
  clients,
  onSubmit,
  onSend,
  onAccept,
  onReject,
  onRevert,
  onDuplicate,
  onConvert,
  onCreateInvoice,
  linkedInvoice,
  canDelete = false,
  onDeleteRequest,
}: QuoteDrawerProps) {
  const { t, formatDate } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  function requestClose() {
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  const locked = quote ? isQuoteLocked(quote) : false;

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={quote ? quote.number : t("quotes.drawerCreateTitle")}
        closeLabel={t("quotes.closeDrawer")}
        breadcrumbs={[{ label: t("quotes.title"), href: "/quotes" }]}
      >
        {isOpen ? (
          <div className="flex flex-col gap-4">
            {quote ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <StatusBadge label={t(`quotes.status${capitalize(quote.status)}`)} tone={statusTone[quote.status]} />
                <div className="flex flex-wrap gap-2">
                  {quote.status === "draft" && onSend ? (
                    <Button variant="secondary" onClick={() => onSend(quote)}>
                      {t("quotes.sendAction")}
                    </Button>
                  ) : null}
                  {quote.status === "sent" && onAccept ? (
                    <Button variant="secondary" onClick={() => onAccept(quote)}>
                      {t("quotes.acceptAction")}
                    </Button>
                  ) : null}
                  {quote.status === "sent" && onReject ? (
                    <Button variant="secondary" onClick={() => onReject(quote)}>
                      {t("quotes.rejectAction")}
                    </Button>
                  ) : null}
                  {quote.status === "sent" && onRevert ? (
                    <Button variant="secondary" onClick={() => onRevert(quote)}>
                      {t("quotes.revertAction")}
                    </Button>
                  ) : null}
                  {quote.status === "accepted" && !quote.projectId && onConvert ? (
                    <Button variant="secondary" onClick={() => onConvert(quote)}>
                      {t("quotes.convertAction")}
                    </Button>
                  ) : null}
                  {quote.status === "accepted" && !linkedInvoice && onCreateInvoice ? (
                    <Button variant="secondary" onClick={() => onCreateInvoice(quote)}>
                      {t("quotes.createInvoiceAction")}
                    </Button>
                  ) : null}
                  {onDuplicate ? (
                    <Button variant="secondary" onClick={() => onDuplicate(quote)}>
                      {t("quotes.duplicateAction")}
                    </Button>
                  ) : null}
                  {canDelete && onDeleteRequest ? (
                    <Button variant="destructive" onClick={() => onDeleteRequest(quote)}>
                      {t("quotes.deleteAction")}
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {quote && (quote.projectId || linkedInvoice) ? (
              <div className="flex flex-wrap gap-4 text-sm">
                {quote.projectId ? (
                  <Link href={`/projects/${quote.projectId}`} className={linkClass}>
                    {t("quotes.viewProjectLink")}
                  </Link>
                ) : null}
                {linkedInvoice ? (
                  <Link href={`/invoices/${linkedInvoice.id}`} className={linkClass}>
                    {t("quotes.viewInvoiceLink", { number: linkedInvoice.number })}
                  </Link>
                ) : null}
              </div>
            ) : null}

            {locked ? <p className="text-xs text-text-muted">{t("quotes.lockedNotice")}</p> : null}

            <QuoteForm quote={quote} clients={clients} readOnly={locked} initialValues={initialValues} onSubmit={onSubmit} onDirtyChange={setIsDirty} />

            {quote && quote.history.length > 0 ? (
              <div className="border-t border-border pt-4">
                <p className="mb-2 text-sm font-medium text-text">{t("quotes.historyTitle")}</p>
                <ul className="flex flex-col gap-1 text-xs text-text-muted">
                  {quote.history
                    .slice()
                    .reverse()
                    .map((entry, index) => (
                      <li key={index}>
                        {formatDate(entry.at, { day: "2-digit", month: "short", year: "numeric" })} —{" "}
                        {t(`quotes.history${capitalize(entry.action)}`)}
                        {entry.note ? ` (${entry.note})` : ""}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
      <ConfirmDialog
        isOpen={confirmingClose}
        onClose={() => setConfirmingClose(false)}
        onConfirm={onClose}
        title={t("clients.discardConfirmTitle")}
        description={t("clients.discardConfirmBody")}
        confirmLabel={t("clients.discardConfirmConfirm")}
        cancelLabel={t("clients.discardConfirmCancel")}
        destructive
      />
    </>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
