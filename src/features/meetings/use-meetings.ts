"use client";

import { useData } from "@/context/data-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { useTranslation } from "@/context/i18n-context";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import type { Meeting } from "./types";
import type { Interaction } from "@/features/interactions/types";
import type { MeetingFormValues } from "./schema";
import { findOverlappingMeetings } from "./logic";

function toMeetingFields(values: MeetingFormValues) {
  return {
    title: values.title.trim(),
    clientId: values.clientId || undefined,
    projectId: values.projectId || undefined,
    startsAt: values.startsAt,
    durationMinutes: values.durationMinutes,
    mode: values.mode,
    locationOrLink: values.locationOrLink || undefined,
    agenda: values.agenda || undefined,
  };
}

export function useMeetings() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  function createMeeting(values: MeetingFormValues): Meeting {
    const now = getNowISO();
    const meeting: Meeting = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      status: "scheduled",
      ...toMeetingFields(values),
    };
    dispatch({ type: "ADD", collection: "meetings", item: meeting });
    return meeting;
  }

  function updateMeeting(id: string, values: MeetingFormValues) {
    dispatch({ type: "UPDATE", collection: "meetings", id, patch: toMeetingFields(values) });
  }

  function cancelMeeting(meeting: Meeting) {
    dispatch({ type: "UPDATE", collection: "meetings", id: meeting.id, patch: { status: "cancelled" } });
  }

  function markDone(meeting: Meeting, notes: string, registerInteraction: boolean) {
    dispatch({ type: "UPDATE", collection: "meetings", id: meeting.id, patch: { status: "done", notes } });
    if (registerInteraction && meeting.clientId) {
      const now = getNowISO();
      const interaction: Interaction = {
        id: generateId(),
        createdAt: now,
        updatedAt: now,
        clientId: meeting.clientId,
        projectId: meeting.projectId,
        meetingId: meeting.id,
        channel: "meeting",
        occurredAt: now,
        summary: notes || meeting.title,
        sentiment: "neutral",
        followUpDone: true,
      };
      dispatch({ type: "ADD", collection: "interactions", item: interaction });
    }
  }

  function deleteMeeting(meeting: Meeting) {
    deleteWithUndo({
      item: meeting,
      message: t("meetings.deletedToast"),
      onDelete: (m) => dispatch({ type: "REMOVE", collection: "meetings", id: m.id }),
      onRestore: (m) => dispatch({ type: "ADD", collection: "meetings", item: m }),
    });
  }

  function getOverlaps(startsAt: string, durationMinutes: number, excludeId?: string): Meeting[] {
    return findOverlappingMeetings(data.meetings, startsAt, durationMinutes, excludeId);
  }

  return {
    meetings: data.meetings,
    createMeeting,
    updateMeeting,
    cancelMeeting,
    markDone,
    deleteMeeting,
    getOverlaps,
  };
}
