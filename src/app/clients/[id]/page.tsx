"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useClients, useClient } from "@/features/clients/use-clients";
import { getPrimaryContact } from "@/features/clients/logic";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { ClientDrawer } from "@/features/clients/components/client-drawer";
import { ActivityTab, ClientHealth, DocumentsTab, ProjectsTab, QuotesInvoicesTab } from "@/features/clients/components/client-detail-tabs";
import { useDisclosure } from "@/hooks/use-disclosure";
import type { ClientFormValues } from "@/features/clients/schema";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { show } = useToast();
  const client = useClient(id);
  const { clients, updateClient } = useClients();
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

  function handleSubmit(values: ClientFormValues) {
    updateClient(activeClient.id, values);
    show({ message: t("clients.saveSuccess") });
    drawer.close();
  }

  return (
    <div>
      <PageHeader
        title={client.name}
        breadcrumbs={[{ label: t("clients.title"), href: "/clients" }, { label: client.name }]}
        actions={<Button onClick={drawer.open}>{t("clients.editAction")}</Button>}
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-white"
              >
                {client.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w.charAt(0).toUpperCase())
                  .join("")}
              </span>
              <StatusBadge
                label={client.status === "active" ? t("clients.filterStatusActive") : t("clients.filterStatusArchived")}
                tone={client.status === "active" ? "success" : "neutral"}
              />
            </div>
          </div>
          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="label-eyebrow">{t("clients.fieldEmail")}</dt>
              <dd className="mt-1 break-words text-text">{client.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="label-eyebrow">{t("clients.fieldPhone")}</dt>
              <dd className="mt-1 text-text">{client.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="label-eyebrow">{t("clients.columnContact")}</dt>
              <dd className="mt-1 text-text">{primary?.name ?? t("clients.noContactsYet")}</dd>
            </div>
            <div>
              <dt className="label-eyebrow">{t("clients.fieldWebsite")}</dt>
              <dd className="mt-1 break-words text-text">{client.website ?? "—"}</dd>
            </div>
          </dl>
          {client.tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span className="label-eyebrow">{t("clients.columnTags")}</span>
              {client.tags.map((tag) => (
                <StatusBadge key={tag} label={tag} tone="neutral" />
              ))}
            </div>
          ) : null}
        </Card>
        <Card>
          <ClientHealth clientId={activeClient.id} />
        </Card>
      </div>

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
        {tab === "activity" ? <ActivityTab clientId={activeClient.id} /> : null}
        {tab === "projects" ? <ProjectsTab clientId={activeClient.id} /> : null}
        {tab === "quotes-invoices" ? <QuotesInvoicesTab clientId={activeClient.id} /> : null}
        {tab === "documents" ? <DocumentsTab clientId={activeClient.id} /> : null}
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
