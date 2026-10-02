"use client";

import { useData } from "@/context/data-context";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { useTranslation } from "@/context/i18n-context";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import type { DocumentRecord, DocumentSource } from "./types";
import type { DocumentFormValues } from "./schema";

function sharedFields(values: DocumentFormValues) {
  return {
    name: values.name.trim(),
    kind: values.kind,
    clientId: values.clientId || undefined,
    projectId: values.projectId || undefined,
    tags: values.tags,
    description: values.description?.trim() || undefined,
  };
}

function toSource(values: DocumentFormValues): DocumentSource {
  if (values.sourceType === "link") return { type: "link", url: (values.url ?? "").trim() };
  // Only metadata is kept in Cycle 1; file content is never read.
  return {
    type: "file",
    fileName: values.file?.fileName ?? "",
    mimeType: values.file?.mimeType ?? "",
    sizeBytes: values.file?.sizeBytes ?? 0,
  };
}

export function useDocuments() {
  const { data, dispatch } = useData();
  const { deleteWithUndo } = useUndoableDelete();
  const { t } = useTranslation();

  function createDocument(values: DocumentFormValues): DocumentRecord {
    const now = getNowISO();
    const doc: DocumentRecord = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      source: toSource(values),
      ...sharedFields(values),
    };
    dispatch({ type: "ADD", collection: "documents", item: doc });
    return doc;
  }

  function updateDocument(id: string, values: DocumentFormValues) {
    dispatch({
      type: "UPDATE",
      collection: "documents",
      id,
      patch: { ...sharedFields(values), updatedAt: getNowISO() },
    });
  }

  function deleteDocument(doc: DocumentRecord) {
    const index = data.documents.findIndex((d) => d.id === doc.id);
    deleteWithUndo({
      item: doc,
      message: t("documents.deletedToast", { name: doc.name }),
      onDelete: (d) => dispatch({ type: "REMOVE", collection: "documents", id: d.id }),
      onRestore: (d) => dispatch({ type: "RESTORE", collection: "documents", item: d, index: Math.max(index, 0) }),
    });
  }

  return { documents: data.documents, createDocument, updateDocument, deleteDocument };
}
