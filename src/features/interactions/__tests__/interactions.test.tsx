import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInteractions } from "../use-interactions";
import { useData } from "@/context/data-context";
import { ProvidersWrapper } from "@/test/render-with-providers";
import { setMockToday } from "@/lib/dates";
import { interactionFormSchema, type InteractionFormValues } from "../schema";
import {
  filterInteractions,
  groupInteractionsByDay,
  getDueFollowUps,
  isValidRescheduleDate,
} from "../logic";
import type { Interaction } from "../types";

afterEach(() => setMockToday(null));

function useAll() {
  return { api: useInteractions(), data: useData() };
}

function make(partial: Partial<Interaction>): Interaction {
  return {
    id: "x",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    clientId: "c-acme",
    channel: "call",
    occurredAt: "2026-01-01T12:00:00.000Z",
    summary: "s",
    sentiment: "neutral",
    followUpDone: false,
    ...partial,
  };
}

const pastLocal = "2020-05-10T10:00";
const valid: InteractionFormValues = {
  clientId: "c-acme",
  channel: "email",
  occurredAt: pastLocal,
  summary: "Hablamos del alcance",
  sentiment: "positive",
};

describe("HU-02.1 Listar historial de comunicaciones", () => {
  it("groups by day with newest day and newest item first", () => {
    const list = [
      make({ id: "a", occurredAt: new Date(2026, 4, 1, 9, 0).toISOString() }),
      make({ id: "b", occurredAt: new Date(2026, 4, 2, 9, 0).toISOString() }),
      make({ id: "c", occurredAt: new Date(2026, 4, 2, 15, 0).toISOString() }),
    ];
    const groups = groupInteractionsByDay(list);
    expect(groups.map((g) => g.day)).toEqual(["2026-05-02", "2026-05-01"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["c", "b"]);
  });

  it("filters by client, channel and sentiment", () => {
    const list = [
      make({ id: "a", clientId: "c1", channel: "call", sentiment: "positive" }),
      make({ id: "b", clientId: "c2", channel: "email", sentiment: "negative" }),
    ];
    expect(filterInteractions(list, { clientId: "c1" }).map((i) => i.id)).toEqual(["a"]);
    expect(filterInteractions(list, { channel: "email" }).map((i) => i.id)).toEqual(["b"]);
    expect(filterInteractions(list, { sentiment: "positive", clientId: "c2" })).toHaveLength(0);
  });

  it("returns everything with empty filters and the seed has interactions", () => {
    const { result } = renderHook(() => useInteractions(), { wrapper: ProvidersWrapper });
    expect(result.current.interactions.length).toBeGreaterThan(0);
    expect(filterInteractions(result.current.interactions, {})).toHaveLength(result.current.interactions.length);
  });
});

describe("HU-02.2 Registrar comunicación", () => {
  it("creates an interaction that appears in the data", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    const before = result.current.data.data.interactions.length;
    act(() => {
      result.current.api.createInteraction(valid);
    });
    const list = result.current.data.data.interactions;
    expect(list).toHaveLength(before + 1);
    expect(list.at(-1)).toMatchObject({ clientId: "c-acme", channel: "email", followUpDone: false });
  });

  it("rejects future dates and empty or too long summaries", () => {
    const future = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16);
    expect(interactionFormSchema.safeParse({ ...valid, occurredAt: future }).success).toBe(false);
    expect(interactionFormSchema.safeParse({ ...valid, summary: "   " }).success).toBe(false);
    expect(interactionFormSchema.safeParse({ ...valid, summary: "a".repeat(501) }).success).toBe(false);
    expect(interactionFormSchema.safeParse({ ...valid, summary: "a".repeat(500) }).success).toBe(true);
  });

  it("requires follow-up date >= interaction date", () => {
    expect(interactionFormSchema.safeParse({ ...valid, followUpDate: "2020-05-09" }).success).toBe(false);
    expect(interactionFormSchema.safeParse({ ...valid, followUpDate: "2020-05-10" }).success).toBe(true);
    expect(interactionFormSchema.safeParse({ ...valid, followUpDate: "" }).success).toBe(true);
  });
});

describe("HU-02.3 Editar y eliminar comunicación", () => {
  it("updates an interaction", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    act(() => {
      result.current.api.updateInteraction("i-1", { ...valid, summary: "Editado" });
    });
    expect(result.current.data.data.interactions.find((i) => i.id === "i-1")).toMatchObject({
      summary: "Editado",
      channel: "email",
    });
  });

  it("deletes immediately", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    const target = result.current.data.data.interactions.find((i) => i.id === "i-3")!;
    act(() => {
      result.current.api.deleteInteraction(target);
    });
    expect(result.current.data.data.interactions.some((i) => i.id === "i-3")).toBe(false);
  });

  it("restores at the same position with original data", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    const original = result.current.data.data.interactions;
    const index = original.findIndex((i) => i.id === "i-3");
    const target = original[index];
    act(() => {
      result.current.api.deleteInteraction(target);
    });
    act(() => {
      result.current.api.restoreInteraction(target, index);
    });
    const after = result.current.data.data.interactions;
    expect(after.findIndex((i) => i.id === "i-3")).toBe(index);
    expect(after[index]).toEqual(target);
    expect(after).toHaveLength(original.length);
  });
});

describe("HU-02.4 Gestionar seguimientos", () => {
  it("getDueFollowUps returns date <= today, not done, sorted by date", () => {
    const list = [
      make({ id: "a", followUpDate: "2026-06-10" }),
      make({ id: "b", followUpDate: "2026-06-01" }),
      make({ id: "c", followUpDate: "2026-06-20" }),
      make({ id: "d", followUpDate: "2026-06-02", followUpDone: true }),
      make({ id: "e" }),
    ];
    expect(getDueFollowUps(list, "2026-06-10").map((i) => i.id)).toEqual(["b", "a"]);
  });

  it("marks a follow-up as done", () => {
    setMockToday("2026-06-10");
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    act(() => {
      result.current.api.completeFollowUp("i-2");
    });
    expect(result.current.data.data.interactions.find((i) => i.id === "i-2")?.followUpDone).toBe(true);
  });

  it("reschedules a follow-up to a new valid date and rejects earlier dates", () => {
    const { result } = renderHook(() => useAll(), { wrapper: ProvidersWrapper });
    const item = result.current.data.data.interactions.find((i) => i.id === "i-5")!;
    expect(isValidRescheduleDate(item, "")).toBe(false);
    expect(isValidRescheduleDate(item, "2000-01-01")).toBe(false);
    act(() => {
      result.current.api.rescheduleFollowUp("i-5", "2099-01-01");
    });
    const updated = result.current.data.data.interactions.find((i) => i.id === "i-5")!;
    expect(updated.followUpDate).toBe("2099-01-01");
    expect(updated.followUpDone).toBe(false);
  });
});
