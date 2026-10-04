"use client";

import { useData } from "@/context/data-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { useTranslation } from "@/context/i18n-context";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import type { Client } from "./types";
import type { ClientFormValues } from "./schema";
import { checkClientDeletion, type ClientDeletionCheck } from "./logic";

function toClientFields(values: ClientFormValues) {
  return {
    name: values.name.trim(),
    type: values.type,
    email: values.email || undefined,
    phone: values.phone || undefined,
    website: values.website || undefined,
    taxId: values.taxId || undefined,
    city: values.city || undefined,
    country: values.country || undefined,
    contacts: values.contacts,
    tags: values.tags,
    source: values.source || undefined,
    notes: values.notes || undefined,
  };
}

export function useClients() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  function createClient(values: ClientFormValues): Client {
    const now = getNowISO();
    const client: Client = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      status: "active",
      ...toClientFields(values),
    };
    dispatch({ type: "ADD", collection: "clients", item: client });
    return client;
  }

  function updateClient(id: string, values: ClientFormValues) {
    dispatch({ type: "UPDATE", collection: "clients", id, patch: toClientFields(values) });
  }

  function archiveClient(client: Client) {
    deleteWithUndo({
      item: client,
      message: t("clients.archivedToast", { name: client.name }),
      onDelete: (c) =>
        dispatch({ type: "UPDATE", collection: "clients", id: c.id, patch: { status: "archived" } }),
      onRestore: (c) =>
        dispatch({ type: "UPDATE", collection: "clients", id: c.id, patch: { status: "active" } }),
    });
  }

  function getDeletionCheck(clientId: string): ClientDeletionCheck {
    return checkClientDeletion(clientId, data);
  }

  function deleteClient(client: Client) {
    data.interactions
      .filter((i) => i.clientId === client.id)
      .forEach((i) => dispatch({ type: "REMOVE", collection: "interactions", id: i.id }));
    data.opportunities
      .filter((o) => o.clientId === client.id)
      .forEach((o) => dispatch({ type: "REMOVE", collection: "opportunities", id: o.id }));
    data.meetings
      .filter((m) => m.clientId === client.id)
      .forEach((m) => dispatch({ type: "UPDATE", collection: "meetings", id: m.id, patch: { clientId: undefined } }));
    data.documents
      .filter((d) => d.clientId === client.id)
      .forEach((d) => dispatch({ type: "UPDATE", collection: "documents", id: d.id, patch: { clientId: undefined } }));
    dispatch({ type: "REMOVE", collection: "clients", id: client.id });
  }

  return {
    clients: data.clients,
    createClient,
    updateClient,
    archiveClient,
    deleteClient,
    getDeletionCheck,
  };
}

export function useClient(id: string): Client | undefined {
  const { data } = useData();
  return data.clients.find((c) => c.id === id);
}
