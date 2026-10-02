"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/context/i18n-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";

interface MarkDoneDialogProps {
  isOpen: boolean;
  onClose: () => void;
  hasClient: boolean;
  onConfirm: (notes: string, registerInteraction: boolean) => void;
}

export function MarkDoneDialog({ isOpen, onClose, hasClient, onConfirm }: MarkDoneDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const [notes, setNotes] = useState("");
  const [registerInteraction, setRegisterInteraction] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="mark-done-title"
      className="m-auto w-full max-w-md rounded-xl border-none bg-surface p-6 shadow-xl"
    >
      <h2 id="mark-done-title" className="text-lg font-semibold text-text">
        {t("meetings.markDoneTitle")}
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        <FormField label={t("meetings.fieldNotes")}>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <Checkbox
          label={t("meetings.registerAsInteraction")}
          checked={registerInteraction}
          disabled={!hasClient}
          onChange={(e) => setRegisterInteraction(e.target.checked)}
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button onClick={() => onConfirm(notes, registerInteraction)}>{t("meetings.markDoneConfirm")}</Button>
      </div>
    </dialog>
  );
}
