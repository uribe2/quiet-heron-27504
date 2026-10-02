import { describe, expect, it } from "vitest";
import { createSeedData } from "@/lib/seed";
import { getToday } from "@/lib/dates";
import { getAlerts, type AlertKind } from "../alerts";

describe("Dashboard — alertas", () => {
  const data = createSeedData();
  const alerts = getAlerts(data, getToday());
  const kinds = alerts.map((a) => a.kind);

  it("includes the overdue invoice with a Cobrar action to its detail", () => {
    const a = alerts.find((x) => x.kind === "overdueInvoice");
    expect(a).toBeDefined();
    expect(a?.params.number).toBe("FAC-1042");
    expect(a?.params.days).toBe(23);
    expect(a?.href).toBe("/invoices/inv-1042");
    expect(a?.actionKey).toBe("dashboard.action.collect");
  });

  it("includes every alert family present in the seed", () => {
    const expected: AlertKind[] = [
      "overdueInvoice",
      "deliverableOverdue",
      "deliverableToday",
      "deliverableTomorrow",
      "delayedProject",
      "followUp",
      "unansweredQuote",
      "inactiveClient",
    ];
    for (const k of expected) expect(kinds).toContain(k);
    expect(alerts.find((x) => x.kind === "inactiveClient")?.params.client).toBe("Stark Industries");
  });

  it("orders alerts by priority", () => {
    const order: AlertKind[] = [
      "overdueInvoice",
      "deliverableOverdue",
      "deliverableToday",
      "deliverableTomorrow",
      "delayedProject",
      "followUp",
      "unansweredQuote",
      "inactiveClient",
    ];
    const indexes = kinds.map((k) => order.indexOf(k));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    expect(kinds[0]).toBe("overdueInvoice");
  });

  it("has unique ids and returns no alerts for empty data", () => {
    expect(new Set(alerts.map((a) => a.id)).size).toBe(alerts.length);
    const empty = getAlerts(
      { clients: [], invoices: [], payments: [], projects: [], deliverables: [], timeEntries: [], interactions: [], quotes: [] },
      getToday(),
    );
    expect(empty).toEqual([]);
  });
});
