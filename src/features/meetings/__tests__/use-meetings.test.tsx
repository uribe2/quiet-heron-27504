import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMeetings } from "../use-meetings";
import { useData } from "@/context/data-context";
import { ProvidersWrapper } from "@/test/render-with-providers";
import type { MeetingFormValues } from "../schema";

const future = new Date(Date.now() + 86400000).toISOString();

const baseValues: MeetingFormValues = {
  title: "New Meeting",
  startsAt: future,
  durationMinutes: 30,
  mode: "call",
};

function useTestHooks() {
  return { meetings: useMeetings(), data: useData() };
}

describe("HU-10.2 Agendar reunión", () => {
  it("creates a scheduled meeting", () => {
    const { result } = renderHook(() => useMeetings(), { wrapper: ProvidersWrapper });
    const before = result.current.meetings.length;

    act(() => {
      result.current.createMeeting(baseValues);
    });

    expect(result.current.meetings).toHaveLength(before + 1);
    expect(result.current.meetings.at(-1)).toMatchObject({ title: "New Meeting", status: "scheduled" });
  });
});

describe("HU-10.3 Editar, completar y cancelar reunión", () => {
  it("cancelMeeting sets status to cancelled", () => {
    const { result } = renderHook(() => useMeetings(), { wrapper: ProvidersWrapper });
    const target = result.current.meetings.find((m) => m.id === "m-1")!;

    act(() => {
      result.current.cancelMeeting(target);
    });

    expect(result.current.meetings.find((m) => m.id === "m-1")?.status).toBe("cancelled");
  });

  it("markDone sets status to done and saves notes", () => {
    const { result } = renderHook(() => useMeetings(), { wrapper: ProvidersWrapper });
    const target = result.current.meetings.find((m) => m.id === "m-1")!;

    act(() => {
      result.current.markDone(target, "Great call", false);
    });

    const updated = result.current.meetings.find((m) => m.id === "m-1");
    expect(updated?.status).toBe("done");
    expect(updated?.notes).toBe("Great call");
  });

  it("markDone with registerInteraction creates a linked interaction", () => {
    const { result } = renderHook(() => useTestHooks(), { wrapper: ProvidersWrapper });
    const target = result.current.data.data.meetings.find((m) => m.id === "m-1")!;
    const before = result.current.data.data.interactions.length;

    act(() => {
      result.current.meetings.markDone(target, "Great call", true);
    });

    expect(result.current.data.data.interactions).toHaveLength(before + 1);
    const created = result.current.data.data.interactions.at(-1);
    expect(created?.channel).toBe("meeting");
    expect(created?.meetingId).toBe("m-1");
  });
});

describe("HU-10.4 Eliminar reunión", () => {
  it("deleteMeeting removes the meeting but keeps any interaction it generated", () => {
    const { result } = renderHook(() => useTestHooks(), { wrapper: ProvidersWrapper });
    const target = result.current.data.data.meetings.find((m) => m.id === "m-3")!;
    const interactionsBefore = result.current.data.data.interactions.length;

    act(() => {
      result.current.meetings.deleteMeeting(target);
    });

    expect(result.current.data.data.meetings.find((m) => m.id === "m-3")).toBeUndefined();
    expect(result.current.data.data.interactions).toHaveLength(interactionsBefore);
  });
});
