"use client";

import { useData } from "@/context/data-context";
import { useToast } from "@/context/toast-context";
import { useTranslation } from "@/context/i18n-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import { centsFromAmount } from "@/lib/format";
import type { Opportunity, OpportunityStage, LostReason } from "./types";
import type { OpportunityFormValues } from "./schema";
import { moveToStage, nextPosition, stageLabelKey } from "./logic";

function toFields(values: OpportunityFormValues) {
  return {
    clientId: values.clientId,
    title: values.title.trim(),
    estimatedValueCents: centsFromAmount(values.value),
    expectedCloseDate: values.expectedCloseDate || undefined,
    notes: values.notes || undefined,
  };
}

export function usePipeline() {
  const { data, dispatch } = useData();
  const { show } = useToast();
  const { t } = useTranslation();
  const { deleteWithUndo } = useUndoableDelete();
  const opportunities = data.opportunities;

  function createOpportunity(values: OpportunityFormValues): Opportunity {
    const now = getNowISO();
    const opportunity: Opportunity = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      status: "open",
      position: nextPosition(opportunities, values.stage),
      stage: values.stage,
      ...toFields(values),
    };
    dispatch({ type: "ADD", collection: "opportunities", item: opportunity });
    return opportunity;
  }

  function updateOpportunity(id: string, values: OpportunityFormValues) {
    const current = opportunities.find((o) => o.id === id);
    if (!current) return;
    const placement = current.stage === values.stage ? {} : moveToStage(opportunities, id, values.stage);
    dispatch({ type: "UPDATE", collection: "opportunities", id, patch: { ...toFields(values), ...placement } });
  }

  function moveOpportunity(opportunity: Opportunity, stage: OpportunityStage) {
    if (opportunity.stage === stage) return;
    const previous = { stage: opportunity.stage, position: opportunity.position };
    dispatch({
      type: "UPDATE",
      collection: "opportunities",
      id: opportunity.id,
      patch: moveToStage(opportunities, opportunity.id, stage),
    });
    show({
      message: t("pipeline.movedToast", { title: opportunity.title, stage: t(stageLabelKey(stage)) }),
      actionLabel: t("common.undo"),
      onAction: () => dispatch({ type: "UPDATE", collection: "opportunities", id: opportunity.id, patch: previous }),
    });
  }

  function markWon(opportunity: Opportunity) {
    dispatch({
      type: "UPDATE",
      collection: "opportunities",
      id: opportunity.id,
      patch: { status: "won", lostReason: undefined },
    });
    show({ message: t("pipeline.wonToast", { title: opportunity.title }) });
  }

  function markLost(opportunity: Opportunity, reason: LostReason) {
    dispatch({
      type: "UPDATE",
      collection: "opportunities",
      id: opportunity.id,
      patch: { status: "lost", lostReason: reason },
    });
    show({ message: t("pipeline.lostToast", { title: opportunity.title }) });
  }

  /** Reopens a closed opportunity; its stage was kept when closing. */
  function reopen(opportunity: Opportunity) {
    dispatch({
      type: "UPDATE",
      collection: "opportunities",
      id: opportunity.id,
      patch: {
        status: "open",
        lostReason: undefined,
        position: nextPosition(opportunities, opportunity.stage, opportunity.id),
      },
    });
    show({ message: t("pipeline.reopenedToast", { title: opportunity.title }) });
  }

  function deleteOpportunity(opportunity: Opportunity) {
    const index = opportunities.findIndex((o) => o.id === opportunity.id);
    deleteWithUndo({
      item: opportunity,
      message: t("pipeline.deletedToast", { title: opportunity.title }),
      onDelete: (o) => dispatch({ type: "REMOVE", collection: "opportunities", id: o.id }),
      onRestore: (o) => dispatch({ type: "RESTORE", collection: "opportunities", item: o, index }),
    });
  }

  return {
    opportunities,
    createOpportunity,
    updateOpportunity,
    moveOpportunity,
    markWon,
    markLost,
    reopen,
    deleteOpportunity,
  };
}
