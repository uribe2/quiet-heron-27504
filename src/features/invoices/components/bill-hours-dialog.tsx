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
  const { t, formatDate, formatNumber } = useTranslation();
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
          <p className="rounded-lg bg-accent-soft p-3 text-text">{t("projects.billHoursBody")}</p>
          <ul className="flex max-h-64 flex-col divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {entries.map((entry) => (
              <li key={entry.id} className="px-3 py-1">
                <Checkbox
                  id={`bill-entry-${entry.id}`}
                  label={`${formatDate(entry.startedAt)} — ${entry.description} (${formatNumber(entry.durationMinutes / 60)} h)`}
                  checked={!unchecked.includes(entry.id)}
                  onChange={(e) => toggle(entry.id, e.target.checked)}
                />
              </li>
            ))}
          </ul>
          <p className="rounded-lg bg-surface-muted px-3 py-2 text-right text-sm font-semibold text-text" aria-live="polite">
            {t("projects.billHoursSelected", { hours: formatNumber(hours) })}
          </p>
        </div>
      }
      confirmLabel={t("projects.billHoursConfirm")}
      cancelLabel={t("projects.billHoursCancel")}
    />
  );
}
