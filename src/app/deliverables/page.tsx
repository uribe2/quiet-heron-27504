"use client";

import { useMemo, useState } from "react";
import { ListChecks } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useProjects } from "@/features/projects/use-projects";
import { useDeliverables } from "@/features/deliverables/use-deliverables";
import { filterDeliverables, type DeliverableFilters } from "@/features/deliverables/logic";
import type { Deliverable } from "@/features/deliverables/types";
import type { DeliverableFormValues } from "@/features/deliverables/schema";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DeliverableFiltersBar } from "@/features/deliverables/components/deliverable-filters-bar";
import { DeliverableList } from "@/features/deliverables/components/deliverable-list";
import { DeliverableDrawer } from "@/features/deliverables/components/deliverable-drawer";

export default function DeliverablesPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const { projects } = useProjects();
  const { deliverables, createDeliverable, updateDeliverable, setStatus, deleteDeliverable } = useDeliverables();
  const drawer = useDisclosure(false);
  const [editing, setEditing] = useState<Deliverable | undefined>(undefined);
  const [filters, setFilters] = useState<DeliverableFilters>({});

  const filtered = useMemo(() => filterDeliverables(deliverables, filters), [deliverables, filters]);

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
    <div>
      <PageHeader
        title={t("deliverables.title")}
        actions={<Button onClick={openCreate}>{t("deliverables.createButton")}</Button>}
      />

      {deliverables.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-8 w-8" aria-hidden="true" />}
          title={t("deliverables.emptyTitle")}
          description={t("deliverables.emptyDescription")}
          action={<Button onClick={openCreate}>{t("deliverables.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <DeliverableFiltersBar filters={filters} projects={projects} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-8 w-8" aria-hidden="true" />}
              title={t("deliverables.emptyFilteredTitle")}
              description={t("deliverables.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({ status: "all" })}>
                  {t("deliverables.clearFilters")}
                </Button>
              }
            />
          ) : (
            <DeliverableList
              deliverables={filtered}
              onStatusChange={setStatus}
              onEdit={(d) => {
                setEditing(d);
                drawer.open();
              }}
              onDelete={deleteDeliverable}
            />
          )}
        </div>
      )}

      <DeliverableDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        deliverable={editing}
        projects={projects}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
