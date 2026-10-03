"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useInteractions } from "@/features/interactions/use-interactions";
import { useClients } from "@/features/clients/use-clients";
import { filterInteractions, type InteractionFilters } from "@/features/interactions/logic";
import type { Interaction } from "@/features/interactions/types";
import type { InteractionFormValues } from "@/features/interactions/schema";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractionFiltersBar } from "@/features/interactions/components/interaction-filters-bar";
import { InteractionTimeline } from "@/features/interactions/components/interaction-timeline";
import { InteractionDrawer } from "@/features/interactions/components/interaction-drawer";
import { FollowUpsSection } from "@/features/interactions/components/follow-ups-section";

function InteractionsContent() {
  const { t } = useTranslation();
  const { show } = useToast();
  const searchParams = useSearchParams();
  const presetFromQuery = searchParams.get("clientId") ?? undefined;
  const {
    interactions,
    createInteraction,
    updateInteraction,
    deleteInteraction,
    completeFollowUp,
    rescheduleFollowUp,
  } = useInteractions();
  const { clients } = useClients();
  const drawer = useDisclosure(false);
  const [editing, setEditing] = useState<Interaction | undefined>(undefined);
  const [presetClientId, setPresetClientId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<InteractionFilters>({});
  const openedFromQuery = useRef(false);

  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const clientNames = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c.name])), [clients]);
  const filtered = useMemo(() => filterInteractions(interactions, filters), [interactions, filters]);

  function openCreate(clientId?: string) {
    setEditing(undefined);
    setPresetClientId(clientId);
    drawer.open();
  }

  const openDrawer = drawer.open;
  useEffect(() => {
    if (presetFromQuery && !openedFromQuery.current) {
      openedFromQuery.current = true;
      setEditing(undefined);
      setPresetClientId(presetFromQuery);
      openDrawer();
    }
  }, [presetFromQuery, openDrawer]);

  function openEdit(interaction: Interaction) {
    setEditing(interaction);
    drawer.open();
  }

  function handleSubmit(values: InteractionFormValues) {
    if (editing) {
      updateInteraction(editing.id, values);
    } else {
      createInteraction(values);
    }
    show({ message: t("interactions.saveSuccess") });
    drawer.close();
  }

  return (
    <div>
      <PageHeader
        title={t("interactions.title")}
        description={t("interactions.subtitle")}
        actions={<Button onClick={() => openCreate()}>{t("interactions.createButton")}</Button>}
      />

      {interactions.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" aria-hidden="true" />}
          title={t("interactions.emptyTitle")}
          description={t("interactions.emptyDescription")}
          action={<Button onClick={() => openCreate()}>{t("interactions.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <FollowUpsSection
            interactions={interactions}
            clientNames={clientNames}
            onComplete={(i) => {
              completeFollowUp(i.id);
              show({ message: t("interactions.markDoneToast") });
            }}
            onReschedule={(i, date) => {
              rescheduleFollowUp(i.id, date);
              show({ message: t("interactions.rescheduleToast") });
            }}
          />
          <InteractionFiltersBar filters={filters} clients={clients} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-8 w-8" aria-hidden="true" />}
              title={t("interactions.emptyFilteredTitle")}
              description={t("interactions.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({})}>
                  {t("interactions.clearFilters")}
                </Button>
              }
            />
          ) : (
            <InteractionTimeline interactions={filtered} clientNames={clientNames} onEdit={openEdit} />
          )}
        </div>
      )}

      <InteractionDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        interaction={editing}
        presetClientId={presetClientId}
        clients={activeClients}
        onSubmit={handleSubmit}
        onDelete={(i) => {
          deleteInteraction(i);
          drawer.close();
        }}
      />
    </div>
  );
}

export default function InteractionsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full" />}>
      <InteractionsContent />
    </Suspense>
  );
}
