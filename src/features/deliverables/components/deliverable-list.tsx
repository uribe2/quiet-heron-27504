"use client";

import type { Deliverable, DeliverableStatus } from "../types";
import { GROUP_ORDER, groupDeliverablesByDue, type DeliverableGroups } from "../logic";
import { useTranslation } from "@/context/i18n-context";
import { DeliverableItem } from "./deliverable-item";

const groupLabel = {
  overdue: "groupOverdue",
  today: "groupToday",
  tomorrow: "groupTomorrow",
  thisWeek: "groupThisWeek",
  later: "groupLater",
  delivered: "groupDelivered",
} as const;

interface DeliverableListProps {
  deliverables: Deliverable[];
  onStatusChange: (d: Deliverable, status: DeliverableStatus) => void;
  onEdit: (d: Deliverable) => void;
  onDelete: (d: Deliverable) => void;
}

export function DeliverableList({ deliverables, onStatusChange, onEdit, onDelete }: DeliverableListProps) {
  const { t } = useTranslation();
  const groups = groupDeliverablesByDue(deliverables);
  const keys: (keyof DeliverableGroups)[] = [...GROUP_ORDER, "delivered"];

  return (
    <div className="flex flex-col gap-6">
      {keys
        .filter((key) => groups[key].length > 0)
        .map((key) => (
          <section key={key} aria-labelledby={`deliverables-group-${key}`}>
            <h2
              id={`deliverables-group-${key}`}
              className={`mb-2 text-sm font-semibold uppercase tracking-wide ${key === "overdue" ? "text-danger" : "text-text-muted"}`}
            >
              {t(`deliverables.${groupLabel[key]}`)} ({groups[key].length})
            </h2>
            <ul className="flex flex-col gap-2">
              {groups[key].map((d) => (
                <li key={d.id}>
                  <DeliverableItem
                    deliverable={d}
                    onStatusChange={(s) => onStatusChange(d, s)}
                    onEdit={() => onEdit(d)}
                    onDelete={() => onDelete(d)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
