"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { ClientForm, CLIENT_FORM_ID } from "./client-form";
import type { Client } from "../types";
import type { ClientFormValues } from "../schema";

interface ClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client;
  existingClients: Client[];
  onSubmit: (values: ClientFormValues) => void;
}

export function ClientDrawer({ isOpen, onClose, client, existingClients, onSubmit }: ClientDrawerProps) {
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
        title={client ? t("clients.drawerEditTitle") : t("clients.drawerCreateTitle")}
        closeLabel={t("clients.closeDrawer")}
        breadcrumbs={[{ label: t("clients.title"), href: "/clients" }]}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={CLIENT_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <ClientForm
            client={client}
            existingClients={existingClients}
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
