import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDeliverables } from "../use-deliverables";
import { useData } from "@/context/data-context";
import { ProvidersWrapper } from "@/test/render-with-providers";
import { setMockToday, getToday } from "@/lib/dates";
import { deliverableSchema, type DeliverableFormValues } from "../schema";
import {
  groupDeliverablesByDue,
  isOverdue,
  filterDeliverables,
  getProjectDeliverables,
  isDueAfterProject,
} from "../logic";
import { getProjectProgress } from "@/features/projects/logic";
import type { Deliverable } from "../types";

afterEach(() => setMockToday(null));

function useBoth() {
  return { del: useDeliverables(), data: useData() };
}

function mk(id: string, dueDate: string, status: Deliverable["status"] = "pending", order = 0): Deliverable {
  return { id, createdAt: "", updatedAt: "", projectId: "p", title: id, dueDate, status, order };
}

const values: DeliverableFormValues = { projectId: "p-4", title: "Nuevo hito", dueDate: "2030-01-01" };

describe("HU-05.1 Listar próximos entregables", () => {
  it("groups into overdue, today, tomorrow, this week and later", () => {
    const g = groupDeliverablesByDue(
      [mk("a", "2026-05-08"), mk("b", "2026-05-10"), mk("c", "2026-05-11"), mk("d", "2026-05-15"), mk("e", "2026-06-30")],
      "2026-05-10",
    );
    expect(g.overdue.map((d) => d.id)).toEqual(["a"]);
    expect(g.today.map((d) => d.id)).toEqual(["b"]);
    expect(g.tomorrow.map((d) => d.id)).toEqual(["c"]);
    expect(g.thisWeek.map((d) => d.id)).toEqual(["d"]);
    expect(g.later.map((d) => d.id)).toEqual(["e"]);
  });

  it("keeps delivered items out of date groups and never marks them overdue", () => {
    const delivered = mk("x", "2026-01-01", "delivered");
    expect(isOverdue(delivered, "2026-05-10")).toBe(false);
    expect(isOverdue(mk("y", "2026-01-01"), "2026-05-10")).toBe(true);
    const g = groupDeliverablesByDue([delivered], "2026-05-10");
    expect(g.overdue).toHaveLength(0);
    expect(g.delivered).toHaveLength(1);
  });

  it("filters by project and status (default hides delivered)", () => {
    const { result } = renderHook(() => useDeliverables(), { wrapper: ProvidersWrapper });
    const all = result.current.deliverables;
    expect(filterDeliverables(all, {}).every((d) => d.status !== "delivered")).toBe(true);
    const p4 = filterDeliverables(all, { projectId: "p-4", status: "all" });
    expect(p4.length).toBeGreaterThan(0);
    expect(p4.every((d) => d.projectId === "p-4")).toBe(true);
    expect(filterDeliverables(all, { status: "delivered" }).every((d) => d.status === "delivered")).toBe(true);
  });

  it("seed has overdue, today and tomorrow items; project view is in milestone order", () => {
    const { result } = renderHook(() => useDeliverables(), { wrapper: ProvidersWrapper });
    const g = groupDeliverablesByDue(result.current.deliverables, getToday());
    expect(g.overdue.map((d) => d.id)).toContain("d-10");
    expect(g.today.map((d) => d.id)).toContain("d-11");
    expect(g.tomorrow.map((d) => d.id)).toContain("d-12");
    const orders = getProjectDeliverables(result.current.deliverables, "p-4").map((d) => d.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});

describe("HU-05.2 Crear entregable", () => {
  it("validates required fields and external URL", () => {
    expect(deliverableSchema.safeParse({ ...values, title: " " }).success).toBe(false);
    expect(deliverableSchema.safeParse({ ...values, projectId: "" }).success).toBe(false);
    expect(deliverableSchema.safeParse({ ...values, externalUrl: "no es url" }).success).toBe(false);
    expect(deliverableSchema.safeParse({ ...values, externalUrl: "https://drive.google.com/x" }).success).toBe(true);
    expect(deliverableSchema.safeParse({ ...values, externalUrl: "" }).success).toBe(true);
  });

  it("warns (without blocking) when due date is after the project due date", () => {
    const { result } = renderHook(() => useData(), { wrapper: ProvidersWrapper });
    const project = result.current.data.projects.find((p) => p.id === "p-4")!;
    expect(isDueAfterProject("2099-01-01", project)).toBe(true);
    expect(isDueAfterProject(project.dueDate, project)).toBe(false);
    expect(deliverableSchema.safeParse({ ...values, dueDate: "2099-01-01" }).success).toBe(true);
  });

  it("appends at the end of the project order and updates progress", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const project = result.current.data.data.projects.find((p) => p.id === "p-4")!;
    const forProject = () => result.current.data.data.deliverables.filter((d) => d.projectId === "p-4");
    const maxBefore = Math.max(...forProject().map((d) => d.order));
    const totalBefore = getProjectProgress(project, forProject(), []).totalCount;
    let created!: Deliverable;
    act(() => {
      created = result.current.del.createDeliverable(values);
    });
    expect(created.order).toBe(maxBefore + 1);
    expect(created.status).toBe("pending");
    expect(forProject().at(-1)?.id).toBe(created.id);
    expect(getProjectProgress(project, forProject(), []).totalCount).toBe(totalBefore + 1);
  });
});

describe("HU-05.3 Editar, reordenar y cambiar estado", () => {
  it("sets deliveredAt when delivered and clears it when moved back", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const find = () => result.current.data.data.deliverables.find((d) => d.id === "d-11")!;
    act(() => result.current.del.setStatus(find(), "delivered"));
    expect(find().status).toBe("delivered");
    expect(find().deliveredAt).toBeTruthy();
    act(() => result.current.del.setStatus(find(), "in_progress"));
    expect(find().status).toBe("in_progress");
    expect(find().deliveredAt).toBeUndefined();
  });

  it("swaps order with moveUp / moveDown within the project", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const get = (id: string) => result.current.data.data.deliverables.find((d) => d.id === id)!;
    act(() => result.current.del.moveDown(get("d-11")));
    expect(get("d-11").order).toBe(1);
    expect(get("d-12").order).toBe(0);
    act(() => result.current.del.moveUp(get("d-11")));
    expect(get("d-11").order).toBe(0);
    act(() => result.current.del.moveUp(get("d-11")));
    expect(get("d-11").order).toBe(0);
  });

  it("edits fields and project progress follows status changes", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const get = (id: string) => result.current.data.data.deliverables.find((d) => d.id === id)!;
    act(() => result.current.del.updateDeliverable("d-11", { ...values, title: "Editado" }));
    expect(get("d-11").title).toBe("Editado");
    const project = result.current.data.data.projects.find((p) => p.id === "p-4")!;
    const progress = () =>
      getProjectProgress(project, result.current.data.data.deliverables.filter((d) => d.projectId === "p-4"), []);
    const before = progress().deliveredCount;
    act(() => result.current.del.setStatus(get("d-11"), "delivered"));
    expect(progress().deliveredCount).toBe(before + 1);
  });
});

