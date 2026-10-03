"use client";

import Link from "next/link";
import { Archive, Trash2, Pencil } from "lucide-react";
import type { Client } from "../types";
import { getPrimaryContact } from "../logic";
import { useTranslation } from "@/context/i18n-context";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconButton } from "@/components/ui/icon-button";

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onArchive: (client: Client) => void;
  onDeleteRequest: (client: Client) => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export function ClientTable({ clients, onEdit, onArchive, onDeleteRequest }: ClientTableProps) {
  const { t } = useTranslation();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>{t("clients.columnName")}</TableHeaderCell>
          <TableHeaderCell>{t("clients.columnContact")}</TableHeaderCell>
          <TableHeaderCell>{t("clients.columnEmail")}</TableHeaderCell>
          <TableHeaderCell>{t("clients.columnTags")}</TableHeaderCell>
          <TableHeaderCell>{t("clients.columnStatus")}</TableHeaderCell>
          <TableHeaderCell>
            <span className="sr-only">{t("clients.columnActions")}</span>
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {clients.map((client) => {
          const primary = getPrimaryContact(client);
          return (
            <TableRow key={client.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-accent"
                  >
                    {initials(client.name)}
                  </span>
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {client.name}
                  </Link>
                </div>
              </TableCell>
              <TableCell className="text-text-muted">{primary?.name ?? "—"}</TableCell>
              <TableCell className="text-text-muted">{client.email ?? "—"}</TableCell>
              <TableCell>
                {client.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {client.tags.map((tag) => (
                      <StatusBadge key={tag} label={tag} tone="neutral" />
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <StatusBadge
                  label={client.status === "active" ? t("clients.filterStatusActive") : t("clients.filterStatusArchived")}
                  tone={client.status === "active" ? "success" : "neutral"}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <IconButton aria-label={`${t("clients.editAction")} ${client.name}`} onClick={() => onEdit(client)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton aria-label={`${t("clients.archiveAction")} ${client.name}`} onClick={() => onArchive(client)}>
                    <Archive className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                  <IconButton aria-label={`${t("clients.deleteAction")} ${client.name}`} onClick={() => onDeleteRequest(client)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
