"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { useClients, useClient } from "@/features/clients/use-clients";
import { getPrimaryContact } from "@/features/clients/logic";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClientDrawer } from "@/features/clients/components/client-drawer";
import { useDisclosure } from "@/hooks/use-disclosure";
import type { ClientFormValues } from "@/features/clients/schema";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, formatDate } = useTranslation();
  const client = useClient(id);
  const { clients, updateClient } = useClients();
  const { data } = useData();
  const drawer = useDisclosure(false);
  const [tab, setTab] = useState("activity");

  if (!client) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-text">{t("clients.notFoundTitle")}</h1>
        <p className="text-sm text-text-muted">{t("clients.notFoundBody")}</p>
        <Link href="/clients" className="text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {t("clients.backToList")}
        </Link>
      </div>
    );
  }

  const activeClient = client;
  const primary = getPrimaryContact(activeClient);
  const interactions = data.interactions.filter((i) => i.clientId === activeClient.id);
  const projects = data.projects.filter((p) => p.clientId === activeClient.id);
  const quotes = data.quotes.filter((q) => q.clientId === activeClient.id);
  const invoices = data.invoices.filter((i) => i.clientId === activeClient.id);
  const documents = data.documents.filter((d) => d.clientId === activeClient.id);

  function handleSubmit(values: ClientFormValues) {
    updateClient(activeClient.id, values);
    drawer.close();
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        breadcrumbs={[{ label: t("clients.title"), href: "/clients" }, { label: client.name }]}
        actions={<Button onClick={drawer.open}>{t("clients.editAction")}</Button>}
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-text-muted">{t("clients.fieldEmail")}</p>
              <p className="text-text">{client.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-text-muted">{t("clients.fieldPhone")}</p>
              <p className="text-text">{client.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-text-muted">{t("clients.columnContact")}</p>
              <p className="text-text">{primary?.name ?? t("clients.noContactsYet")}</p>
            </div>
          </div>
          <StatusBadge
            label={client.status === "active" ? t("clients.filterStatusActive") : t("clients.filterStatusArchived")}
            tone={client.status === "active" ? "success" : "neutral"}
          />
        </div>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "activity", label: t("clients.detailTabActivity") },
          { value: "projects", label: t("clients.detailTabProjects") },
          { value: "quotes-invoices", label: t("clients.detailTabQuotesInvoices") },
          { value: "documents", label: t("clients.detailTabDocuments") },
        ]}
      />

      <div className="py-4">
        {tab === "activity" ? (
          interactions.length === 0 ? (
            <p className="text-sm text-text-muted">{t("clients.noActivityYet")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {interactions.map((i) => (
                <li key={i.id} className="rounded-lg border border-border p-3 text-sm">
                  <span className="text-text-muted">{formatDate(i.occurredAt)}</span> — {i.summary}
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "projects" ? (
          projects.length === 0 ? (
            <p className="text-sm text-text-muted">{t("clients.noProjectsYet")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {projects.map((p) => (
                <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
                  <Link href={`/projects/${p.id}`} className="text-link underline-offset-2 hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "quotes-invoices" ? (
          quotes.length === 0 && invoices.length === 0 ? (
            <p className="text-sm text-text-muted">{t("clients.noQuotesInvoicesYet")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {quotes.map((q) => (
                <li key={q.id} className="rounded-lg border border-border p-3 text-sm">
                  {q.number} — {q.title}
                </li>
              ))}
              {invoices.map((inv) => (
                <li key={inv.id} className="rounded-lg border border-border p-3 text-sm">
                  <Link href={`/invoices/${inv.id}`} className="text-link underline-offset-2 hover:underline">
                    {inv.number}
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "documents" ? (
          documents.length === 0 ? (
            <p className="text-sm text-text-muted">{t("clients.noDocumentsYet")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {documents.map((d) => (
                <li key={d.id} className="rounded-lg border border-border p-3 text-sm">
                  {d.name}
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>

      <ClientDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        client={client}
        existingClients={clients}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
