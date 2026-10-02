"use client";

import { ArrowUp, ArrowDown, Pencil, Trash2, ExternalLink } from "lucide-react";
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
  reorder?: { canMoveUp: boolean; canMoveDown: boolean; onUp: () => void; onDown: () => void };
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
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-text">{title}</p>
          <p className={`text-sm ${overdue ? "text-danger" : "text-text-muted"}`}>
            {t("deliverables.dueLabel", { date: formatDate(deliverable.dueDate) })}
          </p>
          {showProject && project ? (
            <p className="text-sm text-text-muted">
              {t("deliverables.projectLabel", { name: project.name })}
              {client ? ` · ${t("deliverables.clientLabel", { name: client.name })}` : ""}
            </p>
          ) : null}
          {deliverable.externalUrl ? (
            <a
              href={deliverable.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              {t("deliverables.openLink")}
            </a>
          ) : null}
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
          {reorder ? (
            <>
              <IconButton
                aria-label={t("deliverables.moveUp", { title })}
                disabled={!reorder.canMoveUp}
                onClick={reorder.onUp}
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </IconButton>
              <IconButton
                aria-label={t("deliverables.moveDown", { title })}
                disabled={!reorder.canMoveDown}
                onClick={reorder.onDown}
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </>
          ) : null}
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
