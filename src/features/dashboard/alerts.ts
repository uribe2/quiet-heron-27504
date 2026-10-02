import type { AppData } from "@/lib/app-data";
import { diffInDays, toISODate } from "@/lib/dates";
import type { ISODate } from "@/lib/types";
import { getInvoiceFinancials } from "@/features/invoices/logic";
import { groupDeliverablesByDue } from "@/features/deliverables/logic";
import { getProjectProgress } from "@/features/projects/logic";
import { getDueFollowUps } from "@/features/interactions/logic";
import { isQuoteUnanswered } from "@/features/quotes/logic";

export type AlertKind =
  | "overdueInvoice"
  | "deliverableOverdue"
  | "deliverableToday"
  | "deliverableTomorrow"
  | "delayedProject"
  | "followUp"
  | "unansweredQuote"
  | "inactiveClient";

export type AlertSeverity = "danger" | "warning" | "info";

export interface DashboardAlert {
  id: string;
  kind: AlertKind;
  severity: AlertSeverity;
  /** Values for the `dashboard.alert.<kind>` template. */
  params: Record<string, string | number>;
  href: string;
  /** Key of the action label, e.g. `dashboard.action.collect`. */
  actionKey: string;
}

export type AlertData = Pick<
  AppData,
  "clients" | "invoices" | "payments" | "projects" | "deliverables" | "timeEntries" | "interactions" | "quotes"
>;

const INACTIVE_DAYS = 30;

/** Alerts in priority order (CLAUDE.md section 7). */
export function getAlerts(data: AlertData, today: ISODate): DashboardAlert[] {
  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "";
  const alerts: DashboardAlert[] = [];

  for (const invoice of data.invoices) {
    const f = getInvoiceFinancials(invoice, data.payments, today);
    if (f.displayStatus !== "overdue") continue;
    alerts.push({
      id: `inv-${invoice.id}`,
      kind: "overdueInvoice",
      severity: "danger",
      params: { number: invoice.number, client: clientName(invoice.clientId), days: diffInDays(today, invoice.dueDate) },
      href: `/invoices/${invoice.id}`,
      actionKey: "dashboard.action.collect",
    });
  }

  const groups = groupDeliverablesByDue(data.deliverables, today);
  const delivKinds: [AlertKind, AlertSeverity, typeof groups.overdue][] = [
    ["deliverableOverdue", "danger", groups.overdue],
    ["deliverableToday", "warning", groups.today],
    ["deliverableTomorrow", "info", groups.tomorrow],
  ];
  for (const [kind, severity, list] of delivKinds) {
    for (const d of list) {
      const project = data.projects.find((p) => p.id === d.projectId);
      alerts.push({
        id: `del-${d.id}`,
        kind,
        severity,
        params: { title: d.title, project: project?.name ?? "" },
        href: "/deliverables",
        actionKey: "dashboard.action.open",
      });
    }
  }

  for (const project of data.projects) {
    if (project.status !== "active") continue;
    const progress = getProjectProgress(
      project,
      data.deliverables.filter((d) => d.projectId === project.id),
      data.timeEntries.filter((e) => e.projectId === project.id),
    );
    if (!progress.isDelayed) continue;
    alerts.push({
      id: `prj-${project.id}`,
      kind: "delayedProject",
      severity: "warning",
      params: { name: project.name },
      href: `/projects/${project.id}`,
      actionKey: "dashboard.action.open",
    });
  }

  for (const i of getDueFollowUps(data.interactions, today)) {
    alerts.push({
      id: `fu-${i.id}`,
      kind: "followUp",
      severity: "warning",
      params: { client: clientName(i.clientId) },
      href: "/interactions",
      actionKey: "dashboard.action.open",
    });
  }

  for (const q of data.quotes) {
    if (!isQuoteUnanswered(q, today)) continue;
    alerts.push({
      id: `q-${q.id}`,
      kind: "unansweredQuote",
      severity: "info",
      params: { number: q.number, client: clientName(q.clientId) },
      href: "/quotes",
      actionKey: "dashboard.action.open",
    });
  }

  for (const client of data.clients) {
    if (client.status !== "active") continue;
    const dates = data.interactions
      .filter((i) => i.clientId === client.id)
      .map((i) => toISODate(new Date(i.occurredAt)))
      .sort();
    const last = dates[dates.length - 1];
    if (!last) continue;
    const days = diffInDays(today, last);
    if (days < INACTIVE_DAYS) continue;
    alerts.push({
      id: `cli-${client.id}`,
      kind: "inactiveClient",
      severity: "info",
      params: { client: client.name, days },
      href: `/clients/${client.id}`,
      actionKey: "dashboard.action.open",
    });
  }

  return alerts;
}
