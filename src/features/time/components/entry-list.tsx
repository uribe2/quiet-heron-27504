"use client";

import { Clock, Lock, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Project } from "@/features/projects/types";
import { formatDuration, toTimeInput, type DayGroup } from "../logic";
import type { TimeEntry } from "../types";

interface EntryListProps {
  groups: DayGroup[];
  projects: Project[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (entry: TimeEntry) => void;
}

export function EntryList({ groups, projects, onEdit, onDelete }: EntryListProps) {
  const { t, formatDate } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.date} aria-labelledby={`day-${group.date}`}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 id={`day-${group.date}`} className="text-base font-semibold text-text">
              {formatDate(group.date, { weekday: "long", day: "numeric", month: "long" })}
            </h3>
            <p className="text-sm text-text-muted">
              {t("time.dayTotal", { duration: formatDuration(group.totalMinutes) })}
            </p>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {group.entries.map((entry) => {
              const project = projects.find((p) => p.id === entry.projectId);
              const locked = Boolean(entry.invoiceId);
              return (
                <li
                  key={entry.id}
                  className={`flex min-h-[52px] flex-wrap items-center gap-3 px-4 py-3 hover:bg-surface-muted ${locked ? "bg-surface-muted" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{entry.description}</p>
                    <p className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {project?.name ?? t("time.unknownProject")} · {toTimeInput(entry.startedAt)}–
                      {toTimeInput(entry.endedAt)}
                    </p>
                    {locked ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        {t("time.lockedExplanation")}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge
                    label={entry.billable ? t("time.billableYes") : t("time.billableNo")}
                    tone={entry.billable ? "accent" : "neutral"}
                  />
                  {locked ? <StatusBadge label={t("time.invoicedBadge")} tone="success" /> : null}
                  <span className="w-16 text-right text-sm font-semibold text-text">
                    {formatDuration(entry.durationMinutes)}
                  </span>
                  {!locked ? (
                    <div className="flex">
                      <IconButton aria-label={t("time.editAction")} onClick={() => onEdit(entry)}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                      <IconButton aria-label={t("time.deleteAction")} onClick={() => onDelete(entry)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </IconButton>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