describe("HU-05.4 Eliminar entregable", () => {
  it("removes the deliverable and clears deliverableId on linked time entries", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const d = result.current.data.data.deliverables.find((x) => x.id === "d-11")!;
    const linked = result.current.data.data.timeEntries.filter((e) => e.deliverableId === "d-11").map((e) => e.id);
    expect(linked.length).toBeGreaterThan(0);
    act(() => result.current.del.deleteDeliverable(d));
    expect(result.current.data.data.deliverables.some((x) => x.id === "d-11")).toBe(false);
    for (const id of linked) {
      expect(result.current.data.data.timeEntries.find((e) => e.id === id)?.deliverableId).toBeUndefined();
    }
  });

  it("restores deliverable at the same index and relinks time entries (undo)", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const list = () => result.current.data.data.deliverables;
    const index = list().findIndex((x) => x.id === "d-11");
    const d = list()[index];
    const linked = result.current.data.data.timeEntries.filter((e) => e.deliverableId === "d-11").map((e) => e.id);
    act(() => result.current.del.deleteDeliverable(d));
    // replay what the toast undo action dispatches
    act(() => {
      result.current.data.dispatch({ type: "RESTORE", collection: "deliverables", item: d, index });
      for (const id of linked) {
        result.current.data.dispatch({ type: "UPDATE", collection: "timeEntries", id, patch: { deliverableId: "d-11" } });
      }
    });
    expect(list().findIndex((x) => x.id === "d-11")).toBe(index);
    for (const id of linked) {
      expect(result.current.data.data.timeEntries.find((e) => e.id === id)?.deliverableId).toBe("d-11");
    }
  });

  it("recomputes project progress after deleting", () => {
    const { result } = renderHook(() => useBoth(), { wrapper: ProvidersWrapper });
    const project = result.current.data.data.projects.find((p) => p.id === "p-4")!;
    const count = () => result.current.data.data.deliverables.filter((x) => x.projectId === "p-4");
    const before = getProjectProgress(project, count(), []).totalCount;
    act(() => result.current.del.deleteDeliverable(count()[0]));
    expect(getProjectProgress(project, count(), []).totalCount).toBe(before - 1);
  });
});
