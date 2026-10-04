"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/context/toast-context";
import { useInvoices } from "@/features/invoices/use-invoices";
import { getUnbilledEntries } from "@/features/invoices/logic";
import { BillHoursDialog } from "@/features/invoices/components/bill-hours-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { ProjectDeliverables } from "@/features/deliverables/components/project-deliverables";

const STATUS_KEYS: Record<ProjectStatus, string> = {
  active: "projects.statusActive",
  paused: "projects.statusPaused",
  completed: "projects.statusCompleted",
  cancelled: "projects.statusCancelled",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, formatMoney, formatDate, formatNumber } = useTranslation();
  const project = useProject(id);
  const { updateProject, setStatus, deleteProject, getDeletionCheck } = useProjects();
  const { clients } = useClients();
  const { data } = useData();
  const { show } = useToast();
  const { createFromTimeEntries } = useInvoices();
  const drawer = useDisclosure(false);
  const billDialog = useDisclosure(false);
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
  const unbilled = current.billingType === "hourly" ? getUnbilledEntries(data.timeEntries, current.id) : [];

  function handleBillHours(entryIds: string[]) {
    const invoice = createFromTimeEntries(current.id, entryIds);
    if (!invoice) return;
    show({ message: t("projects.billHoursCreatedToast", { number: invoice.number }) });
    router.push(`/invoices/${invoice.id}`);
  }

  function handleSubmit(values: ProjectFormValues) {
    updateProject(current.id, values);
    show({ message: t("projects.saveSuccess") });
    drawer.close();
  }

  function applyStatus(next: ProjectStatus) {
    setStatus(current, next);
    show({ message: t("projects.statusChangedToast", { status: t(STATUS_KEYS[next]).toLowerCase() }) });
  }

  function handleStatusChange(next: ProjectStatus) {
    if (next === "completed" && progress.deliveredCount < progress.totalCount) {
      setPendingStatus(next);
      return;
    }
    applyStatus(next);
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
            {unbilled.length > 0 ? (
              <Button onClick={billDialog.open}>
                {t("projects.billHoursAction")}
              </Button>
            ) : null}
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
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="label-eyebrow text-text-muted">{t("projects.fieldClient")}</p>
              <p className="mt-1 text-base font-semibold text-text">{client?.name ?? "—"}</p>
            </div>
            <div>
              <p className="label-eyebrow text-text-muted">
                {current.billingType === "hourly" ? t("projects.summaryHourlyRate") : t("projects.summaryBudget")}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-text">
                {formatMoney(current.billingType === "hourly" ? current.hourlyRateCents ?? 0 : current.budgetCents ?? 0)}
              </p>
            </div>
            <div>
              <p className="label-eyebrow text-text-muted">{t("projects.summaryHoursLogged")}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-text">{formatNumber(progress.hoursLogged)} h</p>
            </div>
            <div>
              <p className="label-eyebrow text-text-muted">{t("projects.fieldDueDate")}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-text">{formatDate(current.dueDate)}</p>
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
        <div className="mt-6 border-t border-border pt-4">
          <ProgressBar
            percent={progress.percent}
            label={t("projects.summaryProgress")}
            tone={progress.isDelayed ? "danger" : "accent"}
          />
          {progress.isDelayed ? (
            <p className="mt-2 flex items-center gap-1 text-sm font-medium text-danger">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t("projects.delayedLabel")}
            </p>
          ) : null}
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
        {tab === "deliverables" ? <ProjectDeliverables projectId={current.id} /> : null}

        {tab === "time" ? (
          timeEntries.length === 0 ? (
            <p className="text-sm text-text-muted">{t("projects.noTimeEntriesYet")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {timeEntries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-4 text-sm text-text">
                  <span>
                    <span className="text-text-muted">{formatDate(entry.startedAt)}</span> — {entry.description} —{" "}
                    {formatNumber(entry.durationMinutes / 60)} h
                  </span>
                  {entry.invoiceId ? <StatusBadge label={t("time.invoicedBadge")} tone="success" /> : null}
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "summary" ? (
          <Card>
            <p className="text-sm text-text-muted">{current.description || "—"}</p>
          </Card>
        ) : null}
      </div>

      <BillHoursDialog
        isOpen={billDialog.isOpen}
        onClose={billDialog.close}
        projectName={current.name}
        entries={unbilled}
        onConfirm={handleBillHours}
      />

      <ProjectDrawer isOpen={drawer.isOpen} onClose={drawer.close} project={current} clients={clients} onSubmit={handleSubmit} />

      <ConfirmDialog
        isOpen={pendingStatus !== null}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => pendingStatus && applyStatus(pendingStatus)}
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
