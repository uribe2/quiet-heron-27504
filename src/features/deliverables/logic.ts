import { addDays, diffInDays, getToday } from "@/lib/dates";
import type { Deliverable, DeliverableStatus } from "./types";
import type { Project } from "@/features/projects/types";

export type DeliverableGroupKey = "overdue" | "today" | "tomorrow" | "thisWeek" | "later";

export interface DeliverableGroups {
  overdue: Deliverable[];
  today: Deliverable[];
  tomorrow: Deliverable[];
  thisWeek: Deliverable[];
  later: Deliverable[];
  /** Delivered items are kept out of the date groups. */
  delivered: Deliverable[];
}

export const GROUP_ORDER: DeliverableGroupKey[] = ["overdue", "today", "tomorrow", "thisWeek", "later"];

export function isOverdue(d: Deliverable, today: string = getToday()): boolean {
  return d.status !== "delivered" && d.dueDate < today;
}

function byDueThenOrder(a: Deliverable, b: Deliverable): number {
  return a.dueDate.localeCompare(b.dueDate) || a.order - b.order;
}

export function groupDeliverablesByDue(deliverables: Deliverable[], today: string = getToday()): DeliverableGroups {
  const groups: DeliverableGroups = { overdue: [], today: [], tomorrow: [], thisWeek: [], later: [], delivered: [] };
  for (const d of deliverables) {
    if (d.status === "delivered") {
      groups.delivered.push(d);
      continue;
    }
    const diff = diffInDays(d.dueDate, today);
    if (diff < 0) groups.overdue.push(d);
    else if (diff === 0) groups.today.push(d);
    else if (diff === 1) groups.tomorrow.push(d);
    else if (d.dueDate <= addDays(today, 7)) groups.thisWeek.push(d);
    else groups.later.push(d);
  }
  for (const key of Object.keys(groups) as (keyof DeliverableGroups)[]) groups[key].sort(byDueThenOrder);
  return groups;
}

export interface DeliverableFilters {
  projectId?: string;
  /** "active" = pending + in progress (default view). */
  status?: DeliverableStatus | "active" | "all";
}

export function filterDeliverables(deliverables: Deliverable[], filters: DeliverableFilters): Deliverable[] {
  const status = filters.status ?? "active";
  return deliverables.filter((d) => {
    if (filters.projectId && d.projectId !== filters.projectId) return false;
    if (status === "active") return d.status !== "delivered";
    if (status !== "all" && d.status !== status) return false;
    return true;
  });
}

export function getProjectDeliverables(deliverables: Deliverable[], projectId: string): Deliverable[] {
  return deliverables.filter((d) => d.projectId === projectId).sort((a, b) => a.order - b.order);
}

export function nextOrder(deliverables: Deliverable[], projectId: string): number {
  const orders = deliverables.filter((d) => d.projectId === projectId).map((d) => d.order);
  return orders.length === 0 ? 0 : Math.max(...orders) + 1;
}

export function isDueAfterProject(dueDate: string, project?: Project): boolean {
  return Boolean(project && dueDate && dueDate > project.dueDate);
}

/** Returns the neighbour to swap `order` with, or undefined at the edges. */
export function getSwapTarget(
  deliverables: Deliverable[],
  deliverable: Deliverable,
  direction: "up" | "down",
): Deliverable | undefined {
  const siblings = getProjectDeliverables(deliverables, deliverable.projectId);
  const index = siblings.findIndex((d) => d.id === deliverable.id);
  return siblings[direction === "up" ? index - 1 : index + 1];
}
