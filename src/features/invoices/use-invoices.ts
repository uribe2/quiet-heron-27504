"use client";

import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { generateId } from "@/lib/ids";
import { addDays, getNowISO, getToday } from "@/lib/dates";
import type { LineItem } from "@/lib/types";
import type { Quote } from "@/features/quotes/types";
import type { Invoice } from "./types";
import type { InvoiceFormValues } from "./schema";
import { getInvoiceFinancials, getTimeEntryIds, hoursFromMinutes, nextInvoiceNumber } from "./logic";

function toInvoiceFields(values: InvoiceFormValues) {
  return {
    clientId: values.clientId,
    projectId: values.projectId || undefined,
    quoteId: values.quoteId || undefined,
    issueDate: values.issueDate,
    dueDate: values.dueDate,
    items: values.items,
    taxRate: values.taxRate,
    notes: values.notes?.trim() || undefined,
  };
}

export function useInvoices() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  function defaultDueDate(issueDate: string): string {
    return addDays(issueDate, data.settings.defaultPaymentTermsDays);
  }

  function setTimeEntriesInvoice(entryIds: string[], invoiceId: string | undefined) {
    for (const id of entryIds) {
      dispatch({ type: "UPDATE", collection: "timeEntries", id, patch: { invoiceId } });
    }
  }

  function buildInvoice(values: InvoiceFormValues): Invoice {
    const now = getNowISO();
    return {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      number: nextInvoiceNumber(data.invoices),
      status: "draft",
      ...toInvoiceFields(values),
    };
  }

  function createInvoice(values: InvoiceFormValues): Invoice {
    const invoice = buildInvoice(values);
    dispatch({ type: "ADD", collection: "invoices", item: invoice });
    setTimeEntriesInvoice(getTimeEntryIds(invoice), invoice.id);
    return invoice;
  }

  /** Flow 3: accepted quote -> invoice (copies items). */
  function createFromQuote(quote: Quote): Invoice {
    const issueDate = getToday();
    const invoice = buildInvoice({
      clientId: quote.clientId,
      projectId: quote.projectId,
      quoteId: quote.id,
      issueDate,
      dueDate: defaultDueDate(issueDate),
      items: quote.items.map((item) => ({ ...item, id: generateId() })),
      taxRate: quote.taxRate,
    });
    dispatch({ type: "ADD", collection: "invoices", item: invoice });
    return invoice;
  }

  /** Flow 4: unbilled billable time entries of a project -> invoice (one line per entry). */
  function createFromTimeEntries(projectId: string, entryIds: string[]): Invoice | undefined {
    const project = data.projects.find((p) => p.id === projectId);
    if (!project) return undefined;
    const entries = data.timeEntries.filter(
      (e) => entryIds.includes(e.id) && e.projectId === projectId && e.billable && !e.invoiceId,
    );
    if (entries.length === 0) return undefined;
    const rate = project.hourlyRateCents ?? data.settings.defaultHourlyRateCents;
    const items: LineItem[] = entries.map((e) => ({
      id: generateId(),
      description: e.description,
      quantity: hoursFromMinutes(e.durationMinutes),
      unitPriceCents: rate,
      timeEntryIds: [e.id],
    }));
    const issueDate = getToday();
    return createInvoice({
      clientId: project.clientId,
      projectId,
      issueDate,
      dueDate: defaultDueDate(issueDate),
      items,
      taxRate: data.settings.defaultTaxRate,
    });
  }

  /** Draft: full edit. Time entries removed from the items are released. */
  function updateDraft(id: string, values: InvoiceFormValues) {
    const invoice = data.invoices.find((i) => i.id === id);
    if (!invoice || invoice.status !== "draft") return;
    const nextIds = values.items.flatMap((i) => i.timeEntryIds ?? []);
    setTimeEntriesInvoice(
      getTimeEntryIds(invoice).filter((e) => !nextIds.includes(e)),
      undefined,
    );
    dispatch({
      type: "UPDATE",
      collection: "invoices",
      id,
      patch: { ...toInvoiceFields(values), updatedAt: getNowISO() },
    });
  }

  /** Sent (or draft): only notes and due date. */
  function updateNotesAndDue(id: string, values: { notes?: string; dueDate: string }) {
    const invoice = data.invoices.find((i) => i.id === id);
    if (!invoice || (invoice.status !== "draft" && invoice.status !== "sent")) return;
    if (values.dueDate < invoice.issueDate) return;
    dispatch({
      type: "UPDATE",
      collection: "invoices",
      id,
      patch: { dueDate: values.dueDate, notes: values.notes?.trim() || undefined, updatedAt: getNowISO() },
    });
  }

  function markSent(invoice: Invoice) {
    if (invoice.status !== "draft") return;
    dispatch({ type: "UPDATE", collection: "invoices", id: invoice.id, patch: { status: "sent", updatedAt: getNowISO() } });
  }

  function cancelInvoice(invoice: Invoice) {
    if (invoice.status !== "sent") return;
    setTimeEntriesInvoice(getTimeEntryIds(invoice), undefined);
    dispatch({ type: "UPDATE", collection: "invoices", id: invoice.id, patch: { status: "cancelled", updatedAt: getNowISO() } });
  }

  /** Drafts only: removes the invoice, releases entries; undo restores both. */
  function deleteDraftWithUndo(invoice: Invoice): boolean {
    if (invoice.status !== "draft") return false;
    const index = data.invoices.findIndex((i) => i.id === invoice.id);
    const entryIds = getTimeEntryIds(invoice);
    deleteWithUndo({
      item: invoice,
      message: t("invoices.deletedToast", { number: invoice.number }),
      onDelete: (inv) => {
        dispatch({ type: "REMOVE", collection: "invoices", id: inv.id });
        setTimeEntriesInvoice(entryIds, undefined);
      },
      onRestore: (inv) => {
        dispatch({ type: "RESTORE", collection: "invoices", item: inv, index });
        setTimeEntriesInvoice(entryIds, inv.id);
      },
    });
    return true;
  }

  function getFinancials(invoice: Invoice) {
    return getInvoiceFinancials(invoice, data.payments, getToday());
  }

  return {
    invoices: data.invoices,
    defaultDueDate,
    createInvoice,
    createFromQuote,
    createFromTimeEntries,
    updateDraft,
    updateNotesAndDue,
    markSent,
    cancelInvoice,
    deleteDraftWithUndo,
    getFinancials,
  };
}

export function useInvoice(id: string): Invoice | undefined {
  const { data } = useData();
  return data.invoices.find((i) => i.id === id);
}
