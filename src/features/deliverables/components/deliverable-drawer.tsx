"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { DeliverableForm, DELIVERABLE_FORM_ID } from "./deliverable-form";
import type { Deliverable } from "../types";
import type { DeliverableFormValues } from "../schema";
import type { Project } from "@/features/projects/types";

interface DeliverableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  deliverable?: Deliverable;
  defaultProjectId?: string;
  projects: Project[];
  onSubmit: (values: DeliverableFormValues) => void;
}

export function DeliverableDrawer({
  isOpen,
  onClose,
  deliverable,
  defaultProjectId,
  projects,
  onSubmit,
}: DeliverableDrawerProps) {
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
        title={deliverable ? t("deliverables.drawerEditTitle") : t("deliverables.drawerCreateTitle")}
        closeLabel={t("deliverables.closeDrawer")}
        breadcrumbs={[{ label: t("deliverables.title"), href: "/deliverables" }]}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={DELIVERABLE_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <DeliverableForm
            deliverable={deliverable}
            defaultProjectId={defaultProjectId}
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
          setIsDirty(false);
          onClose();
        }}
        title={t("clients.discardConfirmTitle")}
        description={t("clients.discardConfirmBody")}
        confirmLabel={t("clients.discardConfirmConfirm")}
        cancelLabel={t("clients.discardConfirmCancel")}
        destructive
      />
    </>
  );
}
