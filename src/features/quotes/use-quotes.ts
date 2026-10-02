"use client";

import { useData } from "@/context/data-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { useTranslation } from "@/context/i18n-context";
import { useProjects } from "@/features/projects/use-projects";
import { generateId } from "@/lib/ids";
import { getNowISO, getToday, addDays } from "@/lib/dates";
import { calculateTotals } from "@/lib/money";
import type { Quote } from "./types";
import type { Opportunity } from "@/features/pipeline/types";
import type { Project } from "@/features/projects/types";
import type { ProjectFormValues } from "@/features/projects/schema";
import type { QuoteFormValues } from "./schema";
import { nextQuoteNumber, appendHistory, canDeleteQuote } from "./logic";

function toQuoteFields(values: QuoteFormValues) {
  return {
    clientId: values.clientId,
    opportunityId: values.opportunityId,
    title: values.title.trim(),
    items: values.items,
    taxRate: values.taxRate,
    paymentTerms: values.paymentTerms,
    validUntil: values.validUntil,
    scope: values.scope || undefined,
  };
}

function toProjectInput(quote: Quote): ProjectFormValues {
  const { totalCents } = calculateTotals(quote.items, quote.taxRate);
  const startDate = getToday();
  return {
    clientId: quote.clientId,
    name: quote.title,
    description: quote.scope,
    billingType: "fixed",
    budgetCents: totalCents,
    startDate,
    dueDate: addDays(startDate, 30),
  };
}

export function useQuotes() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();
  const { createProject } = useProjects();

  function createQuote(values: QuoteFormValues): Quote {
    const now = getNowISO();
    const quote: Quote = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      number: nextQuoteNumber(data.quotes, getToday().slice(0, 4)),
      status: "draft",
      history: appendHistory([], "created", now),
      ...toQuoteFields(values),
    };
    dispatch({ type: "ADD", collection: "quotes", item: quote });
    if (quote.opportunityId) {
      dispatch({
        type: "UPDATE",
        collection: "opportunities",
        id: quote.opportunityId,
        patch: { quoteId: quote.id, stage: "quote" },
      });
    }
    return quote;
  }

  function createQuoteFromOpportunity(opportunity: Opportunity, values: QuoteFormValues): Quote {
    return createQuote({ ...values, clientId: opportunity.clientId, opportunityId: opportunity.id });
  }

  function updateQuote(id: string, values: QuoteFormValues) {
    const quote = data.quotes.find((q) => q.id === id);
    if (!quote) return;
    dispatch({
      type: "UPDATE",
      collection: "quotes",
      id,
      patch: { ...toQuoteFields(values), history: appendHistory(quote.history, "updated", getNowISO()) },
    });
  }

  function sendQuote(quote: Quote) {
    dispatch({
      type: "UPDATE",
      collection: "quotes",
      id: quote.id,
      patch: { status: "sent", history: appendHistory(quote.history, "sent", getNowISO()) },
    });
  }

  function markAccepted(quote: Quote) {
    dispatch({
      type: "UPDATE",
      collection: "quotes",
      id: quote.id,
      patch: { status: "accepted", history: appendHistory(quote.history, "accepted", getNowISO()) },
    });
  }

  function markRejected(quote: Quote) {
    dispatch({
      type: "UPDATE",
      collection: "quotes",
      id: quote.id,
      patch: { status: "rejected", history: appendHistory(quote.history, "rejected", getNowISO()) },
    });
  }

  function revertToDraft(quote: Quote) {
    dispatch({
      type: "UPDATE",
      collection: "quotes",
      id: quote.id,
      patch: { status: "draft", history: appendHistory(quote.history, "reverted_to_draft", getNowISO()) },
    });
  }

  function duplicateQuote(quote: Quote): Quote {
    const now = getNowISO();
    const duplicate: Quote = {
      ...quote,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      number: nextQuoteNumber(data.quotes, getToday().slice(0, 4)),
      status: "draft",
      opportunityId: undefined,
      projectId: undefined,
      items: quote.items.map((item) => ({ ...item, id: generateId() })),
      history: appendHistory([], "duplicated", now, quote.number),
    };
    dispatch({ type: "ADD", collection: "quotes", item: duplicate });
    return duplicate;
  }

  function convertToProject(quote: Quote): Project {
    const project = createProject(toProjectInput(quote));
    dispatch({
      type: "UPDATE",
      collection: "quotes",
      id: quote.id,
      patch: { projectId: project.id, history: appendHistory(quote.history, "converted", getNowISO()) },
    });
    if (quote.opportunityId) {
      dispatch({
        type: "UPDATE",
        collection: "opportunities",
        id: quote.opportunityId,
        patch: { stage: "project", projectId: project.id },
      });
    }
    return project;
  }

  function isDeletable(quote: Quote): boolean {
    return canDeleteQuote(quote);
  }

  function deleteQuote(quote: Quote) {
    dispatch({ type: "REMOVE", collection: "quotes", id: quote.id });
  }

  function deleteDraftWithUndo(quote: Quote) {
    deleteWithUndo({
      item: quote,
      message: t("quotes.deletedToast", { number: quote.number }),
      onDelete: (q) => dispatch({ type: "REMOVE", collection: "quotes", id: q.id }),
      onRestore: (q) => dispatch({ type: "ADD", collection: "quotes", item: q }),
    });
  }

  return {
    quotes: data.quotes,
    createQuote,
    createQuoteFromOpportunity,
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
  };
}

export function useQuote(id: string): Quote | undefined {
  const { data } = useData();
  return data.quotes.find((q) => q.id === id);
}
