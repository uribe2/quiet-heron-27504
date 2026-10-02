"use client";

import { useMemo, useState } from "react";
import { FileText, LayoutGrid, List } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useDocuments } from "@/features/documents/use-documents";
import { useClients } from "@/features/clients/use-clients";
import { useProjects } from "@/features/projects/use-projects";
import { collectTags, filterDocuments, type DocumentFilters } from "@/features/documents/logic";
import type { DocumentRecord } from "@/features/documents/types";
import type { DocumentFormValues } from "@/features/documents/schema";
import { useDisclosure } from "@/hooks/use-disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentFiltersBar } from "@/features/documents/components/document-filters-bar";
import { DocumentList } from "@/features/documents/components/document-list";
import { DocumentDrawer } from "@/features/documents/components/document-drawer";

export default function DocumentsPage() {
  const { t } = useTranslation();
  const { show } = useToast();
  const { documents, createDocument, updateDocument, deleteDocument } = useDocuments();
  const { clients } = useClients();
  const { projects } = useProjects();
  const drawer = useDisclosure(false);
  const [editing, setEditing] = useState<DocumentRecord | undefined>(undefined);
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [view, setView] = useState<"list" | "grid">("list");

  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const tags = useMemo(() => collectTags(documents), [documents]);
  const filtered = useMemo(() => filterDocuments(documents, filters), [documents, filters]);

  function openCreate() {
    setEditing(undefined);
    drawer.open();
  }

  function openDocument(doc: DocumentRecord) {
    setEditing(doc);
    drawer.open();
  }

  function handleSubmit(values: DocumentFormValues) {
    if (editing) {
      updateDocument(editing.id, values);
    } else {
      createDocument(values);
    }
    show({ message: t("documents.saveSuccess") });
    drawer.close();
  }

  function viewButton(value: "list" | "grid", label: string, Icon: typeof List) {
    return (
      <Button variant={view === value ? "primary" : "secondary"} aria-pressed={view === value} onClick={() => setView(value)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
    );
  }

  return (
    <div>
      <PageHeader title={t("documents.title")} actions={<Button onClick={openCreate}>{t("documents.createButton")}</Button>} />

      {documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8" aria-hidden="true" />}
          title={t("documents.emptyTitle")}
          description={t("documents.emptyDescription")}
          action={<Button onClick={openCreate}>{t("documents.createButton")}</Button>}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <DocumentFiltersBar filters={filters} clients={activeClients} projects={projects} tags={tags} onChange={setFilters} />
            <div role="group" aria-label={t("documents.viewLabel")} className="flex gap-2">
              {viewButton("list", t("documents.viewList"), List)}
              {viewButton("grid", t("documents.viewGrid"), LayoutGrid)}
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" aria-hidden="true" />}
              title={t("documents.emptyFilteredTitle")}
              description={t("documents.emptyFilteredDescription")}
              action={
                <Button variant="secondary" onClick={() => setFilters({})}>
                  {t("documents.clearFilters")}
                </Button>
              }
            />
          ) : (
            <DocumentList documents={filtered} view={view} onOpen={openDocument} onDelete={deleteDocument} />
          )}
        </div>
      )}

      <DocumentDrawer
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        document={editing}
        clients={activeClients}
        projects={projects}
        onSubmit={handleSubmit}
        onDeleteRequest={(d) => {
          deleteDocument(d);
          drawer.close();
        }}
      />
    </div>
  );
}
