"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
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
        <ClientHealth clientId={activeClient.id} />
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
