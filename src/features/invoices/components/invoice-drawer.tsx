"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { calculateTotals } from "@/lib/money";
import { dateOnly } from "@/lib/dates";
import type { Client } from "@/features/clients/types";
import type { Quote } from "@/features/quotes/types";
import { InvoiceForm } from "./invoice-form";
import type { Invoice } from "../types";
import type { InvoiceFormValues } from "../schema";
import { getUnbilledEntries, hoursFromMinutes } from "../logic";

type Mode = "manual" | "quote" | "time";

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  /** When set, the drawer edits this draft invoice (manual form only). */
  invoice?: Invoice;
  onSubmit: (values: InvoiceFormValues) => void;
  onCreateFromQuote?: (quote: Quote) => void;
  onCreateFromTime?: (projectId: string, entryIds: string[]) => void;
}

export function InvoiceDrawer({
  isOpen,
  onClose,
  clients,
  invoice,
  onSubmit,
  onCreateFromQuote,
  onCreateFromTime,
}: InvoiceDrawerProps) {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [mode, setMode] = useState<Mode>("manual");

  function requestClose() {
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  const showModes = !invoice && Boolean(onCreateFromQuote || onCreateFromTime);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={invoice ? t("invoices.drawerEditTitle", { number: invoice.number }) : t("invoices.drawerCreateTitle")}
        closeLabel={t("invoices.closeDrawer")}
        breadcrumbs={[{ label: t("invoices.title"), href: "/invoices" }]}
      >
        {isOpen ? (
          <div className="flex flex-col gap-4">
            {showModes ? (
              <Tabs
                value={mode}
                onChange={(v) => {
                  setMode(v as Mode);
                  setIsDirty(false);
                }}
                items={[
                  { value: "manual", label: t("invoices.modeManual") },
                  { value: "quote", label: t("invoices.modeQuote") },
                  { value: "time", label: t("invoices.modeTime") },
                ]}
              />
            ) : null}
            {mode === "manual" || !showModes ? (
              <InvoiceForm invoice={invoice} clients={clients} onSubmit={onSubmit} onDirtyChange={setIsDirty} />
            ) : null}
            {showModes && mode === "quote" && onCreateFromQuote ? (
              <QuoteSource onCreate={onCreateFromQuote} />
            ) : null}
            {showModes && mode === "time" && onCreateFromTime ? (
              <TimeSource onCreate={onCreateFromTime} />
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

function QuoteSource({ onCreate }: { onCreate: (quote: Quote) => void }) {
  const { t, formatMoney } = useTranslation();
  const { data } = useData();
  const [quoteId, setQuoteId] = useState("");
  const accepted = data.quotes.filter((q) => q.status === "accepted");
  const selected = accepted.find((q) => q.id === quoteId);

  if (accepted.length === 0) {
    return <p className="text-sm text-text-muted">{t("invoices.quoteSourceEmpty")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <FormField label={t("invoices.quoteSourceLabel")} hint={t("invoices.quoteSourceHint")}>
        <Select value={quoteId} onChange={(e) => setQuoteId(e.target.value)}>
          <option value="">{t("invoices.quoteSourceNone")}</option>
          {accepted.map((q) => (
            <option key={q.id} value={q.id}>
              {q.number} — {q.title} ({formatMoney(calculateTotals(q.items, q.taxRate).totalCents)})
            </option>
          ))}
        </Select>
      </FormField>
      <div className="flex justify-end">
        <Button disabled={!selected} onClick={() => selected && onCreate(selected)}>
          {t("invoices.createFromQuoteAction")}
        </Button>
      </div>
    </div>
  );
}

function TimeSource({ onCreate }: { onCreate: (projectId: string, entryIds: string[]) => void }) {
  const { t, formatMoney, formatDate } = useTranslation();
  const { data } = useData();
  const [projectId, setProjectId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const hourlyProjects = data.projects.filter((p) => p.billingType === "hourly");
  const project = hourlyProjects.find((p) => p.id === projectId);
  const entries = project ? getUnbilledEntries(data.timeEntries, project.id) : [];
  const rate = project?.hourlyRateCents ?? data.settings.defaultHourlyRateCents;
  const allSelected = entries.length > 0 && selectedIds.length === entries.length;

  function toggle(id: string, checked: boolean) {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  }

  return (
    <div className="flex flex-col gap-4">
      {hourlyProjects.length === 0 ? <p className="text-sm text-text-muted">{t("invoices.timeProjectEmpty")}</p> : null}
      <FormField label={t("invoices.timeProjectLabel")}>
        <Select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setSelectedIds([]);
          }}
        >
          <option value="">{t("invoices.timeProjectNone")}</option>
          {hourlyProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </FormField>

      {project ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-text">{t("invoices.timeEntriesTitle")}</legend>
          {entries.length === 0 ? (
            <p className="text-sm text-text-muted">{t("invoices.timeEntriesEmpty")}</p>
          ) : (
            <>
              <Checkbox
                label={t("invoices.selectAllEntries")}
                checked={allSelected}
                onChange={(e) => setSelectedIds(e.target.checked ? entries.map((x) => x.id) : [])}
              />
              {entries.map((entry) => {
                const hours = hoursFromMinutes(entry.durationMinutes);
                return (
                  <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <Checkbox
                      id={`entry-${entry.id}`}
                      label={t("invoices.entryLabel", {
                        description: entry.description,
                        hours: String(hours),
                        date: formatDate(dateOnly(entry.startedAt)),
                      })}
                      checked={selectedIds.includes(entry.id)}
                      onChange={(e) => toggle(entry.id, e.target.checked)}
                    />
                    <span className="text-sm text-text-muted">{formatMoney(Math.round(hours * rate))}</span>
                  </div>
                );
              })}
            </>
          )}
        </fieldset>
      ) : null}

      <div className="flex justify-end">
        <Button disabled={!project || selectedIds.length === 0} onClick={() => project && onCreate(project.id, selectedIds)}>
          {t("invoices.createFromTimeAction")}
        </Button>
      </div>
    </div>
  );
}
