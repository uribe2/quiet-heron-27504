"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { OpportunityForm, OPPORTUNITY_FORM_ID } from "./opportunity-form";
import type { Opportunity } from "../types";
import type { OpportunityFormValues } from "../schema";
import type { Client } from "@/features/clients/types";

interface OpportunityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity?: Opportunity;
  clients: Client[];
  onSubmit: (values: OpportunityFormValues) => void;
}

export function OpportunityDrawer({ isOpen, onClose, opportunity, clients, onSubmit }: OpportunityDrawerProps) {
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
        title={opportunity ? t("pipeline.drawerEditTitle") : t("pipeline.drawerCreateTitle")}
        closeLabel={t("pipeline.closeDrawer")}
        breadcrumbs={[{ label: t("pipeline.title"), href: "/pipeline" }]}
        footer={
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={OPPORTUNITY_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <OpportunityForm opportunity={opportunity} clients={clients} onSubmit={onSubmit} onDirtyChange={setIsDirty} />
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
