"use client";

import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { dateOnly } from "@/lib/dates";
import { kindIcon, kindLabelKey } from "./kind-meta";
import type { DocumentRecord } from "../types";

interface Props {
  documents: DocumentRecord[];
  view: "list" | "grid";
  onOpen: (doc: DocumentRecord) => void;
  onDelete: (doc: DocumentRecord) => void;
}

const openClass =
  "text-left font-medium text-text hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";

export function DocumentList({ documents, view, onOpen, onDelete }: Props) {
  const { data } = useData();
  const { t, formatDate } = useTranslation();

  function meta(doc: DocumentRecord) {
    return {
      client: data.clients.find((c) => c.id === doc.clientId)?.name ?? "—",
      project: data.projects.find((p) => p.id === doc.projectId)?.name ?? "—",
      date: formatDate(dateOnly(doc.createdAt)),
      Icon: kindIcon[doc.kind],
      kind: t(kindLabelKey(doc.kind)),
    };
  }

  if (view === "grid") {
    return (
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => {
          const m = meta(doc);
          return (
            <li key={doc.id}>
              <Card className="flex h-full flex-col gap-2 p-4">
                <span className="flex items-center gap-1 text-sm text-text-muted">
                  <m.Icon className="h-4 w-4" aria-hidden="true" />
                  {m.kind}
                </span>
                <button type="button" className={openClass} onClick={() => onOpen(doc)}>
                  {doc.name}
                </button>
                <p className="text-sm text-text-muted">
                  {m.client} · {m.project}
                </p>
                <p className="text-xs text-text-muted">{m.date}</p>
                <div className="mt-auto flex justify-end">
                  <Button variant="link" onClick={() => onDelete(doc)}>
                    {t("documents.deleteAction")}
                    <span className="sr-only"> {doc.name}</span>
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <Table>
      <TableHead>
        <tr>
          <TableHeaderCell>{t("documents.columnName")}</TableHeaderCell>
          <TableHeaderCell>{t("documents.columnKind")}</TableHeaderCell>
          <TableHeaderCell>{t("documents.columnClient")}</TableHeaderCell>
          <TableHeaderCell>{t("documents.columnProject")}</TableHeaderCell>
          <TableHeaderCell>{t("documents.columnDate")}</TableHeaderCell>
          <TableHeaderCell>{t("common.actions")}</TableHeaderCell>
        </tr>
      </TableHead>
      <TableBody>
        {documents.map((doc) => {
          const m = meta(doc);
          return (
            <TableRow key={doc.id}>
              <TableCell>
                <button type="button" className={openClass} onClick={() => onOpen(doc)}>
                  {doc.name}
                </button>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1">
                  <m.Icon className="h-4 w-4" aria-hidden="true" />
                  {m.kind}
                </span>
              </TableCell>
              <TableCell>{m.client}</TableCell>
              <TableCell>{m.project}</TableCell>
              <TableCell>{m.date}</TableCell>
              <TableCell>
                <Button variant="link" onClick={() => onDelete(doc)}>
                  {t("documents.deleteAction")}
                  <span className="sr-only"> {doc.name}</span>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
