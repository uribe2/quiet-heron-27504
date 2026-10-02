import { describe, it, expect } from "vitest";
import { getProjectProgress, checkProjectDeletion, filterProjects, groupProjectsByClient } from "../logic";
import type { Project } from "../types";
import type { Deliverable } from "@/features/deliverables/types";
import { createSeedData } from "@/lib/seed";
import { setMockToday } from "@/lib/dates";

const now = new Date().toISOString();
function project(overrides: Partial<Project>): Project {
  return {
    id: "p-x",
    createdAt: now,
    updatedAt: now,
    clientId: "c-1",
    name: "Project X",
    billingType: "fixed",
    budgetCents: 100000,
    startDate: "2026-01-01",
    dueDate: "2026-02-01",
    status: "active",
    ...overrides,
  };
}

function deliverable(overrides: Partial<Deliverable>): Deliverable {
  return {
    id: "d-x",
    createdAt: now,
    updatedAt: now,
    projectId: "p-x",
    title: "Milestone",
    dueDate: "2026-01-15",
    status: "pending",
    order: 0,
    ...overrides,
  };
}

describe("HU-04.1 Listar proyectos", () => {
  it("getProjectProgress computes percent from delivered/total deliverables", () => {
    const p = project({});
    const deliverables = [
      deliverable({ id: "1", status: "delivered" }),
      deliverable({ id: "2", status: "pending" }),
    ];
    const progress = getProjectProgress(p, deliverables, []);
    expect(progress.percent).toBe(50);
    expect(progress.deliveredCount).toBe(1);
    expect(progress.totalCount).toBe(2);
  });

  it("getProjectProgress returns 0% when there are no deliverables", () => {
    const progress = getProjectProgress(project({}), [], []);
    expect(progress.percent).toBe(0);
  });

  it("isDelayed is true when the project is active and past its due date", () => {
    setMockToday("2026-03-01");
    const progress = getProjectProgress(project({ dueDate: "2026-02-01", status: "active" }), [], []);
    expect(progress.isDelayed).toBe(true);
    setMockToday(null);
  });

  it("isDelayed is true when any undelivered deliverable is overdue", () => {
    setMockToday("2026-01-20");
    const progress = getProjectProgress(
      project({ dueDate: "2026-06-01" }),
      [deliverable({ dueDate: "2026-01-10", status: "pending" })],
      [],
    );
    expect(progress.isDelayed).toBe(true);
    setMockToday(null);
  });

  it("filterProjects filters by search, status and client", () => {
    const projects = [
      project({ id: "1", name: "Alpha", status: "active", clientId: "c-1" }),
      project({ id: "2", name: "Beta", status: "completed", clientId: "c-2" }),
    ];
    expect(filterProjects(projects, { search: "alpha" }).map((p) => p.id)).toEqual(["1"]);
    expect(filterProjects(projects, { status: "completed" }).map((p) => p.id)).toEqual(["2"]);
    expect(filterProjects(projects, { clientId: "c-2" }).map((p) => p.id)).toEqual(["2"]);
  });

  it("groupProjectsByClient groups projects under their clientId", () => {
    const projects = [project({ id: "1", clientId: "c-1" }), project({ id: "2", clientId: "c-1" }), project({ id: "3", clientId: "c-2" })];
    const grouped = groupProjectsByClient(projects);
    expect(grouped.get("c-1")).toHaveLength(2);
    expect(grouped.get("c-2")).toHaveLength(1);
  });
});

describe("HU-04.4 Eliminar proyecto", () => {
  it("blocks deletion when an invoice references the project", () => {
    const data = createSeedData();
    const check = checkProjectDeletion("p-1", data);
    expect(check.canDelete).toBe(false);
  });

  it("allows deletion and reports related deliverables/time entries otherwise", () => {
    const data = createSeedData();
    const check = checkProjectDeletion("p-4", data);
    expect(check.canDelete).toBe(true);
    expect(check.relatedDeliverables).toBeGreaterThan(0);
  });
});
