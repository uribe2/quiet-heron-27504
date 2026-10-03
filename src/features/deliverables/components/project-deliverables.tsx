"use client";

import { useMemo, useState } from "react";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Button } from "@/components/ui/button";
import { useDeliverables } from "../use-deliverables";
import { getProjectDeliverables } from "../logic";
import type { Deliverable } from "../types";
import type { DeliverableFormValues } from "../schema";
import { DeliverableItem } from "./deliverable-item";
import { DeliverableDrawer } from "./deliverable-drawer";

/** Milestone-ordered deliverables of one project, with reorder, status change and add. */
export function ProjectDeliverables({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { show } = useToast();
  const { data } = useData();
  const { createDeliverable, updateDeliverable, setStatus, moveUp, moveDown, deleteDeliverable } = useDeliverables();
  const drawer = useDisclosure(false);
  const [editing, setEditing] = useState<Deliverable | undefined>(undefined);
  const items = useMemo(() => getProjectDeliverables(data.deliverables, projectId), [data.deliverables, projectId]);
  const projects = useMemo(() => data.projects.filter((p) => p.id === projectId), [data.projects, projectId]);

  function openCreate() {
    setEditing(undefined);
    drawer.open();
  }

  function handleSubmit(values: DeliverableFormValues) {
    if (editing) updateDeliverable(editing.id, values);
    else createDeliverable(values);
    show({ message: t("deliverables.saveSuccess") });
    drawer.close();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="secondary" onClick={openCreate}>{t("deliverables.addToProject")}</Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-text-muted">{t("deliverables.projectEmpty")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((d, index) => (
            <li key={d.id}>
              <DeliverableItem
                deliverable={d}
                showProject={false}
                reorder={{
                  position: index + 1,
                  canMoveUp: index > 0,
                  canMoveDown: index < items.length - 1,
                  onUp: () => moveUp(d),
                  onDown: () => moveDown(d),
                }}
                onStatusChange={(s) => setStatus(d, s)}
                onEdit={() => {
                  setEditing(d);
                  drawer.open();
                }}
                onDelete={() => deleteDeliverable(d)}
              />
            </li>
          ))}
        </ol>
      )}
      <DeliverableDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        deliverable={editing}
        defaultProjectId={projectId}
        projects={projects}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
