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
  const { t } = useTranslation();
  const grouped = groupProjectsByClient(projects);

  return (
    <div className="flex flex-col gap-8">
      {Array.from(grouped.entries()).map(([clientId, clientProjects]) => {
        const client = data.clients.find((c) => c.id === clientId);
        return (
          <div key={clientId}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-muted">
              {client?.name ?? clientId}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {clientProjects.map((project) => {
                const deliverables = data.deliverables.filter((d) => d.projectId === project.id);
                const timeEntries = data.timeEntries.filter((t) => t.projectId === project.id);
                const progress = getProjectProgress(project, deliverables, timeEntries);
                const currentMilestone = deliverables.find((d) => d.status !== "delivered");
                return (
                  <Card key={project.id}>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium text-link underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        {project.name}
                      </Link>
                      <StatusBadge label={t(`projects.status${capitalize(project.status)}`)} tone={statusTone[project.status]} />
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      {currentMilestone ? currentMilestone.title : "—"}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">{project.dueDate}</p>
                    <div className="mt-3">
                      <ProgressBar percent={progress.percent} />
                    </div>
                    <p className="mt-2 text-xs text-text-muted">
                      {t("projects.hoursLabel", {
                        logged: progress.hoursLogged.toFixed(1),
                        estimated: String(project.estimatedHours ?? 0),
                      })}
                    </p>
                    {progress.isDelayed ? (
                      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-danger">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        {t("projects.delayedLabel")}
                      </p>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
