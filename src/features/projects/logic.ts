import type { AppData } from "@/lib/app-data";
import { isBeforeToday } from "@/lib/dates";
import type { Project, ProjectStatus } from "./types";
import type { Deliverable } from "@/features/deliverables/types";
import type { TimeEntry } from "@/features/time/types";

export interface ProjectProgress {
  percent: number;
  deliveredCount: number;
  totalCount: number;
  hoursLogged: number;
  isDelayed: boolean;
}

export function getProjectProgress(
  project: Project,
  deliverables: Deliverable[],
  timeEntries: TimeEntry[],
): ProjectProgress {
  const totalCount = deliverables.length;
  const deliveredCount = deliverables.filter((d) => d.status === "delivered").length;
  const percent = totalCount === 0 ? 0 : Math.round((deliveredCount / totalCount) * 100);
  const hoursLogged = timeEntries.reduce((sum, t) => sum + t.durationMinutes, 0) / 60;
  const hasOverdueDeliverable = deliverables.some(
    (d) => d.status !== "delivered" && isBeforeToday(d.dueDate),
  );
  const isDelayed =
    (project.status === "active" && isBeforeToday(project.dueDate)) || hasOverdueDeliverable;

  return { percent, deliveredCount, totalCount, hoursLogged, isDelayed };
}

export interface ProjectDeletionCheck {
  canDelete: boolean;
  relatedDeliverables: number;
  relatedTimeEntries: number;
  relatedInvoices: number;
}

export function checkProjectDeletion(projectId: string, data: AppData): ProjectDeletionCheck {
  const relatedDeliverables = data.deliverables.filter((d) => d.projectId === projectId).length;
  const relatedTimeEntries = data.timeEntries.filter((t) => t.projectId === projectId).length;
  const relatedInvoices = data.invoices.filter((i) => i.projectId === projectId).length;
  return {
    canDelete: relatedInvoices === 0,
    relatedDeliverables,
    relatedTimeEntries,
    relatedInvoices,
  };
}

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | "all";
  clientId?: string;
}

export function filterProjects(projects: Project[], filters: ProjectFilters): Project[] {
  return projects.filter((p) => {
    if (filters.status && filters.status !== "all" && p.status !== filters.status) return false;
    if (filters.clientId && p.clientId !== filters.clientId) return false;
    if (filters.search) {
      const q = filters.search.trim().toLowerCase();
      if (q && !p.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export function groupProjectsByClient(projects: Project[]): Map<string, Project[]> {
  const map = new Map<string, Project[]>();
  for (const project of projects) {
    const list = map.get(project.clientId) ?? [];
    list.push(project);
    map.set(project.clientId, list);
  }
  return map;
}
