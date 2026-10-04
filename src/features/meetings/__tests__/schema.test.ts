import { describe, it, expect } from "vitest";
import { buildMeetingSchema } from "../schema";

const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
const past = new Date(Date.now() - 86400000).toISOString().slice(0, 16);

const base = {
  title: "Kickoff",
  durationMinutes: 30,
  mode: "call" as const,
};

describe("HU-10.2 Agendar reunión", () => {
  it("requires the start time to be in the future when creating", () => {
    const result = buildMeetingSchema(true).safeParse({ ...base, startsAt: past });
    expect(result.success).toBe(false);
  });

  it("accepts a future start time when creating", () => {
    const result = buildMeetingSchema(true).safeParse({ ...base, startsAt: future });
    expect(result.success).toBe(true);
  });

  it("requires a valid URL when mode is video", () => {
    const missing = buildMeetingSchema(true).safeParse({ ...base, mode: "video", startsAt: future });
    expect(missing.success).toBe(false);

    const invalid = buildMeetingSchema(true).safeParse({
      ...base,
      mode: "video",
      startsAt: future,
      locationOrLink: "not-a-url",
    });
    expect(invalid.success).toBe(false);

    const valid = buildMeetingSchema(true).safeParse({
      ...base,
      mode: "video",
      startsAt: future,
      locationOrLink: "https://meet.example.com/x",
    });
    expect(valid.success).toBe(true);
  });

  it("allows a past start time when editing (requireFutureStart = false)", () => {
    const result = buildMeetingSchema(false).safeParse({ ...base, startsAt: past });
    expect(result.success).toBe(true);
  });
});

describe("Mensajes de validación de reuniones", () => {
  const messages = (input: Record<string, unknown>, requireFuture = true) => {
    const r = buildMeetingSchema(requireFuture).safeParse(input);
    return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
  };

  it("reports required title, max length, empty date and duration range", () => {
    expect(messages({ ...base, title: " ", startsAt: future }).title).toBe("required");
    expect(messages({ ...base, title: "x".repeat(151), startsAt: future }).title).toBe("maxLength");
    expect(messages({ ...base, startsAt: "" }).startsAt).toBe("required");
    expect(messages({ ...base, startsAt: past }).startsAt).toBe("dateNotPast");
    expect(messages({ ...base, startsAt: future, durationMinutes: 10 }).durationMinutes).toBe("durationRange");
    expect(messages({ ...base, startsAt: future, durationMinutes: 500 }).durationMinutes).toBe("durationRange");
    expect(messages({ ...base, startsAt: future, durationMinutes: NaN }).durationMinutes).toBe("durationRange");
    expect(messages({ ...base, mode: "video", startsAt: future, locationOrLink: "x" }).locationOrLink).toBe("invalidUrl");
  });
});
