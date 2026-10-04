"use client";

import { useTranslation } from "@/context/i18n-context";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDocuments } from "@/features/documents/use-documents";
import { kindLabelKey } from "@/features/documents/components/kind-meta";

export function ProjectDocuments({ projectId }: { projectId: string }) {
  const { t, formatDate } = useTranslation();
  const { documents } = useDocuments();
  const linked = documents.filter((d) => d.projectId === projectId);

  if (linked.length === 0) {
    return <p className="text-sm text-text-muted">{t("projects.noDocumentsYet")}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {linked.map((d) => (
        <li
          key={d.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-text"
        >
          {d.source.type === "link" ? (
            <a
              href={d.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {d.name}
              <span className="sr-only"> {t("projects.openLinkHint")}</span>
            </a>
          ) : (
            <span>
              {d.name} <span className="text-text-muted">({d.source.fileName})</span>
            </span>
          )}
          <span className="flex items-center gap-3">
            <span className="text-xs text-text-muted">{formatDate(d.createdAt.slice(0, 10))}</span>
            <StatusBadge label={t(kindLabelKey(d.kind))} tone="neutral" />
          </span>
        </li>
      ))}
    </ul>
  );
}
