"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/context/i18n-context";
import type { TimeEntry } from "@/features/time/types";

interface BillHoursDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  entries: TimeEntry[];
  onConfirm: (entryIds: string[]) => void;
}

/** Flow 4: pick unbilled billable entries (all checked by default). */
export function BillHoursDialog({ isOpen, onClose, projectName, entries, onConfirm }: BillHoursDialogProps) {
  const { t, formatDate } = useTranslation();
  const [unchecked, setUnchecked] = useState<string[]>([]);

  const selected = entries.filter((e) => !unchecked.includes(e.id));
  const hours = selected.reduce((sum, e) => sum + e.durationMinutes, 0) / 60;

  function toggle(id: string, checked: boolean) {
    setUnchecked((prev) => (checked ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function close() {
    setUnchecked([]);
    onClose();
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={close}
      onConfirm={() => {
        if (selected.length === 0) return;
        onConfirm(selected.map((e) => e.id));
        setUnchecked([]);
      }}
      title={t("projects.billHoursTitle", { name: projectName })}
      description={
        <div className="flex flex-col gap-3">
          <p>{t("projects.billHoursBody")}</p>
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Checkbox
                  id={`bill-entry-${entry.id}`}
                  label={`${formatDate(entry.startedAt)} — ${entry.description} (${(entry.durationMinutes / 60).toFixed(1)}h)`}
                  checked={!unchecked.includes(entry.id)}
                  onChange={(e) => toggle(entry.id, e.target.checked)}
                />
              </li>
            ))}
          </ul>
          <p className="font-medium text-text" aria-live="polite">
            {t("projects.billHoursSelected", { hours: hours.toFixed(1) })}
          </p>
        </div>
      }
      confirmLabel={t("projects.billHoursConfirm")}
      cancelLabel={t("projects.billHoursCancel")}
    />
  );
}
