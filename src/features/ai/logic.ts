import { diffInDays, toISODate } from "@/lib/dates";
import type { ISODate } from "@/lib/types";
import type { AppData } from "@/lib/app-data";
import { getInvoiceFinancials } from "@/features/invoices/logic";
import { getDueFollowUps } from "@/features/interactions/logic";
import { isOverdue } from "@/features/deliverables/logic";
import type { ClientHealth } from "./types";

export type HealthData = Pick<AppData, "invoices" | "payments" | "projects" | "deliverables" | "interactions">;

export type HealthLabel = ClientHealth["label"];

export function getHealthLabel(score: number): HealthLabel {
  if (score >= 80) return "healthy";
  if (score >= 50) return "attention";
  return "critical";
}

export function getOverdueInvoicesForClient(clientId: string, data: HealthData, today: ISODate) {
  return data.invoices.filter(
    (i) => i.clientId === clientId && getInvoiceFinancials(i, data.payments, today).displayStatus === "overdue",
  );
}

export function getOverdueDeliverablesForClient(clientId: string, data: HealthData, today: ISODate) {
  const projectIds = new Set(data.projects.filter((p) => p.clientId === clientId).map((p) => p.id));
  return data.deliverables.filter((d) => projectIds.has(d.projectId) && isOverdue(d, today));
}

/** Score per CLAUDE.md section 8: 100, -25 per overdue invoice, -15 per overdue deliverable, -10 stale, -10 negative. */
export function getClientHealth(clientId: string, data: HealthData, today: ISODate): ClientHealth {
  let score = 100;
  score -= 25 * getOverdueInvoicesForClient(clientId, data, today).length;
  score -= 15 * getOverdueDeliverablesForClient(clientId, data, today).length;

  const latest = data.interactions
    .filter((i) => i.clientId === clientId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  if (!latest || diffInDays(today, toISODate(new Date(latest.occurredAt))) >= 14) score -= 10;
  if (latest?.sentiment === "negative") score -= 10;

  score = Math.max(0, Math.min(100, score));
  return { score, label: getHealthLabel(score) };
}

export type SuggestedActionKind = "overdueInvoice" | "followUp" | "overdueDeliverable" | "unansweredQuote";

export interface SuggestedAction {
  id: string;
  kind: SuggestedActionKind;
  clientId: string;
  /** Values for the `ai.action.<kind>` and `ai.actionGoal.<kind>` templates. */
  params: Record<string, string | number>;
}

type ActionData = Pick<
  AppData,
  "clients" | "invoices" | "payments" | "projects" | "deliverables" | "interactions" | "quotes"
>;

/** Actions derived from alerts, in priority order. Reusable by the dashboard. */
export function getSuggestedActions(data: ActionData, today: ISODate): SuggestedAction[] {
  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name ?? "";
  const actions: SuggestedAction[] = [];

  for (const invoice of data.invoices) {
    const f = getInvoiceFinancials(invoice, data.payments, today);
    if (f.displayStatus !== "overdue") continue;
    actions.push({
      id: `inv-${invoice.id}`,
      kind: "overdueInvoice",
      clientId: invoice.clientId,
      params: { number: invoice.number, client: clientName(invoice.clientId), days: diffInDays(today, invoice.dueDate) },
    });
  }

  for (const i of getDueFollowUps(data.interactions, today)) {
    actions.push({ id: `fu-${i.id}`, kind: "followUp", clientId: i.clientId, params: { client: clientName(i.clientId) } });
  }

  for (const d of data.deliverables.filter((x) => isOverdue(x, today))) {
    const project = data.projects.find((p) => p.id === d.projectId);
    if (!project) continue;
    actions.push({
      id: `del-${d.id}`,
      kind: "overdueDeliverable",
      clientId: project.clientId,
      params: { title: d.title, client: clientName(project.clientId) },
    });
  }

  for (const q of data.quotes) {
    if (q.status !== "sent") continue;
    const sentAt = [...q.history].reverse().find((h) => h.action === "sent")?.at ?? q.updatedAt;
    if (diffInDays(today, toISODate(new Date(sentAt))) <= 7) continue;
    actions.push({
      id: `q-${q.id}`,
      kind: "unansweredQuote",
      clientId: q.clientId,
      params: { number: q.number, client: clientName(q.clientId) },
    });
  }

  return actions;
}
