"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { MeetingForm, MEETING_FORM_ID } from "./meeting-form";
import { MarkDoneDialog } from "./mark-done-dialog";
import type { Meeting } from "../types";
import type { MeetingFormValues } from "../schema";
import type { Client } from "@/features/clients/types";
import type { Project } from "@/features/projects/types";

interface MeetingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meeting?: Meeting;
  clients: Client[];
  projects: Project[];
  onSubmit: (values: MeetingFormValues) => void;
  onCancelMeeting?: (meeting: Meeting) => void;
  onMarkDone?: (meeting: Meeting, notes: string, registerInteraction: boolean) => void;
  onDeleteRequest?: (meeting: Meeting) => void;
}

export function MeetingDrawer({
  isOpen,
  onClose,
  meeting,
  clients,
  projects,
  onSubmit,
  onCancelMeeting,
  onMarkDone,
  onDeleteRequest,
}: MeetingDrawerProps) {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  function requestClose() {
    // The native dialog "close" event fires after a programmatic close (e.g. after saving); ignore it.
    if (!isOpen) return;
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      setConfirmingClose(false);
    }
  }, [isOpen]);

  const canManage = meeting && meeting.status === "scheduled";

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={meeting ? t("meetings.drawerEditTitle") : t("meetings.drawerCreateTitle")}
        closeLabel={t("meetings.closeDrawer")}
        breadcrumbs={[{ label: t("meetings.title"), href: "/meetings" }]}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            {canManage && onCancelMeeting ? (
              <Button type="button" variant="destructive" onClick={() => onCancelMeeting(meeting)}>
                {t("meetings.cancelAction")}
              </Button>
            ) : null}
            {canManage && onMarkDone ? (
              <Button type="button" variant="secondary" onClick={() => setMarkingDone(true)}>
                {t("meetings.markDoneAction")}
              </Button>
            ) : null}
            {meeting && onDeleteRequest ? (
              <Button type="button" variant="destructive" onClick={() => onDeleteRequest(meeting)}>
                {t("meetings.deleteAction")}
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={MEETING_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <MeetingForm
            meeting={meeting}
            clients={clients}
            projects={projects}
            onSubmit={onSubmit}
            onDirtyChange={setIsDirty}
          />
        ) : null}
      </Drawer>
      <ConfirmDialog
        isOpen={confirmingClose}
        onClose={() => setConfirmingClose(false)}
        onConfirm={() => {
          setConfirmingClose(false);
          onClose();
        }}
        title={t("clients.discardConfirmTitle")}
        description={t("clients.discardConfirmBody")}
        confirmLabel={t("clients.discardConfirmConfirm")}
        cancelLabel={t("clients.discardConfirmCancel")}
        destructive
      />
      {meeting && onMarkDone ? (
        <MarkDoneDialog
          isOpen={markingDone}
          onClose={() => setMarkingDone(false)}
          hasClient={Boolean(meeting.clientId)}
          onConfirm={(notes, registerInteraction) => {
            onMarkDone(meeting, notes, registerInteraction);
            setMarkingDone(false);
            onClose();
          }}
        />
      ) : null}
    </>
  );
}
