import type { Client } from "@/features/clients/types";
import type { Project } from "@/features/projects/types";
import { getToday, getNowISO, addDays } from "@/lib/dates";

let counter = 0;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export function makeClient(overrides: Partial<Client> = {}): Client {
  const now = getNowISO();
  return {
    id: nextId("client"),
    createdAt: now,
    updatedAt: now,
    name: "Test Client",
    type: "company",
    contacts: [],
    tags: [],
    status: "active",
    ...overrides,
  };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
  const now = getNowISO();
  const today = getToday();
  return {
    id: nextId("project"),
    createdAt: now,
    updatedAt: now,
    clientId: "client-1",
    name: "Test Project",
    billingType: "fixed",
    budgetCents: 100000,
    startDate: today,
    dueDate: addDays(today, 30),
    status: "active",
    ...overrides,
  };
}
