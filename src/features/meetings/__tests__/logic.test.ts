import { describe, it, expect } from "vitest";
import { isUpcoming, groupMeetingsByDay, filterMeetings, findOverlappingMeetings } from "../logic";
import type { Meeting } from "../types";

const now = new Date().toISOString();
function meeting(overrides: Partial<Meeting>): Meeting {
  return {
    id: "m-x",
    createdAt: now,
    updatedAt: now,
    title: "Sync",
    startsAt: "2026-06-01T15:00:00.000Z",
    durationMinutes: 30,
    mode: "video",
    status: "scheduled",
    ...overrides,
  };
}

describe("HU-10.1 Listar reuniones", () => {
  it("isUpcoming compares startsAt against the reference time", () => {
    expect(isUpcoming(meeting({ startsAt: "2030-01-01T00:00:00.000Z" }), "2026-01-01T00:00:00.000Z")).toBe(true);
    expect(isUpcoming(meeting({ startsAt: "2020-01-01T00:00:00.000Z" }), "2026-01-01T00:00:00.000Z")).toBe(false);
  });

  it("groupMeetingsByDay groups and sorts meetings by day", () => {
    const meetings = [
      meeting({ id: "1", startsAt: "2026-06-02T10:00:00.000Z" }),
      meeting({ id: "2", startsAt: "2026-06-01T09:00:00.000Z" }),
      meeting({ id: "3", startsAt: "2026-06-01T15:00:00.000Z" }),
    ];
    const grouped = groupMeetingsByDay(meetings);
    expect(Array.from(grouped.keys())).toEqual(["2026-06-01", "2026-06-02"]);
    expect(grouped.get("2026-06-01")?.map((m) => m.id)).toEqual(["2", "3"]);
  });

  it("filterMeetings filters by client and status", () => {
    const meetings = [
      meeting({ id: "1", clientId: "c-1", status: "scheduled" }),
      meeting({ id: "2", clientId: "c-2", status: "done" }),
    ];
    expect(filterMeetings(meetings, { clientId: "c-1" }).map((m) => m.id)).toEqual(["1"]);
    expect(filterMeetings(meetings, { status: "done" }).map((m) => m.id)).toEqual(["2"]);
  });
});

describe("HU-10.2 Agendar reunión", () => {
  it("findOverlappingMeetings detects meetings whose time ranges intersect", () => {
    const existing = [meeting({ id: "1", startsAt: "2026-06-01T15:00:00.000Z", durationMinutes: 60 })];
    const overlapping = findOverlappingMeetings(existing, "2026-06-01T15:30:00.000Z", 30);
    expect(overlapping.map((m) => m.id)).toEqual(["1"]);
  });

  it("findOverlappingMeetings ignores non-overlapping and cancelled meetings", () => {
    const existing = [
      meeting({ id: "1", startsAt: "2026-06-01T09:00:00.000Z", durationMinutes: 30 }),
      meeting({ id: "2", startsAt: "2026-06-01T15:00:00.000Z", durationMinutes: 30, status: "cancelled" }),
    ];
    const overlapping = findOverlappingMeetings(existing, "2026-06-01T15:00:00.000Z", 30);
    expect(overlapping).toHaveLength(0);
  });
});
