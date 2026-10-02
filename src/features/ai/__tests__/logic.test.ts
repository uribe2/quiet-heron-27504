import { describe, it, expect, afterEach } from "vitest";
import { createSeedData } from "@/lib/seed";
import { setMockToday, getToday, addDays } from "@/lib/dates";
import { getClientHealth, getHealthLabel, getSuggestedActions, type HealthData } from "../logic";
import type { Invoice } from "@/features/invoices/types";
import type { Interaction } from "@/features/interactions/types";
import type { Deliverable } from "@/features/deliverables/types";

afterEach(() => setMockToday(null));

const TODAY = "2026-06-15";
const base = { createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };

function emptyData(): HealthData {
  return { invoices: [], payments: [], projects: [], deliverables: [], interactions: [] };
}

function recent(clientId: string, sentiment: Interaction["sentiment"] = "positive", daysAgo = 1): Interaction {
  return {
    ...base,
    id: `i-${clientId}-${daysAgo}-${sentiment}`,
    clientId,
    channel: "call",
    occurredAt: `${addDays(TODAY, -daysAgo)}T12:00:00`,
    summary: "x",
    sentiment,
    followUpDone: true,
  };
}

function overdueInvoice(id: string, clientId: string): Invoice {
  return {
    ...base,
    id,
    number: id.toUpperCase(),
    clientId,
    issueDate: addDays(TODAY, -40),
    dueDate: addDays(TODAY, -10),
    items: [{ id: "li", description: "x", quantity: 1, unitPriceCents: 10000 }],
    taxRate: 0,
    status: "sent",
  };
}

function overdueDeliverable(id: string, projectId: string): Deliverable {
  return { ...base, id, projectId, title: id, dueDate: addDays(TODAY, -3), status: "pending", order: 0 };
}

describe("HU-12.1 Ver síntesis ejecutiva y salud de clientes", () => {
  it("returns 100 / healthy for a client with recent positive contact and no problems", () => {
    const data = { ...emptyData(), interactions: [recent("c1")] };
    expect(getClientHealth("c1", data, TODAY)).toEqual({ score: 100, label: "healthy" });
  });

  it("subtracts 25 per overdue invoice and 15 per overdue deliverable", () => {
    const data: HealthData = {
      ...emptyData(),
      interactions: [recent("c1")],
      invoices: [overdueInvoice("inv-a", "c1"), overdueInvoice("inv-b", "c1"), overdueInvoice("inv-other", "c2")],
      projects: [{ id: "p1", clientId: "c1" } as HealthData["projects"][number]],
      deliverables: [overdueDeliverable("d1", "p1")],
    };
    expect(getClientHealth("c1", data, TODAY)).toEqual({ score: 35, label: "critical" });
  });

  it("subtracts 10 when there is no interaction in 14+ days or none at all", () => {
    expect(getClientHealth("c1", { ...emptyData(), interactions: [recent("c1", "positive", 14)] }, TODAY).score).toBe(90);
    expect(getClientHealth("c1", { ...emptyData(), interactions: [recent("c1", "positive", 13)] }, TODAY).score).toBe(100);
    expect(getClientHealth("c1", emptyData(), TODAY).score).toBe(90);
  });

  it("subtracts 10 more when the latest interaction is negative", () => {
    const data = { ...emptyData(), interactions: [recent("c1", "negative", 1), recent("c1", "positive", 5)] };
    expect(getClientHealth("c1", data, TODAY).score).toBe(90);
    const stale = { ...emptyData(), interactions: [recent("c1", "negative", 20)] };
    expect(getClientHealth("c1", stale, TODAY).score).toBe(80);
  });

  it("clamps at 0 and maps labels at the 80 and 50 boundaries", () => {
    const invoices = ["a", "b", "c", "d", "e"].map((s) => overdueInvoice(`inv-${s}`, "c1"));
    expect(getClientHealth("c1", { ...emptyData(), invoices }, TODAY).score).toBe(0);
    expect(getHealthLabel(80)).toBe("healthy");
    expect(getHealthLabel(79)).toBe("attention");
    expect(getHealthLabel(50)).toBe("attention");
    expect(getHealthLabel(49)).toBe("critical");
  });

  it("flags the seeded Wayne Enterprises client as not healthy", () => {
    const data = createSeedData();
    expect(getClientHealth("c-wayne", data, getToday()).label).not.toBe("healthy");
  });
});

describe("HU-12.3 Generar borradores de seguimiento", () => {
  it("derives suggested actions from seed alerts, overdue invoices first", () => {
    const actions = getSuggestedActions(createSeedData(), getToday());
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].kind).toBe("overdueInvoice");
    expect(actions[0].params.number).toBe("FAC-1042");
    expect(actions[0].clientId).toBe("c-wayne");
  });

  it("includes quotes sent more than 7 days ago without answer", () => {
    const actions = getSuggestedActions(createSeedData(), getToday());
    expect(actions.some((a) => a.kind === "unansweredQuote")).toBe(true);
  });

  it("returns no actions for empty data", () => {
    const data = { ...createSeedData(), invoices: [], interactions: [], deliverables: [], quotes: [] };
    expect(getSuggestedActions(data, getToday())).toEqual([]);
  });
});
