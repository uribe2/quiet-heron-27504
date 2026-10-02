"use client";

import { useData } from "@/context/data-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { useTranslation } from "@/context/i18n-context";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import type { Interaction } from "./types";
import type { InteractionFormValues } from "./schema";

function toFields(values: InteractionFormValues) {
  return {
    clientId: values.clientId,
    projectId: values.projectId || undefined,
    channel: values.channel,
    occurredAt: new Date(values.occurredAt).toISOString(),
    summary: values.summary.trim(),
    sentiment: values.sentiment,
    followUpDate: values.followUpDate || undefined,
  };
}

export function useInteractions(filter?: { clientId?: string }) {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  const interactions = filter?.clientId
    ? data.interactions.filter((i) => i.clientId === filter.clientId)
    : data.interactions;

  function createInteraction(values: InteractionFormValues): Interaction {
    const now = getNowISO();
    const fields = toFields(values);
    const interaction: Interaction = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      ...fields,
      followUpDone: false,
    };
    dispatch({ type: "ADD", collection: "interactions", item: interaction });
    return interaction;
  }

  function updateInteraction(id: string, values: InteractionFormValues) {
    const fields = toFields(values);
    const previous = data.interactions.find((i) => i.id === id);
    const dateChanged = previous?.followUpDate !== fields.followUpDate;
    dispatch({
      type: "UPDATE",
      collection: "interactions",
      id,
      patch: { ...fields, ...(dateChanged ? { followUpDone: false } : {}), updatedAt: getNowISO() },
    });
  }

  function restoreInteraction(interaction: Interaction, index: number) {
    dispatch({ type: "RESTORE", collection: "interactions", item: interaction, index });
  }

  function deleteInteraction(interaction: Interaction) {
    const index = data.interactions.findIndex((i) => i.id === interaction.id);
    deleteWithUndo({
      item: interaction,
      message: t("interactions.deletedToast"),
      onDelete: (i) => dispatch({ type: "REMOVE", collection: "interactions", id: i.id }),
      onRestore: (i) => restoreInteraction(i, index < 0 ? data.interactions.length : index),
    });
  }

  function completeFollowUp(id: string) {
    dispatch({ type: "UPDATE", collection: "interactions", id, patch: { followUpDone: true, updatedAt: getNowISO() } });
  }

  function rescheduleFollowUp(id: string, date: string) {
    dispatch({
      type: "UPDATE",
      collection: "interactions",
      id,
      patch: { followUpDate: date, followUpDone: false, updatedAt: getNowISO() },
    });
  }

  return {
    interactions,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    restoreInteraction,
    completeFollowUp,
    rescheduleFollowUp,
  };
}
