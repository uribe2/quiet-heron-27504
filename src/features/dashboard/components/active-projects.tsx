"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Calendar, Clock } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getProjectProgress } from "@/features/projects/logic";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";

export function ActiveProjects() {
  const { t, formatDate, formatNumber } = useTranslation();
  const { data } = useData();
  const projects = data.projects
    .filter((p) => p.status === "active")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 2);
  return (
    <section aria-labelledby="dash-projects">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="dash-projects" className="text-xl font-semibold tracking-tight text-text">
          {t("dashboard.projectsTitle")}
        </h2>
        <Link
          href="/projects"
          className={`inline-flex min-h-11 items-center gap-1 rounded-lg text-sm font-medium text-link hover:underline ${focus}`}
        >
          {t("dashboard.viewProjects")}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {projects.length === 0 ? (
        <EmptyState title={t("dashboard.projectsEmpty")} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => {
            const progress = getProjectProgress(
              p,
              data.deliverables.filter((d) => d.projectId === p.id),
              data.timeEntries.filter((e) => e.projectId === p.id),
            );
            const client = data.clients.find((c) => c.id === p.clientId)?.name;
            return (
              <li key={p.id} className="flex flex-col rounded-xl border border-border bg-surface">
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {client ? <p className="label-eyebrow text-text-muted">{client}</p> : <span />}
                    {progress.isDelayed ? (
                      <StatusBadge
                        tone="danger"
                        label={t("dashboard.delayed")}
                        icon={<AlertTriangle size={14} aria-hidden="true" />}
                      />
                    ) : null}
                  </div>
                  <Link
                    href={`/projects/${p.id}`}
                    className={`rounded text-base font-semibold text-text hover:text-link hover:underline ${focus}`}
                  >
                    {p.name}
                  </Link>
                  <ProgressBar
                    percent={progress.percent}
                    ariaLabel={t("dashboard.progressOf", { name: p.name })}
                    tone={progress.isDelayed ? "danger" : "accent"}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-xl border-t border-border bg-surface-muted px-5 py-3 text-sm text-text-muted">
                  <span className={`inline-flex items-center gap-1.5 ${progress.isDelayed ? "text-danger" : ""}`}>
                    <Calendar size={16} aria-hidden="true" />
                    {t("dashboard.dueOn", { date: formatDate(p.dueDate) })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={16} aria-hidden="true" />
                    {t("dashboard.hoursLogged", { hours: formatNumber(progress.hoursLogged) })}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
