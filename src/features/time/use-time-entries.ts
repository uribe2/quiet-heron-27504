"use client";

import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { getNowISO } from "@/lib/dates";
import { generateId } from "@/lib/ids";
import type { TimeEntry } from "./types";
import type { TimeEntryFormValues } from "./schema";
import { combineDateTime, durationMinutes, MAX_ENTRY_MINUTES } from "./logic";

function toEntryFields(values: TimeEntryFormValues) {
  const startedAt = combineDateTime(values.date, values.startTime);
  const endedAt = combineDateTime(values.date, values.endTime);
  return {
    projectId: values.projectId,
    deliverableId: values.deliverableId || undefined,
    description: values.description.trim(),
    startedAt,
    endedAt,
    durationMinutes: durationMinutes(startedAt, endedAt),
    billable: values.billable,
  };
}

export function useTimeEntries() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  const runningTimer = data.runningTimer;

  /** Starts a timer. Returns false when one is already running. */
  function startTimer(projectId: string, description: string, deliverableId?: string): boolean {
    if (data.runningTimer) return false;
    dispatch({
      type: "SET_RUNNING_TIMER",
      timer: {
        projectId,
        deliverableId: deliverableId || undefined,
        description: description.trim(),
        startedAt: getNowISO(),
      },
    });
    return true;
  }

  /** Stops the timer and saves a TimeEntry (minimum 1 minute). */
  function stopTimer(): TimeEntry | null {
    const timer = data.runningTimer;
    if (!timer) return null;
    const endedAt = getNowISO();
    const minutes = Math.min(MAX_ENTRY_MINUTES, Math.max(1, durationMinutes(timer.startedAt, endedAt)));
    const entry: TimeEntry = {
      id: generateId(),
      createdAt: endedAt,
      updatedAt: endedAt,
      projectId: timer.projectId,
      deliverableId: timer.deliverableId,
      description: timer.description || t("time.defaultDescription"),
      startedAt: timer.startedAt,
      endedAt,
      durationMinutes: minutes,
      billable: true,
    };
    dispatch({ type: "ADD", collection: "timeEntries", item: entry });
    dispatch({ type: "SET_RUNNING_TIMER", timer: null });
    return entry;
  }

  function discardTimer() {
    dispatch({ type: "SET_RUNNING_TIMER", timer: null });
  }

  function createEntry(values: TimeEntryFormValues): TimeEntry {
    const now = getNowISO();
    const entry: TimeEntry = { id: generateId(), createdAt: now, updatedAt: now, ...toEntryFields(values) };
    dispatch({ type: "ADD", collection: "timeEntries", item: entry });
    return entry;
  }

  /** Returns false (no-op) for invoiced entries, which are read-only. */
  function updateEntry(id: string, values: TimeEntryFormValues): boolean {
    const existing = data.timeEntries.find((e) => e.id === id);
    if (!existing || existing.invoiceId) return false;
    dispatch({ type: "UPDATE", collection: "timeEntries", id, patch: toEntryFields(values) });
    return true;
  }

  /** Returns false (no-op) for invoiced entries. */
  function deleteEntry(entry: TimeEntry): boolean {
    if (entry.invoiceId) return false;
    const index = data.timeEntries.findIndex((e) => e.id === entry.id);
    deleteWithUndo({
      item: entry,
      message: t("time.deletedToast"),
      onDelete: (e) => dispatch({ type: "REMOVE", collection: "timeEntries", id: e.id }),
      onRestore: (e) =>
        dispatch({ type: "RESTORE", collection: "timeEntries", item: e, index: Math.max(0, index) }),
    });
    return true;
  }

  return {
    entries: data.timeEntries,
    runningTimer,
    startTimer,
    stopTimer,
    discardTimer,
    createEntry,
    updateEntry,
    deleteEntry,
  };
}
