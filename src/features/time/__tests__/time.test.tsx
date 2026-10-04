import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTimeEntries } from "../use-time-entries";
import { useData } from "@/context/data-context";
import { ProvidersWrapper } from "@/test/render-with-providers";
import {
  durationMinutes,
  filterEntries,
  getBillableHoursThisWeek,
  groupEntriesByDay,
  summarize,
  validateManualEntry,
  weekRange,
} from "../logic";
import { getToday, addDays } from "@/lib/dates";
import type { TimeEntryFormValues } from "../schema";

function useTest() {
  return { time: useTimeEntries(), data: useData() };
}

function render() {
  return renderHook(() => useTest(), { wrapper: ProvidersWrapper });
}

const values: TimeEntryFormValues = {
  projectId: "p-2",
  deliverableId: "",
  date: addDays(getToday(), -1),
  startTime: "09:00",
  endTime: "11:30",
  description: "Manual work",
  billable: true,
};

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("HU-06.1 Usar el cronómetro", () => {
  it("starts a timer stored in the data context and rejects a second one", () => {
    const { result } = render();
    let first = false;
    let second = true;
    act(() => {
      first = result.current.time.startTimer("p-2", "Work", "d-4");
    });
    expect(first).toBe(true);
    expect(result.current.data.data.runningTimer).toMatchObject({ projectId: "p-2", deliverableId: "d-4" });
    act(() => {
      second = result.current.time.startTimer("p-4", "Other");
    });
    expect(second).toBe(false);
    expect(result.current.data.data.runningTimer?.projectId).toBe("p-2");
  });

  it("stops the timer, saving an entry with rounded minutes and billable default", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T10:00:00.000Z"));
    const { result } = render();
    act(() => {
      result.current.time.startTimer("p-2", "Work");
    });
    vi.setSystemTime(new Date("2026-03-10T10:25:40.000Z"));
    const before = result.current.time.entries.length;
    act(() => {
      result.current.time.stopTimer();
    });
    expect(result.current.data.data.runningTimer).toBeNull();
    expect(result.current.time.entries).toHaveLength(before + 1);
    expect(result.current.time.entries.at(-1)).toMatchObject({ durationMinutes: 26, billable: true, projectId: "p-2" });
  });

  it("enforces a minimum of 1 minute", () => {
    const { result } = render();
    act(() => {
      result.current.time.startTimer("p-2", "Quick");
    });
    act(() => {
      result.current.time.stopTimer();
    });
    expect(result.current.time.entries.at(-1)?.durationMinutes).toBe(1);
  });

  it("discards the timer without creating an entry", () => {
    const { result } = render();
    const before = result.current.time.entries.length;
    act(() => {
      result.current.time.startTimer("p-2", "Work");
    });
    act(() => {
      result.current.time.discardTimer();
    });
    expect(result.current.data.data.runningTimer).toBeNull();
    expect(result.current.time.entries).toHaveLength(before);
  });
});

describe("HU-06.2 Registrar tiempo manualmente", () => {
  it("creates an entry with computed duration and billable flag", () => {
    const { result } = render();
    const before = result.current.time.entries.length;
    act(() => {
      result.current.time.createEntry(values);
    });
    expect(result.current.time.entries).toHaveLength(before + 1);
    expect(result.current.time.entries.at(-1)).toMatchObject({ durationMinutes: 150, billable: true });
  });

  it("rejects end before start and future end", () => {
    expect(validateManualEntry({ date: "2020-01-01", startTime: "10:00", endTime: "09:00" })).toBe("endAfterStart");
    expect(validateManualEntry({ date: "2020-01-01", startTime: "10:00", endTime: "10:00" })).toBe("endAfterStart");
    expect(validateManualEntry({ date: addDays(getToday(), 2), startTime: "09:00", endTime: "10:00" })).toBe(
      "dateNotFuture",
    );
    expect(validateManualEntry({ date: "2020-01-01", startTime: "09:00", endTime: "10:00" })).toBeNull();
  });

  it("computes durations and rejects more than 24 hours", () => {
    expect(durationMinutes("2026-01-01T09:00:00.000Z", "2026-01-01T10:30:00.000Z")).toBe(90);
    expect(validateManualEntry({ date: "2020-01-01", startTime: "", endTime: "10:00" })).toBe("required");
    // Same-day entries cannot exceed 24h; 00:00-23:59 is valid
    expect(validateManualEntry({ date: "2020-01-01", startTime: "00:00", endTime: "23:59" })).toBeNull();
  });
});

