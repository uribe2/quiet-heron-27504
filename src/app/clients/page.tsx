"use client";

import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useClients } from "@/features/clients/use-clients";
import { filterClients, type ClientFilters } from "@/features/clients/logic";
import type { Client } from "@/features/clients/types";
import type { ClientFormValues } from "@/features/clients/schema";
import { useToast } from "@/context/toast-context";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ClientFiltersBar } from "@/features/clients/components/client-filters-bar";
import { ClientTable } from "@/features/clients/components/client-table";
import { ClientDrawer } from "@/features/clients/components/client-drawer";

export default function ClientsPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const { clients, createClient, updateClient, archiveClient, deleteClient, getDeletionCheck } = useClients();
  const drawer = useDisclosure(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [filters, setFilters] = useState<ClientFilters>({ status: "active" });
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [blockedTarget, setBlockedTarget] = useState<Client | null>(null);

  const tags = useMemo(() => Array.from(new Set(clients.flatMap((c) => c.tags))).sort(), [clients]);
  const filtered = useMemo(() => filterClients(clients, filters), [clients, filters]);

  function openCreate() {
    setEditingClient(undefined);
    drawer.open();
  }

  function openEdit(client: Client) {
    setEditingClient(client);
    drawer.open();
  }

  function handleSubmit(values: ClientFormValues) {
    if (editingClient) {
      updateClient(editingClient.id, values);
      show({ message: t("clients.updatedToast", { name: values.name }) });
    } else {
      createClient(values);
      show({ message: t("clients.createdToast", { name: values.name }) });
    }
    drawer.close();
  }

  function requestDelete(client: Client) {
    const check = getDeletionCheck(client.id);
    if (!check.canDelete) {
      setBlockedTarget(client);
      return;
    }
    setDeleteTarget(client);
  }

  function confirmDelete() {
    if (deleteTarget) deleteClient(deleteTarget);
  }

  const deletionCheck = deleteTarget ? getDeletionCheck(deleteTarget.id) : null;

  return (
    <div>
      <PageHeader
        title={t("clients.title")}
        description={t("clients.subtitle")}
        actions={<Button onClick={openCreate}>{t("clients.createButton")}</Button>}
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" aria-hidden="true" />}
          title={t("clients.emptyTitle")}
          description={t("clients.emptyDescription")}
          action={<Button onClick={openCreate}>{t("clients.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <ClientFiltersBar filters={filters} tags={tags} onChange={setFilters} />
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" aria-hidden="true" />}
              title={t("clients.emptyFilteredTitle")}
              description={t("clients.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({ status: "active" })}>
                  {t("clients.clearFilters")}
                </Button>
              }
            />
          ) : (
            <ClientTable
              clients={filtered}
              onEdit={openEdit}
              onArchive={archiveClient}
              onDeleteRequest={requestDelete}
            />
          )}
        </div>
      )}

      <ClientDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        client={editingClient}
        existingClients={clients}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={t("clients.deleteConfirmTitle", { name: deleteTarget?.name ?? "" })}
        description={t("clients.deleteConfirmBody", {
          interactions: String(deletionCheck?.relatedInteractions ?? 0),
          opportunities: String(deletionCheck?.relatedOpportunities ?? 0),
        })}
        confirmLabel={t("clients.deleteConfirmConfirm")}
        cancelLabel={t("clients.deleteConfirmCancel")}
        destructive
      />

      <ConfirmDialog
        isOpen={blockedTarget !== null}
        onClose={() => setBlockedTarget(null)}
        onConfirm={() => setBlockedTarget(null)}
        title={t("clients.deleteBlockedTitle", { name: blockedTarget?.name ?? "" })}
        description={t("clients.deleteBlockedBody")}
        confirmLabel={t("clients.deleteBlockedClose")}
        cancelLabel={t("clients.deleteBlockedClose")}
      />
    </div>
  );
}
