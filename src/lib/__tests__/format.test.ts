import { describe, it, expect } from "vitest";
import {
  formatCents,
  formatDateISO,
  centsFromAmount,
  amountFromCents,
  formatElapsed,
} from "../format";

describe("format.ts", () => {
  it("formats cents as currency for the given locale", () => {
    expect(formatCents(850000, "USD", "es-CO")).toContain("8.500,00");
    expect(formatCents(850000, "USD", "en-US")).toContain("8,500.00");
  });

  it("formats an ISO date using the active locale", () => {
    const formatted = formatDateISO("2026-03-05", "en-US", { day: "2-digit", month: "short", year: "numeric" });
    expect(formatted).toMatch(/Mar/);
    expect(formatted).toMatch(/05/);
  });

  it("converts between decimal amounts and integer cents", () => {
    expect(centsFromAmount(85.5)).toBe(8550);
    expect(amountFromCents(8550)).toBe(85.5);
  });

  it("formats elapsed milliseconds as HH:MM:SS", () => {
    expect(formatElapsed(0)).toBe("00:00:00");
    expect(formatElapsed(3661000)).toBe("01:01:01");
  });
});
