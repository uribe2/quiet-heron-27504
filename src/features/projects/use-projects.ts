"use client";

import { useData } from "@/context/data-context";
import { generateId } from "@/lib/ids";
import { getNowISO } from "@/lib/dates";
import type { Project, ProjectStatus } from "./types";
import type { ProjectFormValues } from "./schema";
import { checkProjectDeletion, type ProjectDeletionCheck } from "./logic";

function toProjectFields(values: ProjectFormValues) {
  return {
    clientId: values.clientId,
    name: values.name.trim(),
    description: values.description || undefined,
    billingType: values.billingType,
    hourlyRateCents: values.billingType === "hourly" ? values.hourlyRateCents : undefined,
    budgetCents: values.billingType === "fixed" ? values.budgetCents : undefined,
    estimatedHours: values.estimatedHours,
    startDate: values.startDate,
    dueDate: values.dueDate,
  };
}

export function useProjects() {
  const { data, dispatch } = useData();

  function createProject(values: ProjectFormValues): Project {
    const now = getNowISO();
    const project: Project = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      status: "active",
      ...toProjectFields(values),
    };
    dispatch({ type: "ADD", collection: "projects", item: project });
    return project;
  }

  function updateProject(id: string, values: ProjectFormValues) {
    dispatch({ type: "UPDATE", collection: "projects", id, patch: toProjectFields(values) });
  }

  function setStatus(project: Project, status: ProjectStatus) {
    dispatch({ type: "UPDATE", collection: "projects", id: project.id, patch: { status } });
  }

  function getDeletionCheck(projectId: string): ProjectDeletionCheck {
    return checkProjectDeletion(projectId, data);
  }

  function deleteProject(project: Project) {
    data.deliverables
      .filter((d) => d.projectId === project.id)
      .forEach((d) => dispatch({ type: "REMOVE", collection: "deliverables", id: d.id }));
    data.timeEntries
      .filter((t) => t.projectId === project.id)
      .forEach((t) => dispatch({ type: "REMOVE", collection: "timeEntries", id: t.id }));
    dispatch({ type: "REMOVE", collection: "projects", id: project.id });
  }

  return {
    projects: data.projects,
    createProject,
    updateProject,
    setStatus,
    deleteProject,
    getDeletionCheck,
  };
}

export function useProject(id: string): Project | undefined {
  const { data } = useData();
  return data.projects.find((p) => p.id === id);
}
