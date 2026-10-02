"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/context/i18n-context";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/form-field";
import type { LostReason } from "../types";
import { reasonLabelKey } from "../logic";

const REASONS: LostReason[] = ["price", "timing", "scope", "no_response", "other"];

interface LostReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: LostReason) => void;
}

export function LostReasonDialog({ isOpen, onClose, onConfirm }: LostReasonDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [reason, setReason] = useState<LostReason | "">("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      setReason("");
      setShowError(false);
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      onClose();
      previouslyFocused.current?.focus();
    };
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  function confirm() {
    if (!reason) {
      setShowError(true);
      return;
    }
    onConfirm(reason);
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="lost-reason-title"
      className="m-auto w-full max-w-sm rounded-xl border-none bg-surface p-6 shadow-xl"
    >
      <h2 id="lost-reason-title" className="text-lg font-semibold text-text">
        {t("pipeline.lostDialogTitle")}
      </h2>
      <div className="mt-4">
        <FormField
          label={t("pipeline.lostDialogReason")}
          required
          error={showError ? t("validation.required") : undefined}
        >
          <Select value={reason} onChange={(e) => setReason(e.target.value as LostReason | "")}>
            <option value="">—</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {t(reasonLabelKey(r))}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="destructive" onClick={confirm}>
          {t("pipeline.lostDialogConfirm")}
        </Button>
      </div>
    </dialog>
  );
}
