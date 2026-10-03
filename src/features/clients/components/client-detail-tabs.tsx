"use client";

import Link from "next/link";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { getToday } from "@/lib/dates";
import { calculateTotals } from "@/lib/money";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { getProjectProgress } from "@/features/projects/logic";
import { getInvoiceFinancials } from "@/features/invoices/logic";
import { InvoiceStatusBadge } from "@/features/invoices/components/invoice-status-badge";
import { channelKey, sentimentKey } from "@/features/interactions/components/interaction-filters-bar";
import { getClientHealth } from "@/features/ai/logic";

const linkClass =
  "text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
const rowClass = "rounded-xl border border-border bg-surface p-4 text-sm";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ClientHealth({ clientId }: { clientId: string }) {
  const { data } = useData();
  const { t } = useTranslation();
  const { score, label } = getClientHealth(clientId, data, getToday());
  const tone = label === "healthy" ? "success" : label === "attention" ? "warning" : "danger";
  const text = t("clients.healthScore", { label: t(`clients.health${capitalize(label)}`), score });
  return (
    <div>
      <p className="label-eyebrow mb-3">{t("clients.healthTitle")}</p>
      <ProgressBar percent={score} label={text} tone={tone} />
    </div>
  );
}

export function ActivityTab({ clientId }: { clientId: string }) {
  const { data } = useData();
  const { t, formatDate } = useTranslation();
  const items = data.interactions
    .filter((i) => i.clientId === clientId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  return (
    <div className="flex flex-col gap-3">
      <div>
        <Link href={`/interactions?clientId=${clientId}`} className={linkClass}>
          {t("clients.registerInteraction")}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-text-muted">{t("clients.noActivityYet")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className={rowClass}>
              <p className="flex flex-wrap items-center gap-2 text-text-muted">
                <span>{formatDate(i.occurredAt)}</span>
                <span>{t(channelKey(i.channel))}</span>
                <span>{t("interactions.sentimentLabel", { value: t(sentimentKey(i.sentiment)) })}</span>
              </p>
              <p className="text-text">{i.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ProjectsTab({ clientId }: { clientId: string }) {
  const { data } = useData();
  const { t } = useTranslation();
  const projects = data.projects.filter((p) => p.clientId === clientId);
  if (projects.length === 0) return <p className="text-sm text-text-muted">{t("clients.noProjectsYet")}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {projects.map((p) => {
        const progress = getProjectProgress(
          p,
          data.deliverables.filter((d) => d.projectId === p.id),
          data.timeEntries.filter((e) => e.projectId === p.id),
        );
        return (
          <li key={p.id} className={`${rowClass} flex flex-col gap-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link href={`/projects/${p.id}`} className={linkClass}>
                {p.name}
              </Link>
              <span className="flex items-center gap-2">
                {progress.isDelayed ? <StatusBadge label={t("projects.delayedLabel")} tone="danger" /> : null}
                <StatusBadge label={t(`projects.status${capitalize(p.status)}`)} tone="neutral" />
              </span>
            </div>
            <ProgressBar percent={progress.percent} label={t("projects.summaryProgress")} />
          </li>
        );
      })}
    </ul>
  );
}

export function QuotesInvoicesTab({ clientId }: { clientId: string }) {
  const { data } = useData();
  const { t, formatMoney } = useTranslation();
  const quotes = data.quotes.filter((q) => q.clientId === clientId);
  const invoices = data.invoices.filter((i) => i.clientId === clientId);
  if (quotes.length === 0 && invoices.length === 0) {
    return <p className="text-sm text-text-muted">{t("clients.noQuotesInvoicesYet")}</p>;
  }
  const today = getToday();
  return (
    <div className="flex flex-col gap-4">
      {quotes.length > 0 ? (
        <section aria-label={t("clients.quotesHeading")}>
          <h3 className="mb-2 text-sm font-medium text-text">{t("clients.quotesHeading")}</h3>
          <ul className="flex flex-col gap-2">
            {quotes.map((q) => (
              <li key={q.id} className={`${rowClass} flex flex-wrap items-center justify-between gap-2`}>
                <span>
                  {q.number} — {q.title}
                </span>
                <span className="flex items-center gap-3">
                  <StatusBadge label={t(`quotes.status${capitalize(q.status)}`)} tone="neutral" />
                  <span className="text-text">{formatMoney(calculateTotals(q.items, q.taxRate).totalCents)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {invoices.length > 0 ? (
        <section aria-label={t("clients.invoicesHeading")}>
          <h3 className="mb-2 text-sm font-medium text-text">{t("clients.invoicesHeading")}</h3>
          <ul className="flex flex-col gap-2">
            {invoices.map((inv) => {
              const fin = getInvoiceFinancials(inv, data.payments, today);
              return (
                <li key={inv.id} className={`${rowClass} flex flex-wrap items-center justify-between gap-2`}>
                  <Link href={`/invoices/${inv.id}`} className={linkClass}>
                    {inv.number}
                  </Link>
                  <span className="flex items-center gap-3">
                    <InvoiceStatusBadge status={fin.displayStatus} />
                    <span className="text-text">{formatMoney(fin.totalCents)}</span>
                    <span className="text-text-muted">
                      {t("invoices.balanceLabel")}: {formatMoney(fin.balanceCents)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function DocumentsTab({ clientId }: { clientId: string }) {
  const { data } = useData();
  const { t } = useTranslation();
  const documents = data.documents.filter((d) => d.clientId === clientId);
  if (documents.length === 0) return <p className="text-sm text-text-muted">{t("clients.noDocumentsYet")}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {documents.map((d) => (
        <li key={d.id} className={`${rowClass} flex flex-wrap items-center justify-between gap-2`}>
          {d.source.type === "link" ? (
            <a href={d.source.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {d.name}
              <span className="sr-only"> {t("clients.openLinkHint")}</span>
            </a>
          ) : (
            <span>
              {d.name} <span className="text-text-muted">({d.source.fileName})</span>
            </span>
          )}
          <StatusBadge label={t(`documents.kind${capitalize(d.kind)}`)} tone="neutral" />
        </li>
      ))}
    </ul>
  );
}
