"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslation } from "@/context/i18n-context";
import { DocumentForm, DOCUMENT_FORM_ID } from "./document-form";
import { formatFileSize } from "../logic";
import type { DocumentRecord } from "../types";
import type { DocumentFormValues } from "../schema";
import type { Client } from "@/features/clients/types";
import type { Project } from "@/features/projects/types";

interface DocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document?: DocumentRecord;
  clients: Client[];
  projects: Project[];
  onSubmit: (values: DocumentFormValues) => void;
  onDeleteRequest?: (doc: DocumentRecord) => void;
}

export function DocumentDrawer({
  isOpen,
  onClose,
  document: doc,
  clients,
  projects,
  onSubmit,
  onDeleteRequest,
}: DocumentDrawerProps) {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);

  function requestClose() {
    // The native dialog "close" event fires after a programmatic close (e.g. after saving); ignore it.
    if (!isOpen) return;
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      setConfirmingClose(false);
    }
  }, [isOpen]);

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={requestClose}
        title={doc ? t("documents.drawerEditTitle") : t("documents.drawerCreateTitle")}
        closeLabel={t("documents.closeDrawer")}
        breadcrumbs={[{ label: t("documents.title"), href: "/documents" }]}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            {doc && onDeleteRequest ? (
              <Button type="button" variant="destructive" onClick={() => onDeleteRequest(doc)}>
                {t("documents.deleteAction")}
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={requestClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form={DOCUMENT_FORM_ID}>
              {t("common.save")}
            </Button>
          </div>
        }
      >
        {isOpen ? (
          <div className="flex flex-col gap-6">
            {doc ? (
              <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm">
                {doc.source.type === "link" ? (
                  <a
                    href={doc.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {t("documents.openLink")}
                    <span className="sr-only"> {t("documents.opensInNewTab")}</span>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                ) : (
                  <p className="text-text-muted">
                    {doc.source.fileName} · {formatFileSize(doc.source.sizeBytes)} · {t("documents.storageNote")}
                  </p>
                )}
              </div>
            ) : null}
            <DocumentForm
              document={doc}
              clients={clients}
              projects={projects}
              onSubmit={onSubmit}
              onDirtyChange={setIsDirty}
            />
          </div>
        ) : null}
      </Drawer>
      <ConfirmDialog
        isOpen={confirmingClose}
        onClose={() => setConfirmingClose(false)}
        onConfirm={() => {
          setConfirmingClose(false);
          onClose();
        }}
        title={t("clients.discardConfirmTitle")}
        description={t("clients.discardConfirmBody")}
        confirmLabel={t("clients.discardConfirmConfirm")}
        cancelLabel={t("clients.discardConfirmCancel")}
        destructive
      />
    </>
  );
}