describe("HU-06.3 Listar y filtrar registros", () => {
  it("weekRange returns Monday to Sunday", () => {
    expect(weekRange("2026-03-11")).toEqual({ from: "2026-03-09", to: "2026-03-15" });
    expect(weekRange("2026-03-15")).toEqual({ from: "2026-03-09", to: "2026-03-15" });
    expect(weekRange("2026-03-09")).toEqual({ from: "2026-03-09", to: "2026-03-15" });
  });

  it("groups by day with daily totals, newest day first", () => {
    const { result } = render();
    const groups = groupEntriesByDay(result.current.time.entries);
    expect(groups.length).toBeGreaterThan(1);
    for (let i = 1; i < groups.length; i++) expect(groups[i - 1].date >= groups[i].date).toBe(true);
    for (const g of groups) {
      expect(g.totalMinutes).toBe(g.entries.reduce((s, e) => s + e.durationMinutes, 0));
    }
  });

  it("filters by project, billable, invoiced and date range", () => {
    const { result } = render();
    const all = result.current.time.entries;
    expect(filterEntries(all, { projectId: "p-2" }).every((e) => e.projectId === "p-2")).toBe(true);
    expect(filterEntries(all, { billable: "no" }).every((e) => !e.billable)).toBe(true);
    expect(filterEntries(all, { invoiced: "yes" }).map((e) => e.id).sort()).toEqual(["t-1", "t-2", "t-3"]);
    expect(filterEntries(all, { invoiced: "no" })).toHaveLength(all.length - 3);
    const today = getToday();
    const yesterday = addDays(today, -1);
    const ranged = filterEntries(all, { from: yesterday, to: yesterday });
    expect(ranged.length).toBeGreaterThan(0);
    expect(filterEntries(all, { from: today })).toHaveLength(0);
  });

  it("summarizes hours and the amount for hourly projects only", () => {
    const { result } = render();
    const projects = result.current.data.data.projects;
    const base = result.current.time.entries[0];
    const mk = (projectId: string, minutes: number, billable: boolean) => ({
      ...base,
      projectId,
      durationMinutes: minutes,
      billable,
    });
    const rate = projects.find((p) => p.id === "p-2")!.hourlyRateCents!;
    const summary = summarize([mk("p-2", 90, true), mk("p-2", 60, false), mk("p-1", 120, true)], projects);
    expect(summary.totalMinutes).toBe(270);
    expect(summary.billableMinutes).toBe(210);
    expect(summary.billableAmountCents).toBe(Math.round(1.5 * rate));
  });

  it("getBillableHoursThisWeek sums billable hours of the current week", () => {
    const { result } = render();
    const today = getToday();
    const { from, to } = weekRange(today);
    const expected =
      filterEntries(result.current.time.entries, { from, to, billable: "yes" }).reduce(
        (s, e) => s + e.durationMinutes,
        0,
      ) / 60;
    expect(getBillableHoursThisWeek(result.current.time.entries, today)).toBeCloseTo(expected, 2);
  });
});

describe("HU-06.4 Editar y eliminar registros", () => {
  it("updates a non-invoiced entry with the same validations", () => {
    const { result } = render();
    let ok = false;
    act(() => {
      ok = result.current.time.updateEntry("t-5", { ...values, description: "Edited", endTime: "10:00" });
    });
    expect(ok).toBe(true);
    expect(result.current.time.entries.find((e) => e.id === "t-5")).toMatchObject({
      description: "Edited",
      durationMinutes: 60,
    });
  });

  it("does not edit or delete invoiced entries", () => {
    const { result } = render();
    const invoiced = result.current.time.entries.find((e) => e.id === "t-1")!;
    let updated = true;
    let deleted = true;
    act(() => {
      updated = result.current.time.updateEntry("t-1", { ...values, description: "Hacked" });
      deleted = result.current.time.deleteEntry(invoiced);
    });
    expect(updated).toBe(false);
    expect(deleted).toBe(false);
    expect(result.current.time.entries.find((e) => e.id === "t-1")?.description).not.toBe("Hacked");
  });

  it("deletes an entry and restores it at the original index via the undo toast", async () => {
    const { result } = render();
    const target = result.current.time.entries[6];
    const before = result.current.time.entries.length;
    act(() => {
      result.current.time.deleteEntry(target);
    });
    expect(result.current.time.entries).toHaveLength(before - 1);
    expect(result.current.time.entries.find((e) => e.id === target.id)).toBeUndefined();

    act(() => {
      result.current.data.dispatch({ type: "RESTORE", collection: "timeEntries", item: target, index: 6 });
    });
    expect(result.current.time.entries).toHaveLength(before);
    expect(result.current.time.entries[6].id).toBe(target.id);
  });
});
