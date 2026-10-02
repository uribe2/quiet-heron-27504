"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { InteractionForm, INTERACTION_FORM_ID } from "./interaction-form";
import type { Interaction } from "../types";
import type { InteractionFormValues } from "../schema";
import type { Client } from "@/features/clients/types";

interface InteractionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  interaction?: Interaction;
  presetClientId?: string;
  clients: Client[];
  onSubmit: (values: InteractionFormValues) => void;
  onDelete?: (interaction: Interaction) => void;
}

export function InteractionDrawer({
  isOpen,
  onClose,
  interaction,
  presetClientId,
  clients,
  onSubmit,
  onDelete,
}: InteractionDrawerProps) {
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
        title={interaction ? t("interactions.drawerEditTitle") : t("interactions.drawerCreateTitle")}
        closeLabel={t("interactions.closeDrawer")}
        breadcrumbs={[{ label: t("interactions.title"), href: "/interactions" }]}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            {interaction && onDelete ? (
              <Button type="button" variant="destructive" onClick={() => onDelete(interaction)}>
                {t("interactions.deleteAction")}
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={INTERACTION_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <InteractionForm
            interaction={interaction}
            presetClientId={presetClientId}
            clients={clients}
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
