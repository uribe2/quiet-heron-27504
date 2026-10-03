"use client";

import { useState } from "react";
import { useTranslation } from "@/context/i18n-context";
import { FormSection } from "@/components/ui/form-section";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ResetDataSection({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-danger/30 bg-danger-soft p-6">
        <FormSection
          title={t("settings.sectionData")}
          description={t("settings.resetDescription")}
        >
          <div>
            <Button variant="destructive" onClick={() => setOpen(true)}>
              {t("settings.resetDemoData")}
            </Button>
          </div>
        </FormSection>
      </div>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onReset}
        title={t("settings.resetConfirmTitle")}
        description={t("settings.resetConfirmBody")}
        confirmLabel={t("settings.resetConfirmLabel")}
        cancelLabel={t("common.cancel")}
        destructive
      />
    </>
  );
}
