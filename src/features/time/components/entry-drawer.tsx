"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import type { Project } from "@/features/projects/types";
import type { Deliverable } from "@/features/deliverables/types";
import { EntryForm, TIME_FORM_ID } from "./entry-form";
import type { TimeEntry } from "../types";
import type { TimeEntryFormValues } from "../schema";

interface EntryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entry?: TimeEntry;
  projects: Project[];
  deliverables: Deliverable[];
  onSubmit: (values: TimeEntryFormValues) => void;
}

export function EntryDrawer({ isOpen, onClose, entry, projects, deliverables, onSubmit }: EntryDrawerProps) {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  function requestClose() {
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={entry ? t("time.drawerEditTitle") : t("time.drawerCreateTitle")}
        closeLabel={t("time.closeDrawer")}
        breadcrumbs={[{ label: t("time.title"), href: "/time" }]}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={TIME_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <EntryForm
            entry={entry}
            projects={projects}
            deliverables={deliverables}
            onSubmit={onSubmit}
            onDirtyChange={setIsDirty}
          />
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
