"use client";

import { AlertCircle, ArrowUp, ArrowDown, CalendarDays, FolderOpen, Pencil, Trash2, ExternalLink } from "lucide-react";
import type { Deliverable, DeliverableStatus } from "../types";
import { isOverdue } from "../logic";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { IconButton } from "@/components/ui/icon-button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

const statusKey = { pending: "statusPending", in_progress: "statusInProgress", delivered: "statusDelivered" } as const;
const statusTone: Record<DeliverableStatus, StatusTone> = { pending: "neutral", in_progress: "accent", delivered: "success" };

interface DeliverableItemProps {
  deliverable: Deliverable;
  showProject?: boolean;
  /** When set, shows up/down reorder buttons. */
  reorder?: { position?: number; canMoveUp: boolean; canMoveDown: boolean; onUp: () => void; onDown: () => void };
  onStatusChange: (status: DeliverableStatus) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function DeliverableItem({
  deliverable,
  showProject = true,
  reorder,
  onStatusChange,
  onEdit,
  onDelete,
}: DeliverableItemProps) {
  const { data } = useData();
  const { t, formatDate } = useTranslation();
  const project = data.projects.find((p) => p.id === deliverable.projectId);
  const client = data.clients.find((c) => c.id === project?.clientId);
  const overdue = isOverdue(deliverable);
  const title = deliverable.title;

  return (
    <Card className={`p-4 ${overdue ? "border-l-4 border-l-danger" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {reorder ? (
            <div className="flex shrink-0 flex-col">
              <IconButton aria-label={t("deliverables.moveUp", { title })} disabled={!reorder.canMoveUp} onClick={reorder.onUp}>
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton aria-label={t("deliverables.moveDown", { title })} disabled={!reorder.canMoveDown} onClick={reorder.onDown}>
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            {reorder?.position ? (
              <p className="label-eyebrow text-text-muted">{t("deliverables.milestoneOrder", { n: String(reorder.position) })}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-medium text-text">{title}</p>
              {overdue ? (
                <StatusBadge
                  label={t("deliverables.groupOverdue")}
                  tone="danger"
                  icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                />
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
              <span className={`inline-flex items-center gap-1 ${overdue ? "font-medium text-danger" : ""}`}>
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {t("deliverables.dueLabel", { date: formatDate(deliverable.dueDate) })}
              </span>
              {showProject && project ? (
                <span className="inline-flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("deliverables.projectLabel", { name: project.name })}
                  {client ? ` · ${t("deliverables.clientLabel", { name: client.name })}` : ""}
                </span>
              ) : null}
              {deliverable.externalUrl ? (
                <a
                  href={deliverable.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-6 items-center gap-1 rounded text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("deliverables.openLink")}
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge label={t(`deliverables.${statusKey[deliverable.status]}`)} tone={statusTone[deliverable.status]} />
          <Select
            aria-label={t("deliverables.statusSelectLabel", { title })}
            value={deliverable.status}
            onChange={(e) => onStatusChange(e.target.value as DeliverableStatus)}
            className="w-40"
          >
            <option value="pending">{t("deliverables.statusPending")}</option>
            <option value="in_progress">{t("deliverables.statusInProgress")}</option>
            <option value="delivered">{t("deliverables.statusDelivered")}</option>
          </Select>
          <IconButton aria-label={t("deliverables.editAction", { title })} onClick={onEdit}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </IconButton>
          <IconButton aria-label={t("deliverables.deleteAction", { title })} onClick={onDelete}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </IconButton>
        </div>
      </div>
    </Card>
  );
}
