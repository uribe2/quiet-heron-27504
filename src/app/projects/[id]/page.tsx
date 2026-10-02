"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/context/i18n-context";
import { useData } from "@/context/data-context";
import { useProjects, useProject } from "@/features/projects/use-projects";
import { useClients } from "@/features/clients/use-clients";
import { getProjectProgress } from "@/features/projects/logic";
import type { ProjectStatus } from "@/features/projects/types";
import type { ProjectFormValues } from "@/features/projects/schema";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProjectDrawer } from "@/features/projects/components/project-drawer";
import { useDisclosure } from "@/hooks/use-disclosure";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, formatMoney, formatDate } = useTranslation();
  const project = useProject(id);
  const { updateProject, setStatus, deleteProject, getDeletionCheck } = useProjects();
  const { clients } = useClients();
  const { data } = useData();
  const drawer = useDisclosure(false);
  const [tab, setTab] = useState("summary");
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [blocked, setBlocked] = useState(false);

  if (!project) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-text">{t("projects.notFoundTitle")}</h1>
        <p className="text-sm text-text-muted">{t("projects.notFoundBody")}</p>
        <Link href="/projects" className="text-link underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
          {t("projects.backToList")}
        </Link>
      </div>
    );
  }

  const current = project;
  const client = clients.find((c) => c.id === current.clientId);
  const deliverables = data.deliverables.filter((d) => d.projectId === current.id).sort((a, b) => a.order - b.order);
  const timeEntries = data.timeEntries.filter((t) => t.projectId === current.id);
  const progress = getProjectProgress(current, deliverables, timeEntries);

  function handleSubmit(values: ProjectFormValues) {
    updateProject(current.id, values);
    drawer.close();
  }

  function handleStatusChange(next: ProjectStatus) {
    if (next === "completed" && progress.deliveredCount < progress.totalCount) {
      setPendingStatus(next);
      return;
    }
    setStatus(current, next);
  }

  function requestDelete() {
    const check = getDeletionCheck(current.id);
    if (!check.canDelete) {
      setBlocked(true);
      return;
    }
    setDeleteTarget(true);
  }

  function confirmDelete() {
    deleteProject(current);
    router.push("/projects");
  }

  const deletionCheck = getDeletionCheck(current.id);

  return (
    <div>
      <PageHeader
        title={current.name}
        breadcrumbs={[{ label: t("projects.title"), href: "/projects" }, { label: current.name }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={drawer.open}>
              {t("projects.editAction")}
            </Button>
            <Button variant="destructive" onClick={requestDelete}>
              {t("projects.deleteAction")}
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-text-muted">{t("clients.title")}</p>
              <p className="text-text">{client?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-text-muted">
                {current.billingType === "hourly" ? t("projects.summaryHourlyRate") : t("projects.summaryBudget")}
              </p>
              <p className="text-text">
                {formatMoney(current.billingType === "hourly" ? current.hourlyRateCents ?? 0 : current.budgetCents ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-text-muted">{t("projects.summaryHoursLogged")}</p>
              <p className="text-text">{progress.hoursLogged.toFixed(1)}h</p>
            </div>
            <div>
              <p className="text-text-muted">{t("projects.fieldDueDate")}</p>
              <p className="text-text">{formatDate(current.dueDate)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="project-status" className="text-xs font-medium text-text-muted">
              {t("projects.fieldStatus")}
            </label>
            <Select
              id="project-status"
              value={current.status}
              onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
              className="w-40"
            >
              <option value="active">{t("projects.statusActive")}</option>
              <option value="paused">{t("projects.statusPaused")}</option>
              <option value="completed">{t("projects.statusCompleted")}</option>
              <option value="cancelled">{t("projects.statusCancelled")}</option>
            </Select>
          </div>
        </div>
        <div className="mt-4 max-w-sm">
          <ProgressBar percent={progress.percent} label={t("projects.summaryProgress")} />
        </div>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "summary", label: t("projects.detailTabSummary") },
          { value: "deliverables", label: t("projects.detailTabDeliverables") },
          { value: "time", label: t("projects.detailTabTime") },
        ]}
      />

      <div className="py-4">
        {tab === "deliverables" ? (
          deliverables.length === 0 ? (
            <p className="text-sm text-text-muted">{t("projects.noDeliverablesYet")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {deliverables.map((d) => (
                <li key={d.id} className="rounded-lg border border-border p-3 text-sm">
                  {d.title} — {formatDate(d.dueDate)}
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "time" ? (
          timeEntries.length === 0 ? (
            <p className="text-sm text-text-muted">{t("projects.noTimeEntriesYet")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {timeEntries.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-border p-3 text-sm">
                  {entry.description} — {(entry.durationMinutes / 60).toFixed(1)}h
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "summary" ? (
          <p className="text-sm text-text-muted">{current.description || "—"}</p>
        ) : null}
      </div>

      <ProjectDrawer isOpen={drawer.isOpen} onClose={drawer.close} project={current} clients={clients} onSubmit={handleSubmit} />

      <ConfirmDialog
        isOpen={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => pendingStatus && setStatus(current, pendingStatus)}
        title={t("projects.completeConfirmTitle")}
        description={t("projects.completeConfirmBody")}
        confirmLabel={t("projects.completeConfirmConfirm")}
        cancelLabel={t("projects.completeConfirmCancel")}
      />

      <ConfirmDialog
        isOpen={deleteTarget}
        onClose={() => setDeleteTarget(false)}
        onConfirm={confirmDelete}
        title={t("projects.deleteConfirmTitle", { name: current.name })}
        description={t("projects.deleteConfirmBody", {
          deliverables: String(deletionCheck.relatedDeliverables),
          timeEntries: String(deletionCheck.relatedTimeEntries),
        })}
        confirmLabel={t("projects.deleteConfirmConfirm")}
        cancelLabel={t("projects.deleteConfirmCancel")}
        destructive
      />

      <ConfirmDialog
        isOpen={blocked}
        onClose={() => setBlocked(false)}
        onConfirm={() => setBlocked(false)}
        title={t("projects.deleteBlockedTitle", { name: current.name })}
        description={t("projects.deleteBlockedBody")}
        confirmLabel={t("projects.deleteBlockedClose")}
        cancelLabel={t("projects.deleteBlockedClose")}
      />
    </div>
  );
}
