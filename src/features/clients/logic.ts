import type { AppData } from "@/lib/app-data";
import type { Client } from "./types";

export function isClientNameTaken(
  name: string,
  clients: Client[],
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase();
  return clients.some(
    (c) =>
      c.status === "active" &&
      c.id !== excludeId &&
      c.name.trim().toLowerCase() === normalized,
  );
}

export function getPrimaryContact(client: Client) {
  return client.contacts.find((c) => c.isPrimary);
}

export interface ClientDeletionCheck {
  canDelete: boolean;
  relatedProjects: number;
  relatedQuotes: number;
  relatedInvoices: number;
  relatedInteractions: number;
  relatedOpportunities: number;
}

export function checkClientDeletion(
  clientId: string,
  data: AppData,
): ClientDeletionCheck {
  const relatedProjects = data.projects.filter((p) => p.clientId === clientId).length;
  const relatedQuotes = data.quotes.filter((q) => q.clientId === clientId).length;
  const relatedInvoices = data.invoices.filter((i) => i.clientId === clientId).length;
  const relatedInteractions = data.interactions.filter((i) => i.clientId === clientId).length;
  const relatedOpportunities = data.opportunities.filter((o) => o.clientId === clientId).length;
  return {
    canDelete: relatedProjects === 0 && relatedQuotes === 0 && relatedInvoices === 0,
    relatedProjects,
    relatedQuotes,
    relatedInvoices,
    relatedInteractions,
    relatedOpportunities,
  };
}

export interface ClientFilters {
  search?: string;
  status?: Client["status"] | "all";
  tag?: string;
}

export function filterClients(clients: Client[], filters: ClientFilters): Client[] {
  return clients.filter((c) => {
    if (filters.status && filters.status !== "all" && c.status !== filters.status) {
      return false;
    }
    if (filters.tag && !c.tags.includes(filters.tag)) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      if (q) {
        const primary = getPrimaryContact(c);
        const haystack = [c.name, c.email, primary?.name, primary?.email]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
    }
    return true;
  });
}
