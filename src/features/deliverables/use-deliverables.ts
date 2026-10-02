"use client";

import { useData } from "@/context/data-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { useTranslation } from "@/context/i18n-context";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import type { Deliverable, DeliverableStatus } from "./types";
import type { DeliverableFormValues } from "./schema";
import { getSwapTarget, nextOrder } from "./logic";

function toFields(values: DeliverableFormValues) {
  return {
    title: values.title.trim(),
    dueDate: values.dueDate,
    description: values.description?.trim() || undefined,
    externalUrl: values.externalUrl?.trim() || undefined,
  };
}

export function useDeliverables() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  function createDeliverable(values: DeliverableFormValues): Deliverable {
    const now = getNowISO();
    const deliverable: Deliverable = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      projectId: values.projectId,
      status: "pending",
      order: nextOrder(data.deliverables, values.projectId),
      ...toFields(values),
    };
    dispatch({ type: "ADD", collection: "deliverables", item: deliverable });
    return deliverable;
  }

  function updateDeliverable(id: string, values: DeliverableFormValues) {
    const existing = data.deliverables.find((d) => d.id === id);
    const patch: Partial<Deliverable> = { ...toFields(values), projectId: values.projectId };
    if (existing && existing.projectId !== values.projectId) {
      patch.order = nextOrder(data.deliverables, values.projectId);
    }
    dispatch({ type: "UPDATE", collection: "deliverables", id, patch });
  }

  function setStatus(deliverable: Deliverable, status: DeliverableStatus) {
    const patch: Partial<Deliverable> = {
      status,
      deliveredAt: status === "delivered" ? getNowISO() : undefined,
    };
    dispatch({ type: "UPDATE", collection: "deliverables", id: deliverable.id, patch });
  }

  function move(deliverable: Deliverable, direction: "up" | "down") {
    const target = getSwapTarget(data.deliverables, deliverable, direction);
    if (!target) return;
    dispatch({ type: "UPDATE", collection: "deliverables", id: deliverable.id, patch: { order: target.order } });
    dispatch({ type: "UPDATE", collection: "deliverables", id: target.id, patch: { order: deliverable.order } });
  }

  function deleteDeliverable(deliverable: Deliverable) {
    const index = data.deliverables.findIndex((d) => d.id === deliverable.id);
    const linked = data.timeEntries.filter((e) => e.deliverableId === deliverable.id).map((e) => e.id);
    deleteWithUndo({
      item: deliverable,
      message: t("deliverables.deletedToast"),
      onDelete: (d) => {
        dispatch({ type: "REMOVE", collection: "deliverables", id: d.id });
        for (const id of linked) {
          dispatch({ type: "UPDATE", collection: "timeEntries", id, patch: { deliverableId: undefined } });
        }
      },
      onRestore: (d) => {
        dispatch({ type: "RESTORE", collection: "deliverables", item: d, index: Math.max(index, 0) });
        for (const id of linked) {
          dispatch({ type: "UPDATE", collection: "timeEntries", id, patch: { deliverableId: d.id } });
        }
      },
    });
  }

  return {
    deliverables: data.deliverables,
    createDeliverable,
    updateDeliverable,
    setStatus,
    moveUp: (d: Deliverable) => move(d, "up"),
    moveDown: (d: Deliverable) => move(d, "down"),
    deleteDeliverable,
  };
}
