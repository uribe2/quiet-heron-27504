"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { ProjectForm, PROJECT_FORM_ID } from "./project-form";
import type { Project } from "../types";
import type { ProjectFormValues } from "../schema";
import type { Client } from "@/features/clients/types";

interface ProjectDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  clients: Client[];
  onSubmit: (values: ProjectFormValues) => void;
}

export function ProjectDrawer({ isOpen, onClose, project, clients, onSubmit }: ProjectDrawerProps) {
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
        title={project ? t("projects.drawerEditTitle") : t("projects.drawerCreateTitle")}
        closeLabel={t("projects.closeDrawer")}
        breadcrumbs={[{ label: t("projects.title"), href: "/projects" }]}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={PROJECT_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <ProjectForm project={project} clients={clients} onSubmit={onSubmit} onDirtyChange={setIsDirty} />
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
