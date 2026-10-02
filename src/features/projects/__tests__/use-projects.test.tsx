import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjects, useProject } from "../use-projects";
import { ProvidersWrapper } from "@/test/render-with-providers";
import type { ProjectFormValues } from "../schema";

const baseValues: ProjectFormValues = {
  clientId: "c-acme",
  name: "New Project",
  description: "",
  billingType: "fixed",
  budgetCents: 200000,
  startDate: "2026-01-01",
  dueDate: "2026-02-01",
};

describe("HU-04.2 Crear proyecto", () => {
  it("adds a new active project", () => {
    const { result } = renderHook(() => useProjects(), { wrapper: ProvidersWrapper });
    const before = result.current.projects.length;

    act(() => {
      result.current.createProject(baseValues);
    });

    expect(result.current.projects).toHaveLength(before + 1);
    expect(result.current.projects.at(-1)).toMatchObject({ name: "New Project", status: "active" });
  });
});

describe("HU-04.3 Ver detalle y editar proyecto", () => {
  it("useProject finds a project by id", () => {
    const { result } = renderHook(() => useProject("p-1"), { wrapper: ProvidersWrapper });
    expect(result.current?.name).toBe("Rediseño web Acme");
  });

  it("updateProject merges the patch into the existing project", () => {
    const { result } = renderHook(() => useProjects(), { wrapper: ProvidersWrapper });

    act(() => {
      result.current.updateProject("p-1", { ...baseValues, clientId: "c-acme", name: "Rediseño web Acme v2" });
    });

    expect(result.current.projects.find((p) => p.id === "p-1")?.name).toBe("Rediseño web Acme v2");
  });

  it("setStatus changes the project status", () => {
    const { result } = renderHook(() => useProjects(), { wrapper: ProvidersWrapper });
    const target = result.current.projects.find((p) => p.id === "p-2")!;

    act(() => {
      result.current.setStatus(target, "paused");
    });

    expect(result.current.projects.find((p) => p.id === "p-2")?.status).toBe("paused");
  });
});

describe("HU-04.4 Eliminar proyecto", () => {
  it("getDeletionCheck blocks deletion when invoices reference the project", () => {
    const { result } = renderHook(() => useProjects(), { wrapper: ProvidersWrapper });
    expect(result.current.getDeletionCheck("p-1").canDelete).toBe(false);
  });

  it("deleteProject removes the project and its deliverables/time entries", () => {
    const { result } = renderHook(() => useProjects(), { wrapper: ProvidersWrapper });
    const target = result.current.projects.find((p) => p.id === "p-4")!;

    act(() => {
      result.current.deleteProject(target);
    });

    expect(result.current.projects.find((p) => p.id === "p-4")).toBeUndefined();
  });
});
