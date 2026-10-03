"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Project } from "../types";
import { getProjectProgress, groupProjectsByClient } from "../logic";
import { useData } from "@/context/data-context";
import { useTranslation } from "@/context/i18n-context";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card } from "@/components/ui/card";

const statusTone = {
  active: "success",
  paused: "warning",
  completed: "neutral",
  cancelled: "danger",
} as const;

export function ProjectList({ projects }: { projects: Project[] }) {
  const { data } = useData();
  const { t, formatDate, formatNumber } = useTranslation();
  const grouped = groupProjectsByClient(projects);

  return (
    <div className="flex flex-col gap-8">
      {Array.from(grouped.entries()).map(([clientId, clientProjects]) => {
        const client = data.clients.find((c) => c.id === clientId);
        const clientName = client?.name ?? clientId;
        return (
          <section key={clientId} aria-label={clientName}>
            <div className="mb-3 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-xs font-semibold text-link"
              >
                {initials(clientName)}
              </span>
              <h2 className="text-base font-semibold text-text">{clientName}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {clientProjects.map((project) => {
                const deliverables = data.deliverables.filter((d) => d.projectId === project.id);
                const timeEntries = data.timeEntries.filter((t) => t.projectId === project.id);
                const progress = getProjectProgress(project, deliverables, timeEntries);
                const currentMilestone = deliverables.find((d) => d.status !== "delivered");
                return (
                  <Card key={project.id} className="flex flex-col gap-4 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge label={t(`projects.status${capitalize(project.status)}`)} tone={statusTone[project.status]} />
                      {progress.isDelayed ? (
                        <StatusBadge
                          label={t("projects.delayedLabel")}
                          tone="danger"
                          icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
                        />
                      ) : null}
                    </div>
                    <Link
                      href={`/projects/${project.id}`}
                      className="-mt-2 rounded text-base font-semibold text-text underline-offset-2 hover:text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    >
                      {project.name}
                    </Link>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-surface-muted p-3 text-sm">
                      <dt className="text-text-muted">{t("projects.currentMilestone")}</dt>
                      <dd className="text-right font-medium text-text">{currentMilestone ? currentMilestone.title : "—"}</dd>
                      <dt className="text-text-muted">{t("projects.fieldDueDate")}</dt>
                      <dd className={`text-right font-medium ${progress.isDelayed ? "text-danger" : "text-text"}`}>
                        {formatDate(project.dueDate)}
                      </dd>
                    </dl>
                    <ProgressBar
                      percent={progress.percent}
                      label={t("projects.summaryProgress")}
                      tone={progress.isDelayed ? "danger" : "accent"}
                    />
                    <p className="text-sm text-text-muted">
                      {t("projects.hoursLabel", {
                        logged: formatNumber(progress.hoursLogged),
                        estimated: formatNumber(project.estimatedHours ?? 0),
                      })}
                    </p>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
