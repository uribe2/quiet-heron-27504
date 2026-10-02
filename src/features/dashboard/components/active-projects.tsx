"use client";

import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { getProjectProgress } from "@/features/projects/logic";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2";

export function ActiveProjects() {
  const { t } = useTranslation();
  const { data } = useData();
  const projects = data.projects
    .filter((p) => p.status === "active")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 2);
  return (
    <section aria-labelledby="dash-projects">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="dash-projects" className="text-base font-semibold text-text">
          {t("dashboard.projectsTitle")}
        </h2>
        <Link href="/projects" className={`text-sm font-medium text-link underline ${focus}`}>
          {t("dashboard.viewProjects")}
        </Link>
      </div>
      {projects.length === 0 ? (
        <EmptyState title={t("dashboard.projectsEmpty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((p) => {
            const progress = getProjectProgress(
              p,
              data.deliverables.filter((d) => d.projectId === p.id),
              data.timeEntries.filter((e) => e.projectId === p.id),
            );
            const client = data.clients.find((c) => c.id === p.clientId)?.name;
            return (
              <li key={p.id}>
                <Card className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/projects/${p.id}`} className={`text-sm font-semibold text-text underline ${focus}`}>
                      {p.name}
                    </Link>
                    {progress.isDelayed ? (
                      <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                        {t("dashboard.delayed")}
                      </span>
                    ) : null}
                  </div>
                  {client ? <p className="text-xs text-text-muted">{client}</p> : null}
                  <ProgressBar percent={progress.percent} tone={progress.isDelayed ? "danger" : "accent"} />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
