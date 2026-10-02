import { describe, it, expect } from "vitest";
import { dataReducer } from "../data-context";
import { createSeedData } from "@/lib/seed";
import type { Client } from "@/features/clients/types";

function makeTestClient(id: string): Client {
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    name: "New Client",
    type: "company",
    contacts: [],
    tags: [],
    status: "active",
  };
}

describe("dataReducer", () => {
  it("ADD appends an item to the target collection", () => {
    const state = createSeedData();
    const client = makeTestClient("c-new");
    const next = dataReducer(state, { type: "ADD", collection: "clients", item: client });
    expect(next.clients).toHaveLength(state.clients.length + 1);
    expect(next.clients.at(-1)).toEqual(client);
  });

  it("UPDATE merges a patch into the matching item and bumps updatedAt", () => {
    const state = createSeedData();
    const target = state.clients[0];
    const next = dataReducer(state, {
      type: "UPDATE",
      collection: "clients",
      id: target.id,
      patch: { name: "Renamed Co" },
    });
    const updated = next.clients.find((c) => c.id === target.id);
    expect(updated?.name).toBe("Renamed Co");
    expect((updated?.updatedAt ?? "") >= target.updatedAt).toBe(true);
  });

  it("REMOVE filters the item out of the collection", () => {
    const state = createSeedData();
    const target = state.clients[0];
    const next = dataReducer(state, { type: "REMOVE", collection: "clients", id: target.id });
    expect(next.clients.find((c) => c.id === target.id)).toBeUndefined();
  });

  it("RESTORE re-inserts a removed item at the given index", () => {
    const state = createSeedData();
    const target = state.clients[0];
    const afterRemove = dataReducer(state, { type: "REMOVE", collection: "clients", id: target.id });
    const restored = dataReducer(afterRemove, {
      type: "RESTORE",
      collection: "clients",
      item: target,
      index: 0,
    });
    expect(restored.clients[0]).toEqual(target);
    expect(restored.clients).toHaveLength(state.clients.length);
  });

  it("SET_RUNNING_TIMER and UPDATE_SETTINGS update their own slice of state", () => {
    const state = createSeedData();
    const withTimer = dataReducer(state, {
      type: "SET_RUNNING_TIMER",
      timer: { projectId: "p-1", description: "Working", startedAt: new Date().toISOString() },
    });
    expect(withTimer.runningTimer?.projectId).toBe("p-1");

    const withSettings = dataReducer(state, {
      type: "UPDATE_SETTINGS",
      patch: { currency: "COP" },
    });
    expect(withSettings.settings.currency).toBe("COP");
  });

  it("RESET returns fresh seed data", () => {
    const state = createSeedData();
    const mutated = dataReducer(state, { type: "REMOVE", collection: "clients", id: state.clients[0].id });
    const reset = dataReducer(mutated, { type: "RESET" });
    expect(reset.clients).toHaveLength(state.clients.length);
  });
});
